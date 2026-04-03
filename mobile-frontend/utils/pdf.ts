/**
 * PDF Generation Utility
 * 
 * Generates PDF reports matching the paper inventory format.
 * Uses expo-print for HTML to PDF conversion.
 * Design: Minimalist Orange/Black/White theme
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { formatCurrency, formatDateLong } from './format';
import type { InventorySession, InventoryItem } from '@/lib/db/schema';

/**
 * Generate and share a PDF report for an inventory session
 */
export async function generateSessionPDF(
  session: InventorySession,
  items: InventoryItem[],
  grandTotal: number
): Promise<void> {
  const html = generatePDFHTML(session, items, grandTotal);
  
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  // Share the PDF
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Inventory Report - ${formatDateLong(new Date(session.session_date))}`,
      UTI: 'com.adobe.pdf',
    });
  }
}

/**
 * Generate HTML for the PDF report
 * Design: Minimalist with Orange (#FF6B00) / Black / White theme
 */
function generatePDFHTML(
  session: InventorySession,
  items: InventoryItem[],
  grandTotal: number
): string {
  const sessionDate = new Date(session.session_date);
  const formattedDate = formatDateLong(sessionDate);

  // Generate table rows
  const tableRows = items.map((item, index) => {
    // Allow null values - display as "-" if null/empty
    const begBalance = item.beg_balance || '-';
    const delivery = item.delivery || '-';
    const pullOut = item.pull_out || '-';
    const ending = item.ending || '-';
    const soldOut = item.sold_out || '-';
    
    // Only calculate if soldOut is a valid number
    const price = parseFloat(item.price?.toString() || '0');
    const soldOutNum = parseFloat(soldOut);
    const total = !isNaN(soldOutNum) && soldOutNum > 0 ? soldOutNum * price : 0;
    const remarks = item.remarks || '';

    return `
      <tr>
        <td class="item-cell">${item.item_name}</td>
        <td class="num-cell">${begBalance}</td>
        <td class="num-cell">${delivery}</td>
        <td class="num-cell">${pullOut}</td>
        <td class="num-cell">${ending}</td>
        <td class="num-cell">${soldOut}</td>
        <td class="price-cell">${price > 0 ? 'P' + price.toFixed(0) : '-'}</td>
        <td class="price-cell total-cell">${total > 0 ? 'P' + total.toFixed(0) : '-'}</td>
        <td class="remarks-cell">${remarks}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 11px;
          color: #1A1A1A;
          padding: 24px;
          background: white;
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 3px solid #FF6B00;
        }
        
        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .logo-circle {
          width: 48px;
          height: 48px;
          background: #FF6B00;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 16px;
        }
        
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        
        .brand-name {
          font-size: 22px;
          font-weight: 700;
          color: #1A1A1A;
          letter-spacing: -0.5px;
        }
        
        .brand-subtitle {
          font-size: 12px;
          color: #666666;
          font-weight: 500;
        }
        
        .report-title {
          text-align: right;
        }
        
        .report-label {
          font-size: 10px;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .report-date {
          font-size: 14px;
          font-weight: 600;
          color: #1A1A1A;
        }
        
        .session-info {
          display: flex;
          gap: 32px;
          margin-bottom: 20px;
          padding: 16px 20px;
          background: #F5F5F5;
          border-radius: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        
        .info-label {
          font-size: 10px;
          color: #999999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        
        .info-value {
          font-size: 14px;
          color: #1A1A1A;
          font-weight: 600;
        }
        
        .info-value.shift {
          color: #FF6B00;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        th {
          background: #1A1A1A;
          color: white;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 12px 8px;
          text-align: center;
        }
        
        th:first-child {
          text-align: left;
          padding-left: 12px;
        }
        
        td {
          padding: 10px 8px;
          border-bottom: 1px solid #E5E5E5;
          vertical-align: middle;
        }
        
        tr:last-child td {
          border-bottom: none;
        }
        
        .item-cell {
          font-weight: 500;
          padding-left: 12px;
          color: #1A1A1A;
        }
        
        .num-cell {
          text-align: center;
          color: #666666;
          font-size: 11px;
        }
        
        .price-cell {
          text-align: right;
          color: #666666;
          font-size: 11px;
        }
        
        .total-cell {
          color: #1A1A1A;
          font-weight: 600;
        }
        
        .remarks-cell {
          font-size: 10px;
          color: #999999;
          max-width: 80px;
        }
        
        .grand-total {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 24px;
          padding: 20px 24px;
          background: #FF6B00;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .grand-total-label {
          font-weight: 600;
          font-size: 14px;
          color: white;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .grand-total-value {
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid #E5E5E5;
          color: #999999;
          font-size: 10px;
        }
        
        .footer-brand {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .footer-dot {
          width: 6px;
          height: 6px;
          background: #FF6B00;
          border-radius: 50%;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="brand">
          <div class="logo-circle">JB</div>
          <div class="brand-text">
            <span class="brand-name">JB Chicken</span>
            <span class="brand-subtitle">Inventory Report</span>
          </div>
        </div>
        <div class="report-title">
          <div class="report-label">Report Date</div>
          <div class="report-date">${formattedDate}</div>
        </div>
      </div>
      
      <div class="session-info">
        <div class="info-item">
          <span class="info-label">Shift</span>
          <span class="info-value shift">${session.shift}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Cashier</span>
          <span class="info-value">${session.cashier_name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value">${session.status === 'open' ? 'Open' : 'Closed'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Items</span>
          <span class="info-value">${items.length}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Beg</th>
            <th>Del</th>
            <th>Pull</th>
            <th>End</th>
            <th>Sold</th>
            <th>Price</th>
            <th>Total</th>
            <th>Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
      
      <div class="grand-total">
        <span class="grand-total-label">Grand Total</span>
        <span class="grand-total-value">P${grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
      
      <div class="footer">
        <div class="footer-brand">
          <span class="footer-dot"></span>
          <span>Generated by JB Inventory Tracker</span>
        </div>
        <span>${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </body>
    </html>
  `;
}
