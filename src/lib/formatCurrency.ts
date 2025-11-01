/**
 * Centralized currency formatting utility
 * Formats prices in Egyptian Pounds (EGP) with English locale
 */

interface FormatCurrencyOptions {
  showCurrencyCode?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatCurrency(
  amount: number, 
  options: FormatCurrencyOptions = {}
): string {
  const {
    showCurrencyCode = false,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  if (showCurrencyCode) {
    // Format with explicit EGP suffix for clarity
    return `${amount.toFixed(maximumFractionDigits)} EGP`;
  }

  // Use Intl.NumberFormat for proper currency formatting
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

// Alternative formatter for cases where you need just the amount with EGP suffix
export function formatCurrencySimple(amount: number): string {
  return `${amount.toFixed(2)} EGP`;
}

// For display in tables or compact layouts
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M EGP`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K EGP`;
  }
  return formatCurrency(amount, { showCurrencyCode: true });
}