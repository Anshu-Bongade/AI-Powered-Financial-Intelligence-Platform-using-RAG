export function formatCurrency(val, currency = '$', unit = 'M') {
  if (val === null || val === undefined) return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';

  const isNeg = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toLocaleString('en-US', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0
  });

  return `${isNeg ? '-' : ''}${currency}${formatted}${unit ? ' ' + unit : ''}`;
}

export function formatPct(val) {
  if (val === null || val === undefined) return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';
  const sign = num > 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

export function formatRatio(val, suffix = 'x') {
  if (val === null || val === undefined) return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';
  return `${num.toFixed(2)}${suffix}`;
}

export function formatPerShare(val, currency = '$') {
  if (val === null || val === undefined) return 'N/A';
  const num = Number(val);
  if (isNaN(num)) return 'N/A';
  return `${currency}${num.toFixed(2)}`;
}
