// ============================================================
// FDM (PLA) Estimation Module
// ============================================================

export type SupportLevel = 'none' | 'light' | 'normal' | 'heavy';

export interface GeometryMetrics {
  volume_mm3: number;
  surface_area_mm2: number;
  height_mm: number;
}

export interface FdmProfile {
  // Extrusion parameters
  line_width_mm: number;
  layer_height_mm: number;
  
  // Shell parameters
  wall_count: number;
  top_layers: number;
  bottom_layers: number;
  
  // Infill
  infill_percent: number; // 0-100
  
  // Support and waste
  support_level: SupportLevel;
  waste_percent: number; // 0-1 (e.g., 0.05 = 5%)
  
  // Material properties
  density_g_per_cm3: number;
  
  // Print speed
  flow_mm3_per_s: number;
  
  // Shell calculation factor
  k_shell?: number; // Default 0.90
  
  // Time overhead factors
  overhead_base?: number; // Default 0.20
  overhead_complexity?: number; // Default 0.15
}

export interface FdmBreakdown {
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

export interface FdmEstimate {
  used_volume_cm3: number;
  material_g: number;
  material_kg: number;
  time_h: number;
  breakdown: FdmBreakdown;
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Get support factor based on support level
 */
function getSupportFactor(level: SupportLevel): number {
  switch (level) {
    case 'none':
      return 0;
    case 'light':
      return 0.05;
    case 'normal':
      return 0.10;
    case 'heavy':
      return 0.15;
  }
}

/**
 * Estimate FDM print parameters
 * 
 * Algorithm:
 * 1. Calculate shell volume based on surface area and wall thickness
 * 2. Calculate infill volume based on remaining inner volume
 * 3. Add top/bottom layer compensation
 * 4. Add support material
 * 5. Apply waste multiplier
 * 6. Calculate material weight
 * 7. Estimate print time with complexity-based overhead
 */
export function estimateFdm(metrics: GeometryMetrics, profile: FdmProfile): FdmEstimate {
  const { volume_mm3, surface_area_mm2, height_mm } = metrics;
  
  // Extract profile parameters with defaults
  const k_shell = profile.k_shell ?? 0.90;
  const overhead_base = profile.overhead_base ?? 0.20;
  const overhead_complexity = profile.overhead_complexity ?? 0.15;
  
  // 1. Calculate shell volume
  const wallThickness = profile.line_width_mm * profile.wall_count;
  let shell_mm3 = surface_area_mm2 * wallThickness * k_shell;
  shell_mm3 = clamp(shell_mm3, 0, volume_mm3);
  
  // 2. Calculate infill volume
  const inner_mm3 = Math.max(volume_mm3 - shell_mm3, 0);
  const infill_mm3 = inner_mm3 * (profile.infill_percent / 100);
  
  // 3. Top/bottom layer compensation
  // Estimate average cross-sectional area
  const A_avg = height_mm > 0 ? volume_mm3 / height_mm : 0;
  const tbThickness = profile.layer_height_mm * (profile.top_layers + profile.bottom_layers);
  const infill_fraction = profile.infill_percent / 100;
  const top_bottom_extra_mm3 = A_avg * tbThickness * (1 - infill_fraction);
  
  // 4. Base used volume (before supports and waste)
  const base_used_mm3 = shell_mm3 + infill_mm3 + top_bottom_extra_mm3;
  
  // 5. Add support material
  const supportFactor = getSupportFactor(profile.support_level);
  const support_mm3 = base_used_mm3 * supportFactor;
  
  // 6. Apply waste multiplier
  const waste_multiplier = 1 + profile.waste_percent;
  const used_volume_mm3 = (base_used_mm3 + support_mm3) * waste_multiplier;
  const used_volume_cm3 = used_volume_mm3 / 1000;
  
  // 7. Calculate material weight
  const material_g = used_volume_cm3 * profile.density_g_per_cm3;
  const material_kg = material_g / 1000;
  
  // 8. Estimate print time
  // Base extrusion time
  const extrusion_seconds = used_volume_mm3 / profile.flow_mm3_per_s;
  
  // Complexity-based overhead
  // Complexity index: surface area to volume ratio normalized by volume^(2/3)
  const volume_scale = Math.pow(volume_mm3, 2/3);
  const complexity_index = volume_scale > 0 ? surface_area_mm2 / volume_scale : 1;
  const complexity_norm = complexity_index > 0 ? complexity_index / 6 : 1;
  
  // Overhead multiplier includes base overhead + complexity-scaled overhead
  const overhead_multiplier = clamp(
    1 + overhead_base + overhead_complexity * (complexity_norm - 1),
    1.05,
    2.25
  );
  
  const time_seconds = extrusion_seconds * overhead_multiplier;
  const time_h = time_seconds / 3600;
  
  // Build breakdown
  const breakdown: FdmBreakdown = {
    shell_mm3,
    infill_mm3,
    top_bottom_extra_mm3,
    support_mm3,
    base_used_mm3,
    waste_multiplier,
    extrusion_seconds,
    complexity_index,
    overhead_multiplier,
  };
  
  return {
    used_volume_cm3,
    material_g,
    material_kg,
    time_h,
    breakdown,
  };
}

/**
 * Default FDM profile for standard PLA printing
 */
export const DEFAULT_FDM_PROFILE: FdmProfile = {
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
  k_shell: 0.90,
  overhead_base: 0.20,
  overhead_complexity: 0.15,
};
