// ============================================================
// Price Calculator for 3D Printing Technologies
// ============================================================

import { PRICE_CONFIG, type Prices } from '@print-cost/shared';

/**
 * Round price to nearest 10 TRY
 */
export function roundToNearest10(price: number): number {
  return Math.round(price / 10) * 10;
}

/**
 * Calculate price for a specific technology
 * EstimatedPriceTRY = BaseFeeTRY + (VolumeCm3 * RateTRYPerCm3)
 */
export function calculatePrice(volumeCm3: number, baseFee: number, ratePerCm3: number): number {
  const rawPrice = baseFee + volumeCm3 * ratePerCm3;
  return roundToNearest10(rawPrice);
}

/**
 * Calculate all prices for given volume
 */
export function calculateAllPrices(volumeCm3: number): Prices {
  return {
    fdm_pla: calculatePrice(
      volumeCm3,
      PRICE_CONFIG.fdm_pla.baseFee,
      PRICE_CONFIG.fdm_pla.ratePerCm3
    ),
    sla_resin: calculatePrice(
      volumeCm3,
      PRICE_CONFIG.sla_resin.baseFee,
      PRICE_CONFIG.sla_resin.ratePerCm3
    ),
    sls_pa12: calculatePrice(
      volumeCm3,
      PRICE_CONFIG.sls_pa12.baseFee,
      PRICE_CONFIG.sls_pa12.ratePerCm3
    ),
  };
}

