import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a clean, professional, branded PDF Tax Invoice.
 * 
 * @param {Object} invoice - Invoice data returned from GET /api/payments/:id/invoice
 */
export function generateInvoicePdf(invoice) {
  if (!invoice) {
    throw new Error('Invoice data is missing');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const primaryColor = [124, 58, 237]; // Violet 600
  const darkTextColor = [30, 41, 59];
  const mutedTextColor = [100, 116, 139];

  // Brand Header
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Top Accent Bar
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 4, 'F');

  doc.setFontSize(20);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('GAME GEAR SWAP', 14, 18);

  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.setFont('helvetica', 'normal');
  doc.text("Kerala's Trusted Gaming Marketplace & Hardware Community", 14, 24);
  doc.text('Web: ggs.kerala | Support: support@ggs.com | GSTIN: 32AABCU9603R1ZM', 14, 30);

  // Document Type Header
  doc.setFontSize(14);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE / PAYMENT RECEIPT', 14, 52);

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 56, pageWidth - 14, 56);

  // Left Column: Invoice Details
  const leftX = 14;
  let currentY = 64;

  doc.setFontSize(9);
  doc.setTextColor(...mutedTextColor);
  doc.text('Invoice Number:', leftX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number || 'N/A', leftX + 32, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Invoice Date:', leftX, currentY);
  doc.setTextColor(...darkTextColor);
  const formattedDate = invoice.invoice_date 
    ? new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleDateString('en-IN');
  doc.text(formattedDate, leftX + 32, currentY);

  currentY += 6;
  doc.setTextColor(...mutedTextColor);
  doc.text('Transaction ID:', leftX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.setFont('courier', 'bold');
  doc.text(invoice.transaction_id || 'N/A', leftX + 32, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Payment Method:', leftX, currentY);
  doc.setTextColor(...darkTextColor);
  doc.text((invoice.payment_method || 'Online UPI').toUpperCase(), leftX + 32, currentY);

  currentY += 6;
  doc.setTextColor(...mutedTextColor);
  doc.text('Payment Status:', leftX, currentY);
  doc.setTextColor(16, 185, 129); // Emerald 500
  doc.setFont('helvetica', 'bold');
  doc.text((invoice.payment_status || 'COMPLETED').toUpperCase(), leftX + 32, currentY);

  // Right Column: Billed To Customer
  const rightX = 120;
  let rightY = 64;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('BILLED TO (CUSTOMER):', rightX, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text(invoice.user_name || 'Registered Gamer', rightX, rightY);

  if (invoice.user_email) {
    rightY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(invoice.user_email, rightX, rightY);
  }

  if (invoice.user_phone) {
    rightY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Phone: ${invoice.user_phone}`, rightX, rightY);
  }

  if (invoice.user_id) {
    rightY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`User ID: ${invoice.user_id.slice(0, 10)}...`, rightX, rightY);
  }

  // Invoice Items Table
  const tableStartY = Math.max(currentY, rightY) + 12;

  const baseAmt = invoice.base_amount !== undefined ? Number(invoice.base_amount).toFixed(2) : '8.47';
  const gstRate = invoice.gst_rate !== undefined ? Number(invoice.gst_rate) : 18;
  const gstAmt = invoice.gst_amount !== undefined ? Number(invoice.gst_amount).toFixed(2) : '1.53';
  const totalAmt = invoice.total_amount !== undefined ? Number(invoice.total_amount).toFixed(2) : '10.00';

  const itemDescription = invoice.ad_title 
    ? `Classified Ad Listing Service Charge\nListing: "${invoice.ad_title}"\nRef Ad ID: ${invoice.ad_id || 'N/A'}`
    : 'Marketplace Classified Listing Service Charge (Standard 30-day listing)';

  const tableOptions = {
    startY: tableStartY,
    head: [['#', 'Item Description', 'HSN / SAC', 'Base Rate', `GST (${gstRate}%)`, 'Total Amount']],
    body: [
      ['1', itemDescription, '998314', `Rs. ${baseAmt}`, `Rs. ${gstAmt}`, `Rs. ${totalAmt}`]
    ],
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: darkTextColor
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 80 },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    }
  };

  if (typeof autoTable === 'function') {
    autoTable(doc, tableOptions);
  } else if (typeof doc.autoTable === 'function') {
    doc.autoTable(tableOptions);
  }

  const finalTableY = doc.lastAutoTable?.finalY || (tableStartY + 30);

  // Breakdown Summary Box
  const summaryX = 115;
  let summaryY = finalTableY + 8;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text('Subtotal (Taxable Value):', summaryX, summaryY);
  doc.setTextColor(...darkTextColor);
  doc.text(`Rs. ${baseAmt}`, pageWidth - 14, summaryY, { align: 'right' });

  summaryY += 5;
  const halfGst = (Number(gstAmt) / 2).toFixed(2);
  doc.setTextColor(...mutedTextColor);
  doc.text(`CGST (9.0%):`, summaryX, summaryY);
  doc.setTextColor(...darkTextColor);
  doc.text(`Rs. ${halfGst}`, pageWidth - 14, summaryY, { align: 'right' });

  summaryY += 5;
  doc.setTextColor(...mutedTextColor);
  doc.text(`SGST (9.0%):`, summaryX, summaryY);
  doc.setTextColor(...darkTextColor);
  doc.text(`Rs. ${halfGst}`, pageWidth - 14, summaryY, { align: 'right' });

  summaryY += 6;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(summaryX, summaryY - 2, pageWidth - 14, summaryY - 2);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Total Paid (INR):', summaryX, summaryY + 2);
  doc.text(`Rs. ${totalAmt}`, pageWidth - 14, summaryY + 2, { align: 'right' });

  // Policy & Legal Notice
  const noticeY = summaryY + 18;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, noticeY, pageWidth - 28, 26, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, noticeY, pageWidth - 28, 26, 2, 2, 'D');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkTextColor);
  doc.text('TERMS & NO-REFUND POLICY ACKNOWLEDGEMENT', 18, noticeY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedTextColor);
  doc.text(
    'The Rs. 10.00 listing service charge (Rs. 8.47 + 18% GST) is strictly non-refundable upon payment completion.\n' +
    'No refund is granted if your listing is sold, voluntarily deleted, expires, or is removed due to policy violations.\n' +
    'This is a computer-generated tax invoice and requires no physical signature.',
    18,
    noticeY + 11
  );

  // Footer
  const footerY = 282;
  doc.setDrawColor(226, 232, 240);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(...mutedTextColor);
  doc.text('Game Gear Swap (GGS) • Kerala Gaming Community Marketplace • All Rights Reserved', pageWidth / 2, footerY, { align: 'center' });

  // Save Document
  const fileName = `Invoice_${invoice.invoice_number || 'GGS-INV'}.pdf`;
  doc.save(fileName);
  return fileName;
}
