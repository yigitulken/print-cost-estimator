// ============================================================
// API Types for 3D Print Cost Estimator
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  z: number;
}

export interface Prices {
  fdm_pla: number;
  sla_resin: number;
  sls_pa12: number;
}

export interface AnalysisMeta {
  file_name: string;
  file_size_bytes: number;
  parse_ms: number;
  compute_ms: number;
}

export interface AnalysisResult {
  volume_cm3: number;
  bounding_box_mm: BoundingBox;
  prices_try: Prices;
  meta: AnalysisMeta;
  // Optional fields for new API
  analysis_id?: string;
  surface_area_mm2?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Error codes
export type ErrorCode =
  | 'unsupported_format'
  | 'file_too_large'
  | 'invalid_mesh'
  | 'internal_error';

// Price configuration
export interface PriceConfig {
  baseFee: number;
  ratePerCm3: number;
}

export const PRICE_CONFIG: Record<keyof Prices, PriceConfig> = {
  fdm_pla: { baseFee: 150, ratePerCm3: 12 },
  sla_resin: { baseFee: 300, ratePerCm3: 30 },
  sls_pa12: { baseFee: 600, ratePerCm3: 45 },
};

// File constraints
export const MAX_FILE_SIZE_BYTES = 400 * 1024 * 1024; // 400MB
export const WARNING_FILE_SIZE_BYTES = 300 * 1024 * 1024; // 300MB
export const LEGACY_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB for legacy multipart/form-data endpoint

// ============================================================
// FDM Estimation API Types
// ============================================================

export type SupportLevel = 'none' | 'light' | 'normal' | 'heavy';
export type PricingMode = 'volumetric' | 'cost_plus';

export interface FdmProfile {
  line_width_mm: number;
  layer_height_mm: number;
  wall_count: number;
  top_layers: number;
  bottom_layers: number;
  infill_percent: number;
  support_level: SupportLevel;
  waste_percent: number;
  density_g_per_cm3: number;
  flow_mm3_per_s: number;
}

export interface PricingConfig {
  mode: PricingMode;
  filament_price_try_per_kg?: number;
  machine_rate_try_per_h?: number;
  setup_fee_try?: number;
  postprocess_fee_try?: number;
  labor_fee_try?: number;
  margin_percent?: number;
}

export interface EstimateRequest {
  analysis_id: string;
  technology?: 'fdm_pla';
  profile?: Partial<FdmProfile>;
  pricing?: Partial<PricingConfig>;
}

export interface EstimateBreakdown {
  shell_mm3: number;
  infill_mm3: number;
  top_bottom_extra_mm3: number;
  support_mm3: number;
  base_used_mm3: number;
  waste_multiplier: number;
  extrusion_seconds: number;
  complexity_index: number;
  overhead_multiplier: number;
}

export interface EstimateResult {
  used_volume_cm3: number;
  material_g: number;
  material_kg: number;
  time_h: number;
  breakdown: EstimateBreakdown;
}

export interface GeometryInfo {
  volume_cm3: number;
  surface_area_mm2: number;
  bounding_box_mm: BoundingBox;
}

export interface EstimateResponse {
  analysis_id: string;
  geometry: GeometryInfo;
  technology: string;
  profile: FdmProfile;
  estimate: EstimateResult;
  pricing: PricingConfig;
  price_try: number;
  cache_ttl_ms: number;
}
