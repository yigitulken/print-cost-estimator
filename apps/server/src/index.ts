// ============================================================
// 3D Print Cost Estimator - API Server
// ============================================================

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { randomUUID } from 'crypto';
import { 
  MAX_FILE_SIZE_BYTES,
  LEGACY_MAX_FILE_SIZE_BYTES,
  type AnalysisResult, 
  type ApiError,
  type EstimateRequest,
  type EstimateResponse,
  type FdmProfile,
  type PricingConfig,
} from '@print-cost/shared';
import { parseSTL, computeBoundingBox, computeVolumeMm3, mm3ToCm3, computeSurfaceAreaMm2 } from './stl-parser.js';
import { calculateAllPrices, calculatePrice, roundToNearest10 } from './price-calculator.js';
import { estimateFdm, DEFAULT_FDM_PROFILE, type GeometryMetrics } from './fdm-estimator.js';
import { isR2Configured, initiateMultipartUpload, getPresignedPartUrl, completeMultipartUpload, abortMultipartUpload, getObjectStream, getObjectMetadata, PART_SIZE_BYTES } from './r2.js';
import { createUploadToken, verifyUploadToken } from './upload-token.js';
import { analyzeSTLStream } from './stl-stream-analyze.js';

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Analysis Cache
// ============================================================

interface CacheEntry {
  created_at_ms: number;
  expires_at_ms: number;
  file_name: string;
  file_size_bytes: number;
  bounding_box_mm: { x: number; y: number; z: number };
  volume_mm3: number;
  volume_cm3: number;
  surface_area_mm2: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const analysisCache = new Map<string, CacheEntry>();

/**
 * Clean up expired cache entries
 */
function cleanupCache(): void {
  const now = Date.now();
  for (const [id, entry] of analysisCache.entries()) {
    if (entry.expires_at_ms < now) {
      analysisCache.delete(id);
    }
  }
}

/**
 * Get cache entry if it exists and hasn't expired
 */
function getCacheEntry(id: string): CacheEntry | null {
  cleanupCache();
  const entry = analysisCache.get(id);
  if (!entry) return null;
  if (entry.expires_at_ms < Date.now()) {
    analysisCache.delete(id);
    return null;
  }
  return entry;
}

/**
 * Store cache entry
 */
function setCacheEntry(id: string, entry: Omit<CacheEntry, 'created_at_ms' | 'expires_at_ms'>): void {
  cleanupCache();
  const now = Date.now();
  analysisCache.set(id, {
    ...entry,
    created_at_ms: now,
    expires_at_ms: now + CACHE_TTL_MS,
  });
}

// ============================================================
// Middleware
// ============================================================

// CORS configuration
const allowedOrigins = [
  'https://octamak.com',
  'https://www.octamak.com',
  'http://localhost:5173', // Local development
  'http://localhost:3000', // Alternative local port
];

// Allow Cloudflare Pages preview URLs (*.pages.dev)
const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true; // Allow requests with no origin (e.g., mobile apps, Postman)
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.pages.dev')) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json({ limit: '2mb' })); // Keep JSON payloads small

// Multer configuration for STL file uploads (LEGACY - capped at 25MB)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: LEGACY_MAX_FILE_SIZE_BYTES, // 25MB cap for legacy endpoint
  },
  fileFilter: (_req, file, cb) => {
    // Check file extension
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (ext !== 'stl') {
      cb(new Error('unsupported_format'));
      return;
    }
    cb(null, true);
  },
});

// Multer configuration for quote form (multiple file types)
const quoteUpload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 10, // Max 10 files
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase().split('.').pop();
    const allowedExtensions = ['stl', 'step', 'stp', 'iges', 'igs', 'zip', 'jpg', 'jpeg', 'png', 'pdf'];
    if (!ext || !allowedExtensions.includes(ext)) {
      cb(new Error('unsupported_format'));
      return;
    }
    cb(null, true);
  },
});

