// ============================================================
// FDM Estimator Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { estimateFdm, type GeometryMetrics, type FdmProfile, DEFAULT_FDM_PROFILE } from '../src/fdm-estimator.js';

describe('FDM Estimator', () => {
  // Test with a 10mm cube (1000 mm³, 600 mm², height 10mm)
  const cubeMetrics: GeometryMetrics = {
    volume_mm3: 1000,
    surface_area_mm2: 600,
    height_mm: 10,
  };

  describe('Basic estimation', () => {
    it('should estimate material usage for cube with minimal settings', () => {
      const profile: FdmProfile = {
        line_width_mm: 0.45,
        layer_height_mm: 0.2,
        wall_count: 2,
        top_layers: 4,
        bottom_layers: 4,
        infill_percent: 10,
        support_level: 'none',
        waste_percent: 0,
        density_g_per_cm3: 1.24,
        flow_mm3_per_s: 10,
      };

      const estimate = estimateFdm(cubeMetrics, profile);

      // Used volume should be greater than 0 and less than total volume
      expect(estimate.used_volume_cm3).toBeGreaterThan(0);
      expect(estimate.used_volume_cm3 * 1000).toBeLessThan(cubeMetrics.volume_mm3);
      
      // For this specific cube with these settings, used volume should be around 681 mm³
      // Allow tolerance of ±50 mm³
      const used_volume_mm3 = estimate.used_volume_cm3 * 1000;
      expect(used_volume_mm3).toBeGreaterThan(630);
      expect(used_volume_mm3).toBeLessThan(730);

      // Material weight should match density calculation
      const expected_g = estimate.used_volume_cm3 * profile.density_g_per_cm3;
      expect(estimate.material_g).toBeCloseTo(expected_g, 5);
      expect(estimate.material_kg).toBeCloseTo(estimate.material_g / 1000, 5);

      // Time should be positive
      expect(estimate.time_h).toBeGreaterThan(0);
    });

    it('should return valid breakdown data', () => {
      const profile: FdmProfile = {
        line_width_mm: 0.45,
        layer_height_mm: 0.2,
        wall_count: 2,
        top_layers: 4,
        bottom_layers: 4,
        infill_percent: 20,
        support_level: 'none',
        waste_percent: 0,
        density_g_per_cm3: 1.24,
        flow_mm3_per_s: 10,
      };

      const estimate = estimateFdm(cubeMetrics, profile);

      // Breakdown should have all fields
      expect(estimate.breakdown).toBeDefined();
      expect(estimate.breakdown.shell_mm3).toBeGreaterThan(0);
      expect(estimate.breakdown.infill_mm3).toBeGreaterThan(0);
      expect(estimate.breakdown.top_bottom_extra_mm3).toBeGreaterThan(0);
      expect(estimate.breakdown.support_mm3).toBe(0); // No supports
      expect(estimate.breakdown.base_used_mm3).toBeGreaterThan(0);
      expect(estimate.breakdown.waste_multiplier).toBe(1); // 0% waste
      expect(estimate.breakdown.extrusion_seconds).toBeGreaterThan(0);
      expect(estimate.breakdown.complexity_index).toBeGreaterThan(0);
      expect(estimate.breakdown.overhead_multiplier).toBeGreaterThan(1);
    });
  });

  describe('Support levels', () => {
    it('should add no support material when support_level is none', () => {
      const profile: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'none',
        waste_percent: 0,
      };

      const estimate = estimateFdm(cubeMetrics, profile);
      expect(estimate.breakdown.support_mm3).toBe(0);
    });

    it('should add support material when support_level is light', () => {
      const profile: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'light',
        waste_percent: 0,
      };

      const estimate = estimateFdm(cubeMetrics, profile);
      expect(estimate.breakdown.support_mm3).toBeGreaterThan(0);
      
      // Light support should be 5% of base material
      const expected_support = estimate.breakdown.base_used_mm3 * 0.05;
      expect(estimate.breakdown.support_mm3).toBeCloseTo(expected_support, 2);
    });

    it('should add more support material for heavy support', () => {
      const profileLight: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'light',
        waste_percent: 0,
      };

      const profileHeavy: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'heavy',
        waste_percent: 0,
      };

      const estimateLight = estimateFdm(cubeMetrics, profileLight);
      const estimateHeavy = estimateFdm(cubeMetrics, profileHeavy);

      expect(estimateHeavy.breakdown.support_mm3).toBeGreaterThan(estimateLight.breakdown.support_mm3);
    });
  });

  describe('Waste multiplier', () => {
    it('should apply waste percentage correctly', () => {
      const profileNoWaste: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'none',
        waste_percent: 0,
      };

      const profileWithWaste: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        support_level: 'none',
        waste_percent: 0.10, // 10% waste
      };

      const estimateNoWaste = estimateFdm(cubeMetrics, profileNoWaste);
      const estimateWithWaste = estimateFdm(cubeMetrics, profileWithWaste);

      // With 10% waste, used volume should be 1.1x the no-waste version
      expect(estimateWithWaste.used_volume_cm3).toBeCloseTo(
        estimateNoWaste.used_volume_cm3 * 1.10,
        5
      );
    });
  });

  describe('Infill percentage', () => {
    it('should use more material with higher infill', () => {
      const profile10: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        infill_percent: 10,
        support_level: 'none',
        waste_percent: 0,
      };

      const profile50: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        infill_percent: 50,
        support_level: 'none',
        waste_percent: 0,
      };

      const estimate10 = estimateFdm(cubeMetrics, profile10);
      const estimate50 = estimateFdm(cubeMetrics, profile50);

      expect(estimate50.used_volume_cm3).toBeGreaterThan(estimate10.used_volume_cm3);
      expect(estimate50.material_g).toBeGreaterThan(estimate10.material_g);
    });

    it('should handle 0% infill', () => {
      const profile: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        infill_percent: 0,
        support_level: 'none',
        waste_percent: 0,
      };

      const estimate = estimateFdm(cubeMetrics, profile);
      
      expect(estimate.breakdown.infill_mm3).toBe(0);
      expect(estimate.used_volume_cm3).toBeGreaterThan(0); // Still has shell and top/bottom
    });

    it('should handle 100% infill', () => {
      const profile: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        infill_percent: 100,
        support_level: 'none',
        waste_percent: 0,
      };

      const estimate = estimateFdm(cubeMetrics, profile);
      
      // 100% infill should fill the entire inner volume
      expect(estimate.used_volume_cm3).toBeGreaterThan(0);
    });
  });

  describe('Wall count', () => {
    it('should use more material with more walls', () => {
      const profile2Walls: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        wall_count: 2,
        support_level: 'none',
        waste_percent: 0,
      };

      const profile4Walls: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        wall_count: 4,
        support_level: 'none',
        waste_percent: 0,
      };

      const estimate2 = estimateFdm(cubeMetrics, profile2Walls);
      const estimate4 = estimateFdm(cubeMetrics, profile4Walls);

      expect(estimate4.breakdown.shell_mm3).toBeGreaterThan(estimate2.breakdown.shell_mm3);
      expect(estimate4.used_volume_cm3).toBeGreaterThan(estimate2.used_volume_cm3);
    });
  });

  describe('Time estimation', () => {
    it('should calculate time based on flow rate', () => {
      const profileSlow: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        flow_mm3_per_s: 5, // Slower
        support_level: 'none',
        waste_percent: 0,
      };

      const profileFast: FdmProfile = {
        ...DEFAULT_FDM_PROFILE,
        flow_mm3_per_s: 20, // Faster
        support_level: 'none',
        waste_percent: 0,
      };

      const estimateSlow = estimateFdm(cubeMetrics, profileSlow);
      const estimateFast = estimateFdm(cubeMetrics, profileFast);

      // Slower flow should take more time
      expect(estimateSlow.time_h).toBeGreaterThan(estimateFast.time_h);
    });

    it('should apply overhead multiplier to time', () => {
      const estimate = estimateFdm(cubeMetrics, DEFAULT_FDM_PROFILE);

      // Overhead multiplier should be between 1.05 and 2.25
      expect(estimate.breakdown.overhead_multiplier).toBeGreaterThanOrEqual(1.05);
      expect(estimate.breakdown.overhead_multiplier).toBeLessThanOrEqual(2.25);

      // Total time should be greater than pure extrusion time
      const pure_extrusion_h = estimate.breakdown.extrusion_seconds / 3600;
      expect(estimate.time_h).toBeGreaterThan(pure_extrusion_h);
    });
  });

  describe('Edge cases', () => {
    it('should handle very small geometries', () => {
      const smallMetrics: GeometryMetrics = {
        volume_mm3: 10,
        surface_area_mm2: 30,
        height_mm: 2,
      };

      const estimate = estimateFdm(smallMetrics, DEFAULT_FDM_PROFILE);

      expect(estimate.used_volume_cm3).toBeGreaterThan(0);
      expect(estimate.material_g).toBeGreaterThan(0);
      expect(estimate.time_h).toBeGreaterThan(0);
    });

    it('should handle large geometries', () => {
      const largeMetrics: GeometryMetrics = {
        volume_mm3: 1000000, // 1 liter
        surface_area_mm2: 60000,
        height_mm: 100,
      };

      const estimate = estimateFdm(largeMetrics, DEFAULT_FDM_PROFILE);

      expect(estimate.used_volume_cm3).toBeGreaterThan(0);
      expect(estimate.material_g).toBeGreaterThan(0);
      expect(estimate.time_h).toBeGreaterThan(0);
    });

    it('should clamp shell volume to not exceed total volume', () => {
      const thinMetrics: GeometryMetrics = {
        volume_mm3: 100,
        surface_area_mm2: 1000, // Very high surface to volume ratio
        height_mm: 1,
      };

      const estimate = estimateFdm(thinMetrics, DEFAULT_FDM_PROFILE);

      // Shell should not exceed total volume
      expect(estimate.breakdown.shell_mm3).toBeLessThanOrEqual(thinMetrics.volume_mm3);
    });
  });
});
