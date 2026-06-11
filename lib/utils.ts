/**
 * Formats a number into Indian Rupees (INR) currency format.
 * Example: 1000000 -> ₹10,00,000
 * 
 * @param amount The numerical amount to format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
