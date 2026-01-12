// ============================================================
// Price Calculator Tests
// ============================================================

import { describe, it, expect } from 'vitest';
import { roundToNearest10, calculatePrice, calculateAllPrices } from '../src/price-calculator.js';
import { PRICE_CONFIG } from '@print-cost/shared';

describe('Price Calculator', () => {
  describe('roundToNearest10', () => {
    it('should round down when remainder < 5', () => {
      expect(roundToNearest10(154)).toBe(150);
      expect(roundToNearest10(151)).toBe(150);
      expect(roundToNearest10(12)).toBe(10);
    });

    it('should round up when remainder >= 5', () => {
      expect(roundToNearest10(155)).toBe(160);
      expect(roundToNearest10(159)).toBe(160);
      expect(roundToNearest10(18)).toBe(20);
    });

    it('should not change multiples of 10', () => {
      expect(roundToNearest10(100)).toBe(100);
      expect(roundToNearest10(150)).toBe(150);
      expect(roundToNearest10(0)).toBe(0);
    });

    it('should handle decimal inputs', () => {
      expect(roundToNearest10(154.9)).toBe(150);
      expect(roundToNearest10(155.1)).toBe(160);
    });
  });

  describe('calculatePrice', () => {
    it('should calculate FDM price correctly', () => {
      // Base 150 + (1 cm3 * 12) = 162 -> rounds to 160
      const price = calculatePrice(1, 150, 12);
      expect(price).toBe(160);
    });

    it('should calculate SLA price correctly', () => {
      // Base 300 + (1 cm3 * 30) = 330 -> rounds to 330
      const price = calculatePrice(1, 300, 30);
      expect(price).toBe(330);
    });

    it('should calculate SLS price correctly', () => {
      // Base 600 + (1 cm3 * 45) = 645 -> rounds to 650
      const price = calculatePrice(1, 600, 45);
      expect(price).toBe(650);
    });

    it('should handle larger volumes', () => {
      // Base 150 + (100 cm3 * 12) = 1350 -> rounds to 1350
      const price = calculatePrice(100, 150, 12);
      expect(price).toBe(1350);
    });

    it('should handle zero volume (base fee only)', () => {
      const price = calculatePrice(0, 150, 12);
      expect(price).toBe(150);
    });
  });

  describe('calculateAllPrices', () => {
    it('should calculate all three prices for 1 cm3', () => {
      const prices = calculateAllPrices(1);

      // FDM: 150 + 12 = 162 -> 160
      expect(prices.fdm_pla).toBe(160);

      // SLA: 300 + 30 = 330 -> 330
      expect(prices.sla_resin).toBe(330);

      // SLS: 600 + 45 = 645 -> 650
      expect(prices.sls_pa12).toBe(650);
    });

    it('should calculate all three prices for 10 cm3', () => {
      const prices = calculateAllPrices(10);

      // FDM: 150 + 120 = 270 -> 270
      expect(prices.fdm_pla).toBe(270);

      // SLA: 300 + 300 = 600 -> 600
      expect(prices.sla_resin).toBe(600);

      // SLS: 600 + 450 = 1050 -> 1050
      expect(prices.sls_pa12).toBe(1050);
    });

    it('should match PRICE_CONFIG values', () => {
      const volume = 5;
      const prices = calculateAllPrices(volume);

      // Verify using config values
      const expectedFdm = Math.round((PRICE_CONFIG.fdm_pla.baseFee + volume * PRICE_CONFIG.fdm_pla.ratePerCm3) / 10) * 10;
      const expectedSla = Math.round((PRICE_CONFIG.sla_resin.baseFee + volume * PRICE_CONFIG.sla_resin.ratePerCm3) / 10) * 10;
      const expectedSls = Math.round((PRICE_CONFIG.sls_pa12.baseFee + volume * PRICE_CONFIG.sls_pa12.ratePerCm3) / 10) * 10;

      expect(prices.fdm_pla).toBe(expectedFdm);
      expect(prices.sla_resin).toBe(expectedSla);
      expect(prices.sls_pa12).toBe(expectedSls);
    });
  });
});