// Error response helper
function sendError(res: Response, status: number, code: string, message: string, details?: unknown): void {
  const error: ApiError = {
    error: {
      code,
      message,
      details,
    },
  };
  res.status(status).json(error);
}

// ============================================================
// POST /api/analyze - Analyze STL file
// ============================================================

app.post('/api/analyze', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          sendError(res, 413, 'file_too_large', `File exceeds maximum size of ${LEGACY_MAX_FILE_SIZE_BYTES / 1024 / 1024}MB for this endpoint. Use multipart upload for larger files up to 400MB.`);
          return;
        }
        sendError(res, 400, 'upload_error', err.message);
        return;
      }
      if (err instanceof Error && err.message === 'unsupported_format') {
        sendError(res, 400, 'unsupported_format', 'Only STL files are supported');
        return;
      }
      next(err);
      return;
    }

    // Process the file
    handleAnalysis(req, res);
  });
});

function handleAnalysis(req: Request, res: Response): void {
  try {
    const file = req.file;

    if (!file) {
      sendError(res, 400, 'unsupported_format', 'No file provided');
      return;
    }

    // Parse STL
    const parseStart = performance.now();
    let parsed;
    try {
      parsed = parseSTL(file.buffer);
      
      // Reject ASCII STL files (binary-only policy)
      if (!parsed.isBinary) {
        sendError(res, 400, 'unsupported_format', 'ASCII STL format is not supported. Please convert to binary STL format.');
        return;
      }
    } catch (parseError) {
      sendError(res, 422, 'invalid_mesh', 'Failed to parse STL file', {
        reason: parseError instanceof Error ? parseError.message : 'Unknown parse error',
      });
      return;
    }
    const parseEnd = performance.now();

    // Validate mesh
    if (parsed.triangles.length === 0) {
      sendError(res, 422, 'invalid_mesh', 'STL file contains no triangles');
      return;
    }

    // Compute metrics
    const computeStart = performance.now();
    const boundingBox = computeBoundingBox(parsed.triangles);
    const volumeMm3 = computeVolumeMm3(parsed.triangles);
    const volumeCm3 = mm3ToCm3(volumeMm3);
    const surfaceAreaMm2 = computeSurfaceAreaMm2(parsed.triangles);
    const computeEnd = performance.now();

    // Validate volume
    if (volumeCm3 <= 0) {
      sendError(res, 422, 'invalid_mesh', 'Computed volume is zero or negative');
      return;
    }

    // Calculate prices
    const prices = calculateAllPrices(volumeCm3);

    // Generate analysis ID and cache the data
    const analysisId = randomUUID();
    setCacheEntry(analysisId, {
      file_name: file.originalname,
      file_size_bytes: file.size,
      bounding_box_mm: boundingBox,
      volume_mm3: volumeMm3,
      volume_cm3: volumeCm3,
      surface_area_mm2: surfaceAreaMm2,
    });

    // Build response
    const result: AnalysisResult = {
      volume_cm3: Math.round(volumeCm3 * 1000) / 1000, // Round to 3 decimals
      bounding_box_mm: boundingBox,
      prices_try: prices,
      meta: {
        file_name: file.originalname,
        file_size_bytes: file.size,
        parse_ms: Math.round(parseEnd - parseStart),
        compute_ms: Math.round(computeEnd - computeStart),
      },
      analysis_id: analysisId,
      surface_area_mm2: Math.round(surfaceAreaMm2 * 100) / 100, // Round to 2 decimals
    };

    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    sendError(res, 500, 'internal_error', 'An unexpected error occurred');
  }
}

// ============================================================
// POST /api/uploads/init - Initialize multipart upload
// ============================================================

