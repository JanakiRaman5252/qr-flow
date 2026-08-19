// Pure client-safe billing formatters

export function formatPrice(paise: number, currency = 'INR'): string {
  const amount = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
