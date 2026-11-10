/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Format Indian numbers using the Indian numbering system:
 * e.g., 1,948,500 Cr -> ₹19.49 Lakh Cr or ₹19,48,500 Cr
 */
export function formatInrCrores(cr: number, compact: boolean = false): string {
  if (isNaN(cr) || cr === 0) return '₹0 Cr';

  if (compact && cr >= 100000) {
    const lakhCr = cr / 100000;
    return `₹${lakhCr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakh Cr`;
  }

  // Regular Indian format with ₹ symbol
  return `₹${Math.round(cr).toLocaleString('en-IN')} Cr`;
}

export function formatInrCompact(val: number): string {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)}L Cr`;
  }
  return `₹${val.toLocaleString('en-IN')} Cr`;
}

export function formatIndianCurrency(num: number): string {
  return `₹${num.toLocaleString('en-IN')}`;
}

export function formatPercentage(val: number, withSign: boolean = true): string {
  const sign = withSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Download an array of objects as a CSV file in the browser
 */
export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
