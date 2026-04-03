/**
 * PDF Generation Utility
 * 
 * Generates PDF reports matching the paper inventory format.
 * Uses expo-print for HTML to PDF conversion.
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
 */
function generatePDFHTML(
  session: InventorySession,
  items: InventoryItem[],
  grandTotal: number
): string {
  const sessionDate = new Date(session.session_date);
  const formattedDate = formatDateLong(sessionDate);

  // Generate table rows
  const tableRows = items.map(item => {
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
        <td class="price-cell">${price > 0 ? 'P' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-'}</td>
        <td class="price-cell">${total > 0 ? 'P' + total.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '-'}</td>
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
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 12px;
          color: #0F172A;
          padding: 20px;
          background: white;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #0D9488;
        }
        
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #0D9488;
          margin-bottom: 5px;
        }
        
        .subtitle {
          font-size: 14px;
          color: #475569;
        }
        
        .session-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          border: 1px solid #E2E8F0;
          border-radius: 6px;
        }
        
        .info-item {
          display: inline-block;
          margin-right: 30px;
        }
        
        .info-label {
          font-weight: 600;
          color: #475569;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 14px;
          color: #0F172A;
          font-weight: 500;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        
        th {
          background: #0D9488;
          color: white;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 10px 6px;
          text-align: center;
          border: 1px solid #0D9488;
        }
        
        th.item-header {
          text-align: left;
        }
        
        td {
          padding: 8px 6px;
          border: 1px solid #E2E8F0;
          vertical-align: middle;
        }
        
        .item-cell {
          font-weight: 500;
          min-width: 100px;
        }
        
        .num-cell {
          text-align: center;
          font-family: 'Courier New', monospace;
          width: 45px;
        }
        
        .price-cell {
          text-align: right;
          font-family: 'Courier New', monospace;
          width: 70px;
        }
        
        .remarks-cell {
          font-size: 11px;
          color: #475569;
          min-width: 80px;
        }
        
        .grand-total {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 12px 20px;
          border: 1px solid #0D9488;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .grand-total-label {
          font-weight: 600;
          font-size: 14px;
          margin-right: 20px;
          color: #0D9488;
        }
        
        .grand-total-value {
          font-size: 18px;
          font-weight: 700;
          font-family: 'Courier New', monospace;
          color: #0D9488;
        }
        
        .footer {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #E2E8F0;
          display: flex;
          justify-content: space-between;
          color: #94A3B8;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">JB CHICKEN</div>
        <div class="subtitle">Daily Inventory Report</div>
      </div>
      
      <div class="session-info">
        <span class="info-item">
          <span class="info-label">Date:</span>
          <span class="info-value">${formattedDate}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Shift:</span>
          <span class="info-value">${session.shift}</span>
        </span>
        <span class="info-item">
          <span class="info-label">Cashier:</span>
          <span class="info-value">${session.cashier_name}</span>
        </span>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="item-header">Items</th>
            <th>Beg. Bal.</th>
            <th>Delivery</th>
            <th>Pull Out</th>
            <th>Ending</th>
            <th>Sold Out</th>
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
        <span class="grand-total-label">GRAND TOTAL</span>
        <span class="grand-total-value">P${grandTotal.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
      
      <div class="footer">
        <span>Generated by JB Inventory Tracker</span>
        <span>${new Date().toLocaleDateString('en-PH')} ${new Date().toLocaleTimeString('en-PH')}</span>
      </div>
    </body>
    </html>
  `;
}
