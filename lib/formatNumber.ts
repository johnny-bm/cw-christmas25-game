// Format number with comma separators (e.g., 1234 -> 1,234)
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}
