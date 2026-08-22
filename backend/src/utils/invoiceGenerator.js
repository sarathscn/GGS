function generateInvoiceData(payment, listing, payer) {
  const paymentId = payment.id;
  const baseAmount = payment.base_amount !== undefined && payment.base_amount !== null ? Number(payment.base_amount) : 8.47;
  const gstRate = payment.gst_percentage !== undefined && payment.gst_percentage !== null ? Number(payment.gst_percentage) : 18.00;
  const gstAmount = payment.gst_amount !== undefined && payment.gst_amount !== null ? Number(payment.gst_amount) : 1.53;
  const totalAmount = payment.amount !== undefined && payment.amount !== null ? Number(payment.amount) : 10.00;

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
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_amount: totalAmount,

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
