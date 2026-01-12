// ============================================================
// API Integration Tests
// ============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { app } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, 'fixtures');

// Helper to ensure fixtures exist
function ensureFixtures(): void {
  const binaryPath = join(fixturesDir, 'cube-binary.stl');

  if (!existsSync(binaryPath)) {
    const cubeVertices = [
      [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
      [0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10],
    ];

    const cubeTriangles = [
      { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[2], v3: cubeVertices[1] },
      { normal: [0, 0, -1], v1: cubeVertices[0], v2: cubeVertices[3], v3: cubeVertices[2] },
      { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[5], v3: cubeVertices[6] },
      { normal: [0, 0, 1], v1: cubeVertices[4], v2: cubeVertices[6], v3: cubeVertices[7] },
      { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[1], v3: cubeVertices[5] },
      { normal: [0, -1, 0], v1: cubeVertices[0], v2: cubeVertices[5], v3: cubeVertices[4] },
      { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[3], v3: cubeVertices[7] },
      { normal: [0, 1, 0], v1: cubeVertices[2], v2: cubeVertices[7], v3: cubeVertices[6] },
      { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[4], v3: cubeVertices[7] },
      { normal: [-1, 0, 0], v1: cubeVertices[0], v2: cubeVertices[7], v3: cubeVertices[3] },
      { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[2], v3: cubeVertices[6] },
      { normal: [1, 0, 0], v1: cubeVertices[1], v2: cubeVertices[6], v3: cubeVertices[5] },
    ];

    const buffer = Buffer.alloc(84 + 12 * 50);
    buffer.write('Binary STL cube fixture', 0);
    buffer.writeUInt32LE(12, 80);
    let offset = 84;
    for (const tri of cubeTriangles) {
      buffer.writeFloatLE(tri.normal[0], offset);
      buffer.writeFloatLE(tri.normal[1], offset + 4);
      buffer.writeFloatLE(tri.normal[2], offset + 8);
      buffer.writeFloatLE(tri.v1[0], offset + 12);
      buffer.writeFloatLE(tri.v1[1], offset + 16);
      buffer.writeFloatLE(tri.v1[2], offset + 20);
      buffer.writeFloatLE(tri.v2[0], offset + 24);
      buffer.writeFloatLE(tri.v2[1], offset + 28);
      buffer.writeFloatLE(tri.v2[2], offset + 32);
      buffer.writeFloatLE(tri.v3[0], offset + 36);
      buffer.writeFloatLE(tri.v3[1], offset + 40);
      buffer.writeFloatLE(tri.v3[2], offset + 44);
      buffer.writeUInt16LE(0, offset + 48);
      offset += 50;
    }
    writeFileSync(binaryPath, buffer);
  }
}

describe('API Integration', () => {
  beforeAll(() => {
    ensureFixtures();
  });

  describe('POST /api/analyze', () => {
    it('should analyze a valid STL file and return 200 with required fields', async () => {
      const stlBuffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));

      const response = await request(app)
        .post('/api/analyze')
        .attach('file', stlBuffer, 'cube.stl');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('volume_cm3');
      expect(response.body).toHaveProperty('bounding_box_mm');
      expect(response.body).toHaveProperty('prices_try');
      expect(response.body).toHaveProperty('meta');

      // Check bounding box structure
      expect(response.body.bounding_box_mm).toHaveProperty('x');
      expect(response.body.bounding_box_mm).toHaveProperty('y');
      expect(response.body.bounding_box_mm).toHaveProperty('z');

      // Check prices structure
      expect(response.body.prices_try).toHaveProperty('fdm_pla');
      expect(response.body.prices_try).toHaveProperty('sla_resin');
      expect(response.body.prices_try).toHaveProperty('sls_pa12');

      // Check meta structure
      expect(response.body.meta).toHaveProperty('file_name');
      expect(response.body.meta).toHaveProperty('file_size_bytes');
      expect(response.body.meta).toHaveProperty('parse_ms');
      expect(response.body.meta).toHaveProperty('compute_ms');

      // Verify values for 10mm cube (1 cm3)
      expect(response.body.volume_cm3).toBeCloseTo(1, 1);
      expect(response.body.bounding_box_mm.x).toBe(10);
      expect(response.body.bounding_box_mm.y).toBe(10);
      expect(response.body.bounding_box_mm.z).toBe(10);

      // Check new fields for estimate API
      expect(response.body).toHaveProperty('analysis_id');
      expect(typeof response.body.analysis_id).toBe('string');
      expect(response.body.analysis_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      expect(response.body).toHaveProperty('surface_area_mm2');
      expect(typeof response.body.surface_area_mm2).toBe('number');
      // 10mm cube should have surface area of 600 mm²
      expect(response.body.surface_area_mm2).toBeCloseTo(600, 0);
    });

    it('should return 400 for non-STL files', async () => {
      const response = await request(app)
        .post('/api/analyze')
        .attach('file', Buffer.from('not an stl'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('unsupported_format');
    });

    it('should return 400 when no file is provided', async () => {
      const response = await request(app).post('/api/analyze');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('unsupported_format');
    });

    it('should return 422 for invalid/corrupt STL', async () => {
      // Create a fake STL that looks binary but has invalid data
      const fakeStl = Buffer.alloc(100);
      fakeStl.write('not solid', 0); // Not ASCII
      fakeStl.writeUInt32LE(1000000, 80); // Invalid triangle count

      const response = await request(app)
        .post('/api/analyze')
        .attach('file', fakeStl, 'corrupt.stl');

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('invalid_mesh');
    });
  });

  describe('POST /api/estimate', () => {
    it('should estimate with valid analysis_id from /api/analyze', async () => {
      // First, analyze a file
      const stlBuffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const analyzeResponse = await request(app)
        .post('/api/analyze')
        .attach('file', stlBuffer, 'cube.stl');

      expect(analyzeResponse.status).toBe(200);
      const analysisId = analyzeResponse.body.analysis_id;

      // Now estimate with that analysis_id
      const estimateResponse = await request(app)
        .post('/api/estimate')
        .send({
          analysis_id: analysisId,
          technology: 'fdm_pla',
          profile: {
            line_width_mm: 0.45,
            layer_height_mm: 0.2,
            wall_count: 2,
            top_layers: 4,
            bottom_layers: 4,
            infill_percent: 20,
            support_level: 'none',
            waste_percent: 0.05,
            density_g_per_cm3: 1.24,
            flow_mm3_per_s: 10,
          },
          pricing: {
            mode: 'cost_plus',
            filament_price_try_per_kg: 800,
            machine_rate_try_per_h: 50,
            setup_fee_try: 10,
            postprocess_fee_try: 0,
            labor_fee_try: 0,
            margin_percent: 0.25,
          },
        });

      expect(estimateResponse.status).toBe(200);
      expect(estimateResponse.body).toHaveProperty('analysis_id', analysisId);
      expect(estimateResponse.body).toHaveProperty('geometry');
      expect(estimateResponse.body).toHaveProperty('technology', 'fdm_pla');
      expect(estimateResponse.body).toHaveProperty('profile');
      expect(estimateResponse.body).toHaveProperty('estimate');
      expect(estimateResponse.body).toHaveProperty('pricing');
      expect(estimateResponse.body).toHaveProperty('price_try');
      expect(estimateResponse.body).toHaveProperty('cache_ttl_ms');

      // Check geometry
      expect(estimateResponse.body.geometry.volume_cm3).toBeCloseTo(1, 1);
      expect(estimateResponse.body.geometry.surface_area_mm2).toBeCloseTo(600, 0);

      // Check estimate
      expect(estimateResponse.body.estimate.used_volume_cm3).toBeGreaterThan(0);
      expect(estimateResponse.body.estimate.material_g).toBeGreaterThan(0);
      expect(estimateResponse.body.estimate.material_kg).toBeGreaterThan(0);
      expect(estimateResponse.body.estimate.time_h).toBeGreaterThan(0);
      expect(estimateResponse.body.estimate.breakdown).toBeDefined();

      // Check price is a number and reasonable
      expect(typeof estimateResponse.body.price_try).toBe('number');
      expect(estimateResponse.body.price_try).toBeGreaterThan(0);
    });

    it('should return 400 when analysis_id is missing', async () => {
      const response = await request(app)
        .post('/api/estimate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('invalid_request');
    });

    it('should return 404 for unknown analysis_id', async () => {
      const response = await request(app)
        .post('/api/estimate')
        .send({
          analysis_id: '00000000-0000-0000-0000-000000000000',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('not_found');
    });

    it('should use default profile values when not specified', async () => {
      // Analyze a file first
      const stlBuffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const analyzeResponse = await request(app)
        .post('/api/analyze')
        .attach('file', stlBuffer, 'cube.stl');

      const analysisId = analyzeResponse.body.analysis_id;

      // Estimate with minimal request
      const estimateResponse = await request(app)
        .post('/api/estimate')
        .send({
          analysis_id: analysisId,
        });

      expect(estimateResponse.status).toBe(200);
      expect(estimateResponse.body.profile).toBeDefined();
      expect(estimateResponse.body.pricing.mode).toBe('cost_plus');
    });

    it('should support volumetric pricing mode', async () => {
      // Analyze a file first
      const stlBuffer = readFileSync(join(fixturesDir, 'cube-binary.stl'));
      const analyzeResponse = await request(app)
        .post('/api/analyze')
        .attach('file', stlBuffer, 'cube.stl');

      const analysisId = analyzeResponse.body.analysis_id;

      // Estimate with volumetric pricing
      const estimateResponse = await request(app)
        .post('/api/estimate')
        .send({
          analysis_id: analysisId,
          pricing: {
            mode: 'volumetric',
          },
        });

      expect(estimateResponse.status).toBe(200);
      expect(estimateResponse.body.pricing.mode).toBe('volumetric');
      expect(estimateResponse.body.price_try).toBeGreaterThan(0);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});

