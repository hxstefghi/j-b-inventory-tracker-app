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
 * Calculated sold out values from POS sales (optional)
 * Map of item name to calculated quantity
 */
export type CalculatedSoldOutMap = Record<string, number>;

/**
 * Generate and share a PDF report for an inventory session
 * @param calculatedSoldOut Optional map of item name to calculated sold out from POS
 * @param posTotal Optional POS sales total (revenue)
 * @param chickenRevenue Optional chicken-specific revenue from combo meals
 */
export async function generateSessionPDF(
  session: InventorySession,
  items: InventoryItem[],
  grandTotal: number,
  calculatedSoldOut?: CalculatedSoldOutMap,
  posTotal?: number,
  chickenRevenue?: number
): Promise<void> {
  const html = generatePDFHTML(session, items, grandTotal, calculatedSoldOut, posTotal, chickenRevenue);
  
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
  grandTotal: number,
  calculatedSoldOut?: CalculatedSoldOutMap,
  posTotal?: number,
  chickenRevenue?: number
): string {
  const sessionDate = new Date(session.session_date);
  const formattedDate = formatDateLong(sessionDate);
  
  // Format current time in Philippines timezone
  const now = new Date();
  const phTime = now.toLocaleString('en-PH', { 
    timeZone: 'Asia/Manila',
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Generate table rows
  const tableRows = items.map((item, index) => {
    // Allow null values - display as "-" if null/empty
    const begBalance = item.beg_balance || '-';
    const delivery = item.delivery || '-';
    const pullOut = item.pull_out || '-';
    const ending = item.ending || '-';
    
    // Use calculated sold out from POS if available, otherwise use stored value
    let soldOutDisplay: string;
    let soldOutNum: number;
    
    if (calculatedSoldOut && calculatedSoldOut[item.item_name] !== undefined) {
      // New-style session with POS calculation
      soldOutNum = calculatedSoldOut[item.item_name];
      soldOutDisplay = soldOutNum > 0 ? soldOutNum.toString() : '-';
    } else {
      // Old-style session - use stored value
      const storedSoldOut = item.sold_out || '-';
      soldOutDisplay = storedSoldOut;
      soldOutNum = parseFloat(storedSoldOut);
      if (isNaN(soldOutNum)) soldOutNum = 0;
    }
    
    // Detect if this is a chicken item (exact match "Chicken", not Chicken Skin)
    // Chicken items should not show individual price, but should show total revenue
    const isChickenItem = item.item_name === 'Chicken';
    
    // Calculate total
    const price = parseFloat(item.price?.toString() || '0');
    let total: number;
    
    // For chicken items, use revenue from combo meals instead of soldOut * price
    if (isChickenItem && chickenRevenue !== undefined) {
      total = chickenRevenue;
    } else {
      total = soldOutNum > 0 ? soldOutNum * price : 0;
    }
    
    const remarks = item.remarks || '';

    // Price display: hide for chicken items, show for all others
    const priceDisplay = isChickenItem ? '-' : (price > 0 ? 'P' + price.toFixed(2) : '-');
    
    // Total display: always show if there's a value (including for chicken)
    const totalDisplay = total > 0 ? 'P' + total.toFixed(2) : '-';

    return `
      <tr>
        <td class="item-cell">${item.item_name}</td>
        <td class="num-cell">${begBalance}</td>
        <td class="num-cell">${delivery}</td>
        <td class="num-cell">${pullOut}</td>
        <td class="num-cell">${ending}</td>
        <td class="num-cell">${soldOutDisplay}</td>
        <td class="price-cell">${priceDisplay}</td>
        <td class="price-cell total-cell">${totalDisplay}</td>
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
          font-size: 10px;
          color: #1A1A1A;
          padding: 20px;
          background: white;
        }
        
        .header {
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #CCCCCC;
        }
        
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .header-left {
          flex: 1;
        }
        
        .header-title {
          font-size: 11px;
          font-weight: 600;
          color: #666666;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        
        .session-meta {
          font-size: 10px;
          color: #666666;
          line-height: 1.6;
        }
        
        .session-meta-row {
          margin-bottom: 2px;
        }
        
        .meta-label {
          font-weight: 600;
          display: inline-block;
          min-width: 60px;
        }
        
        .header-right {
          text-align: right;
        }
        
        .report-date {
          font-size: 12px;
          font-weight: 600;
          color: #1A1A1A;
          margin-bottom: 2px;
        }
        
        .report-shift {
          font-size: 10px;
          color: #666666;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          margin-top: 12px;
        }
        
        th {
          background: transparent;
          color: #999999;
          font-weight: 600;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          padding: 8px 6px;
          text-align: center;
          border-bottom: 1px solid #CCCCCC;
        }
        
        th:first-child {
          text-align: left;
          padding-left: 8px;
        }
        
        td {
          padding: 8px 6px;
          border-bottom: 1px solid #E5E5E5;
          vertical-align: middle;
          font-size: 10px;
        }
        
        tr:last-child td {
          border-bottom: 1px solid #CCCCCC;
        }
        
        .item-cell {
          font-weight: 500;
          padding-left: 8px;
          color: #1A1A1A;
        }
        
        .num-cell {
          text-align: center;
          color: #333333;
          font-size: 10px;
        }
        
        .price-cell {
          text-align: center;
          color: #333333;
          font-size: 10px;
        }
        
        .total-cell {
          color: #1A1A1A;
          font-weight: 600;
        }
        
        .remarks-cell {
          font-size: 9px;
          color: #666666;
          max-width: 80px;
          font-style: italic;
        }
        
        .grand-total-row {
          margin-top: 12px;
          padding: 12px 8px;
          border-top: 2px solid #1A1A1A;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 20px;
        }
        
        .grand-total-label {
          font-weight: 700;
          font-size: 12px;
          color: #1A1A1A;
          text-transform: uppercase;
        }
        
        .grand-total-value {
          font-size: 18px;
          font-weight: 700;
          color: #1A1A1A;
        }
        
        .footer {
          margin-top: 20px;
          padding-top: 12px;
          border-top: 1px solid #E5E5E5;
          text-align: right;
          color: #999999;
          font-size: 9px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-top">
          <div class="header-left">
            <div class="header-title">Inventory Report</div>
            <div class="session-meta">
              <div class="session-meta-row">
                <span class="meta-label">Cashier:</span> ${session.cashier_name}
              </div>
              <div class="session-meta-row">
                <span class="meta-label">Status:</span> ${session.status === 'open' ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="report-date">${formattedDate}</div>
            <div class="report-shift">${session.shift} Shift</div>
          </div>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Items</th>
            <th>Beg. Balance</th>
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
      
      <div class="grand-total-row">
        <span class="grand-total-label">Total Sales (POS)</span>
        <span class="grand-total-value">₱${(posTotal || grandTotal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
      </div>
      
      <div class="footer">
        Generated ${phTime}
      </div>
    </body>
    </html>
  `;
}
