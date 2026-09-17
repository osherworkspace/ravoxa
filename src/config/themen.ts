export const RAVOXA_COLORS = {
  midnight: '#111827',
  violet: '#6D5DFB',
  cyan: '#22D3EE',
  white: '#FFFFFF',
  softGray: '#F3F4F6',
  grayDark: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  danger: '#DC2626',
} as const;

export const RAVOXA_BRAND = {
  name: 'RAVOXA',
  tagline: 'See your money differently.',
} as const;

export const DISPLAY_CURRENCIES = {
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
  },
} as const;

export type DisplayCurrency =
  keyof typeof DISPLAY_CURRENCIES;