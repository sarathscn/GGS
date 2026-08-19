function generateInvoiceData(payment, listing, payer) {
  const paymentId = payment.id;
  const baseAmount = Math.round((payment.amount / 1.18) * 100) / 100;
  const gstAmount = Math.round((payment.amount - baseAmount) * 100) / 100;

  return {
    invoice_number: `GGS-INV-${paymentId.replace(/-/g, '').substring(0, 8).toUpperCase()}`,
    invoice_date: payment.created_at || new Date().toISOString(),
    payment_id: paymentId,
    transaction_id: payment.transaction_id || `TXN-${paymentId.replace(/-/g, '').substring(0, 12).toUpperCase()}`,
    payment_method: payment.payment_method || 'Online Payment',
    payment_status: payment.status || 'completed',

    // User details
    user_id: payer ? payer.id : null,
    user_name: payer ? payer.name : 'Unknown',
    user_email: payer ? payer.email : null,
    user_phone: payer ? payer.phone : null,

    // Listing/Ad details
    ad_id: listing ? listing.id : null,
    ad_title: listing ? listing.title : 'Unknown',
    ad_category: listing ? listing.category_id : null,

    // Amount breakdown
    base_amount: baseAmount,
    gst_rate: 18,
    gst_amount: gstAmount,
    total_amount: payment.amount,

    // Company details
    company_name: 'Game Gear Swap (GGS)',
    company_tagline: "Kerala's Trusted Gaming Marketplace",
    company_address: 'Kerala, India',
    company_email: 'support@ggs.com',
    company_gstin: 'GSTIN-PLACEHOLDER',
    copyright: 'MALMER'
  };
}

module.exports = generateInvoiceData;
