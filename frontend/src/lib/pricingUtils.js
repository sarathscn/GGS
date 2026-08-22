// Centralized Listing Pricing and Tax Utility (Frontend)
// Authoritative listing service charge: Base Fee ₹8.47 + 18% GST ₹1.53 = Total ₹10.00 (1000 Paise)

export const BASE_LISTING_FEE_PAISE = 847; // 847 paise = ₹8.47
export const DEFAULT_GST_PERCENTAGE = 18.00; // 18.00%
export const GST_AMOUNT_PAISE = 153; // 153 paise = ₹1.53
export const TOTAL_AMOUNT_PAISE = 1000; // 1000 paise = ₹10.00 (847 + 153)

export const BASE_LISTING_SERVICE_CHARGE = 8.47; // Base service charge ₹8.47
export const TOTAL_LISTING_SERVICE_CHARGE = 10.00; // Total inclusive service charge ₹10.00
export const REFUND_POLICY_VERSION = 'v2.0';

/**
 * Calculates authoritative payment breakdown for a listing service charge.
 * Uses integer minor units (paise) to prevent floating point inaccuracies.
 * 
 * @param {Object} [options]
 * @param {number} [options.baseFee=8.47]
 * @param {number} [options.gstPercentage=18.00]
 * @returns {{
 *   baseFee: number,
 *   baseFeePaise: number,
 *   gstPercentage: number,
 *   gstAmount: number,
 *   gstAmountPaise: number,
 *   totalAmount: number,
 *   totalAmountPaise: number,
 *   formattedBaseFee: string,
 *   formattedGstAmount: string,
 *   formattedTotal: string,
 *   formattedTotalWithGst: string
 * }}
 */
export function calculateListingPayment({ baseFee = BASE_LISTING_SERVICE_CHARGE, gstPercentage = DEFAULT_GST_PERCENTAGE } = {}) {
  const fee = typeof baseFee === 'number' && !isNaN(baseFee) && baseFee > 0 ? baseFee : BASE_LISTING_SERVICE_CHARGE;
  let gstRate = typeof gstPercentage === 'number' && !isNaN(gstPercentage) ? gstPercentage : parseFloat(gstPercentage);

  if (isNaN(gstRate) || gstRate < 0) {
    gstRate = 0;
  } else if (gstRate > 100) {
    gstRate = 100;
  }

  // Canonical standard rate check (Base ₹8.47 + 18% GST = ₹10.00 / 1000 paise)
  const isDefaultRate = Math.abs(fee - BASE_LISTING_SERVICE_CHARGE) < 0.01 && Math.abs(gstRate - DEFAULT_GST_PERCENTAGE) < 0.01;

  if (isDefaultRate) {
    return {
      baseFee: BASE_LISTING_SERVICE_CHARGE,
      baseFeePaise: BASE_LISTING_FEE_PAISE,
      gstPercentage: DEFAULT_GST_PERCENTAGE,
      gstAmount: 1.53,
      gstAmountPaise: GST_AMOUNT_PAISE,
      totalAmount: TOTAL_LISTING_SERVICE_CHARGE,
      totalAmountPaise: TOTAL_AMOUNT_PAISE,
      formattedBaseFee: '₹8.47',
      formattedGstAmount: '₹1.53',
      formattedTotal: '₹10.00',
      formattedTotalWithGst: '₹10.00 (incl. 18% GST)'
    };
  }

  // Integer minor unit calculation for custom rates
  const feePaise = Math.round(fee * 100);
  const gstPaise = Math.round(feePaise * (gstRate / 100));
  const totalPaise = feePaise + gstPaise;

  const calculatedBase = feePaise / 100;
  const calculatedGst = gstPaise / 100;
  const calculatedTotal = totalPaise / 100;

  return {
    baseFee: calculatedBase,
    baseFeePaise: feePaise,
    gstPercentage: gstRate,
    gstAmount: calculatedGst,
    gstAmountPaise: gstPaise,
    totalAmount: calculatedTotal,
    totalAmountPaise: totalPaise,
    formattedBaseFee: `₹${calculatedBase.toFixed(2)}`,
    formattedGstAmount: `₹${calculatedGst.toFixed(2)}`,
    formattedTotal: `₹${calculatedTotal.toFixed(2)}`,
    formattedTotalWithGst: `₹${calculatedTotal.toFixed(2)} (incl. ${gstRate}% GST)`
  };
}