app.post('/api/uploads/init', async (req: Request, res: Response) => {
  try {
    // Check if R2 is configured
    if (!isR2Configured()) {
      sendError(res, 503, 'service_unavailable', 'R2 storage is not configured. Using legacy upload endpoint.');
      return;
    }

    const body = req.body as { fileName?: string; fileSize?: number; contentType?: string };

    // Validate request
    if (!body.fileName || !body.fileSize || !body.contentType) {
      sendError(res, 400, 'invalid_request', 'fileName, fileSize, and contentType are required');
      return;
    }

    // Validate file size
    if (body.fileSize > MAX_FILE_SIZE_BYTES) {
      sendError(res, 413, 'file_too_large', `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
      return;
    }

    if (body.fileSize <= 0) {
      sendError(res, 400, 'invalid_request', 'File size must be positive');
      return;
    }

    // Validate content type
    if (body.contentType !== 'application/sla' && body.contentType !== 'application/octet-stream') {
      sendError(res, 400, 'unsupported_format', 'Only STL files are supported');
      return;
    }

    // Validate file extension
    if (!body.fileName.toLowerCase().endsWith('.stl')) {
      sendError(res, 400, 'unsupported_format', 'Only STL files are supported');
      return;
    }

    // Generate unique key for R2
    const key = `uploads/${randomUUID()}/${body.fileName}`;

    // Initiate multipart upload
    const uploadId = await initiateMultipartUpload(key, body.contentType);

    // Create signed token
    const token = createUploadToken({
      key,
      uploadId,
      fileSize: body.fileSize,
      partSize: PART_SIZE_BYTES,
      fileName: body.fileName,
    });

    res.json({
      token,
      key,
      uploadId,
      partSize: PART_SIZE_BYTES,
    });
  } catch (error) {
    console.error('Upload init error:', error);
    sendError(res, 500, 'internal_error', 'Failed to initialize upload');
  }
});

// ============================================================
// POST /api/uploads/part-url - Get presigned URL for part upload
// ============================================================

app.post('/api/uploads/part-url', async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      sendError(res, 503, 'service_unavailable', 'R2 storage is not configured');
      return;
    }

    const body = req.body as { token?: string; partNumber?: number };

    // Validate request
    if (!body.token || !body.partNumber) {
      sendError(res, 400, 'invalid_request', 'token and partNumber are required');
      return;
    }

    // Verify token
    let session;
    try {
      session = verifyUploadToken(body.token);
    } catch (error) {
      sendError(res, 401, 'invalid_request', error instanceof Error ? error.message : 'Invalid token');
      return;
    }

    // Validate part number
    if (body.partNumber < 1 || body.partNumber > 10000) {
      sendError(res, 400, 'invalid_request', 'Part number must be between 1 and 10000');
      return;
    }

    // Generate presigned URL
    const url = await getPresignedPartUrl(session.key, session.uploadId, body.partNumber);

    res.json({ url });
  } catch (error) {
    console.error('Part URL error:', error);
    sendError(res, 500, 'internal_error', 'Failed to generate presigned URL');
  }
});

// ============================================================
// POST /api/uploads/complete - Complete multipart upload
// ============================================================

app.post('/api/uploads/complete', async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      sendError(res, 503, 'service_unavailable', 'R2 storage is not configured');
      return;
    }

    const body = req.body as { token?: string; parts?: Array<{ partNumber: number; etag: string }> };

    // Validate request
    if (!body.token || !body.parts || !Array.isArray(body.parts)) {
      sendError(res, 400, 'invalid_request', 'token and parts array are required');
      return;
    }

    // Verify token
    let session;
    try {
      session = verifyUploadToken(body.token);
    } catch (error) {
      sendError(res, 401, 'invalid_request', error instanceof Error ? error.message : 'Invalid token');
      return;
    }

    // Validate parts
    if (body.parts.length === 0) {
      sendError(res, 400, 'invalid_request', 'At least one part is required');
      return;
    }

    for (const part of body.parts) {
      if (!part.partNumber || !part.etag) {
        sendError(res, 400, 'invalid_request', 'Each part must have partNumber and etag');
        return;
      }
    }

    // Map to S3 format
    const s3Parts = body.parts.map(p => ({
      PartNumber: p.partNumber,
      ETag: p.etag,
    }));

    // Complete multipart upload
    try {
      await completeMultipartUpload(session.key, session.uploadId, s3Parts);
    } catch (error) {
      console.error('Complete upload error:', error);
      // Try to abort the upload
      await abortMultipartUpload(session.key, session.uploadId);
      sendError(res, 500, 'internal_error', 'Failed to complete upload');
      return;
    }

    res.json({ key: session.key });
  } catch (error) {
    console.error('Complete upload error:', error);
    sendError(res, 500, 'internal_error', 'Failed to complete upload');
  }
});

// ============================================================
// POST /api/analyze-upload - Analyze uploaded STL from R2
// ============================================================

app.post('/api/analyze-upload', async (req: Request, res: Response) => {
  try {
    if (!isR2Configured()) {
      sendError(res, 503, 'service_unavailable', 'R2 storage is not configured');
      return;
    }

    const body = req.body as { token?: string };

    // Validate request
    if (!body.token) {
      sendError(res, 400, 'invalid_request', 'token is required');
      return;
    }

    // Verify token
    let session;
    try {
      session = verifyUploadToken(body.token);
    } catch (error) {
      sendError(res, 401, 'invalid_request', error instanceof Error ? error.message : 'Invalid token');
      return;
    }

    // Verify object exists
    let metadata;
    try {
      metadata = await getObjectMetadata(session.key);
    } catch (error) {
      sendError(res, 404, 'not_found', 'Uploaded file not found');
      return;
    }

    // Stream and analyze STL
    const analyzeStart = performance.now();
    let analysis;
    try {
      const stream = await getObjectStream(session.key);
      analysis = await analyzeSTLStream(stream);
    } catch (error) {
      console.error('Stream analysis error:', error);
      if (error instanceof Error && error.message.includes('ASCII STL')) {
        sendError(res, 400, 'unsupported_format', error.message);
      } else {
        sendError(res, 422, 'invalid_mesh', 'Failed to analyze STL file', {
          reason: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      return;
    }
    const analyzeEnd = performance.now();

    // Validate volume
    const volumeCm3 = analysis.volumeMm3 / 1000;
    if (volumeCm3 <= 0) {
      sendError(res, 422, 'invalid_mesh', 'Computed volume is zero or negative');
      return;
    }

    // Calculate prices
    const prices = calculateAllPrices(volumeCm3);

    // Generate analysis ID and cache the data
    const analysisId = randomUUID();
    setCacheEntry(analysisId, {
      file_name: session.fileName,
      file_size_bytes: metadata.size,
      bounding_box_mm: analysis.boundingBoxMm,
      volume_mm3: analysis.volumeMm3,
      volume_cm3: volumeCm3,
      surface_area_mm2: analysis.surfaceAreaMm2,
    });

    // Build response
    const result: AnalysisResult = {
      volume_cm3: Math.round(volumeCm3 * 1000) / 1000,
      bounding_box_mm: analysis.boundingBoxMm,
      prices_try: prices,
      meta: {
        file_name: session.fileName,
        file_size_bytes: metadata.size,
        parse_ms: 0, // Streaming doesn't have separate parse phase
        compute_ms: Math.round(analyzeEnd - analyzeStart),
      },
      analysis_id: analysisId,
      surface_area_mm2: Math.round(analysis.surfaceAreaMm2 * 100) / 100,
    };

    res.json(result);
  } catch (error) {
    console.error('Analyze upload error:', error);
    sendError(res, 500, 'internal_error', 'An unexpected error occurred');
  }
});

// ============================================================
// POST /api/estimate - Estimate with profile
// ============================================================

app.post('/api/estimate', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<EstimateRequest>;

    // Validate request
    if (!body.analysis_id) {
      sendError(res, 400, 'invalid_request', 'analysis_id is required');
      return;
    }

    // Check cache
    const cached = getCacheEntry(body.analysis_id);
    if (!cached) {
      sendError(res, 404, 'not_found', 'Analysis not found or expired. Please upload the file again.');
      return;
    }

    // Validate technology
    const technology = body.technology || 'fdm_pla';
    if (technology !== 'fdm_pla') {
      sendError(res, 400, 'invalid_request', 'Only fdm_pla technology is currently supported');
      return;
    }

    // Merge profile with defaults
    const profile: FdmProfile = {
      ...DEFAULT_FDM_PROFILE,
      ...body.profile,
    };

    // Clamp profile values to safe ranges
    profile.line_width_mm = Math.max(0.1, Math.min(2, profile.line_width_mm));
    profile.layer_height_mm = Math.max(0.05, Math.min(1, profile.layer_height_mm));
    profile.wall_count = Math.max(0, Math.min(20, Math.floor(profile.wall_count)));
    profile.top_layers = Math.max(0, Math.min(20, Math.floor(profile.top_layers)));
    profile.bottom_layers = Math.max(0, Math.min(20, Math.floor(profile.bottom_layers)));
    profile.infill_percent = Math.max(0, Math.min(100, profile.infill_percent));
    profile.waste_percent = Math.max(0, Math.min(1, profile.waste_percent));
    profile.density_g_per_cm3 = Math.max(0.5, Math.min(5, profile.density_g_per_cm3));
    profile.flow_mm3_per_s = Math.max(1, Math.min(100, profile.flow_mm3_per_s));

    // Build geometry metrics
    const metrics: GeometryMetrics = {
      volume_mm3: cached.volume_mm3,
      surface_area_mm2: cached.surface_area_mm2,
      height_mm: cached.bounding_box_mm.z,
    };

    // Run FDM estimation
    const estimate = estimateFdm(metrics, profile);

    // Pricing configuration with defaults
    const pricingConfig: PricingConfig = {
      mode: body.pricing?.mode || 'cost_plus',
      filament_price_try_per_kg: body.pricing?.filament_price_try_per_kg ?? 800,
      machine_rate_try_per_h: body.pricing?.machine_rate_try_per_h ?? 0,
      setup_fee_try: body.pricing?.setup_fee_try ?? 0,
      postprocess_fee_try: body.pricing?.postprocess_fee_try ?? 0,
      labor_fee_try: body.pricing?.labor_fee_try ?? 0,
      margin_percent: body.pricing?.margin_percent ?? 0.25,
    };

    // Calculate price based on mode
    let priceTry: number;
    if (pricingConfig.mode === 'volumetric') {
      // Use existing volumetric pricing but with used_volume_cm3
      priceTry = calculatePrice(
        estimate.used_volume_cm3,
        150, // FDM base fee
        12   // FDM rate per cm3
      );
    } else {
      // Cost-plus pricing
      const filamentCost = estimate.material_kg * pricingConfig.filament_price_try_per_kg!;
      const machineCost = estimate.time_h * pricingConfig.machine_rate_try_per_h!;
      const subtotal = filamentCost + machineCost + 
                      pricingConfig.setup_fee_try! + 
                      pricingConfig.postprocess_fee_try! + 
                      pricingConfig.labor_fee_try!;
      const marginTry = subtotal * pricingConfig.margin_percent!;
      priceTry = roundToNearest10(subtotal + marginTry);
    }

    // Build response
    const response: EstimateResponse = {
      analysis_id: body.analysis_id,
      geometry: {
        volume_cm3: cached.volume_cm3,
        surface_area_mm2: cached.surface_area_mm2,
        bounding_box_mm: cached.bounding_box_mm,
      },
      technology,
      profile,
      estimate: {
        used_volume_cm3: estimate.used_volume_cm3,
        material_g: estimate.material_g,
        material_kg: estimate.material_kg,
        time_h: estimate.time_h,
        breakdown: estimate.breakdown,
      },
      pricing: pricingConfig,
      price_try: priceTry,
      cache_ttl_ms: cached.expires_at_ms - Date.now(),
    };

    res.json(response);
  } catch (error) {
    console.error('Estimate error:', error);
    sendError(res, 500, 'internal_error', 'An unexpected error occurred');
  }
});

// ============================================================
// POST /api/quote - Quote request form submission
// ============================================================

app.post('/api/quote', (req: Request, res: Response, next: NextFunction) => {
  quoteUpload.array('files', 10)(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          sendError(res, 413, 'file_too_large', `File exceeds maximum size of ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`);
          return;
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          sendError(res, 400, 'too_many_files', 'Maximum 10 files allowed');
          return;
        }
        sendError(res, 400, 'upload_error', err.message);
        return;
      }
      if (err instanceof Error && err.message === 'unsupported_format') {
        sendError(res, 400, 'unsupported_format', 'Unsupported file format. Allowed: STL, STEP, IGES, ZIP, JPG, PNG, PDF');
        return;
      }
      next(err);
      return;
    }

    // Process the quote request
    handleQuoteRequest(req, res);
  });
});

function handleQuoteRequest(req: Request, res: Response): void {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const body = req.body;

    // Validate required fields
    if (!body.serviceType || !body.description || !body.name || !body.email || !body.phone || !body.deliveryExpectation) {
      sendError(res, 400, 'invalid_request', 'Missing required fields');
      return;
    }

    // Check total file size (200MB limit)
    if (files) {
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 200 * 1024 * 1024; // 200MB
      if (totalSize > maxTotalSize) {
        sendError(res, 413, 'file_too_large', 'Total file size exceeds 200MB');
        return;
      }
    }

    // Generate request ID
    const requestId = randomUUID();
    const receivedAt = new Date().toISOString();

    // Log request (in production, this would save to database or send email)
    console.log('='.repeat(60));
    console.log('📬 NEW QUOTE REQUEST');
    console.log('='.repeat(60));
    console.log(`Request ID: ${requestId}`);
    console.log(`Received: ${receivedAt}`);
    console.log('');
    console.log('Contact Information:');
    console.log(`  Name: ${body.name}`);
    console.log(`  Email: ${body.email}`);
    console.log(`  Phone: ${body.phone}`);
    if (body.city) {
      console.log(`  City: ${body.city}`);
    }
    console.log('');
    console.log('Project Details:');
    console.log(`  Service Type: ${body.serviceType}`);
    console.log(`  Description: ${body.description}`);
    if (body.material) {
      console.log(`  Material: ${body.material}`);
    }
    if (body.quantity) {
      console.log(`  Quantity: ${body.quantity}`);
    }
    console.log(`  Delivery: ${body.deliveryExpectation}`);
    console.log('');
    if (body.notes) {
      console.log(`Notes: ${body.notes}`);
      console.log('');
    }
    if (body.useCase) {
      console.log(`Use Case: ${body.useCase}`);
    }
    if (body.caseId) {
      console.log(`Reference Case: ${body.caseId}`);
    }
    if (files && files.length > 0) {
      console.log('');
      console.log('Attached Files:');
      files.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
      });
    }
    console.log('='.repeat(60));
    console.log('');

    // Send success response
    res.json({
      request_id: requestId,
      received_at: receivedAt,
    });
  } catch (error) {
    console.error('Quote request error:', error);
    sendError(res, 500, 'internal_error', 'An unexpected error occurred');
  }
}

// ============================================================
// Other Routes
// ============================================================

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    service: 'print-cost-server',
    message: 'Octamak API',
    version: '1.0.0',
  });
});

// Health check endpoints
const healthResponse = {
  ok: true,
  service: 'print-cost-server',
  status: 'healthy',
  timestamp: new Date().toISOString(),
};

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ...healthResponse,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ...healthResponse,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  sendError(res, 500, 'internal_error', 'An unexpected error occurred');
});

// Export app for testing
export { app };

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/analyze`);
    console.log(`   POST http://localhost:${PORT}/api/estimate`);
    console.log(`   POST http://localhost:${PORT}/api/quote`);
  });
}
