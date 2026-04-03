/**
 * Formatting Utilities - JB Inventory Tracker
 * 
 * Number, currency, and date formatting for Filipino locale.
 */

/**
 * Format number as Philippine Peso currency
 * Example: 6265 → ₱6,265.00
 */
export function formatCurrency(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format number with comma separators
 * Example: 1234.5 → 1,234.5
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return value.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format date as MM/DD/YY (Filipino preference)
 * Example: 2026-04-03 → 04/03/26
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

/**
 * Format date as full readable format
 * Example: April 3, 2026
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format time as HH:MM AM/PM
 * Example: 14:30 → 2:30 PM
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time
 * Example: April 3, 2026 2:30 PM
 */
export function formatDateTime(date: Date | string): string {
  return `${formatDateLong(date)} ${formatTime(date)}`;
}

/**
 * Parse formatted currency back to number
 * Example: "₱6,265.00" → 6265
 */
export function parseCurrency(formatted: string): number {
  return parseFloat(formatted.replace(/[₱,]/g, ''));
}

/**
 * Get current shift based on time
 * AM: 00:00 - 11:59
 * PM: 12:00 - 23:59
 */
export function getCurrentShift(): 'AM' | 'PM' {
  const hour = new Date().getHours();
  return hour < 12 ? 'AM' : 'PM';
}
