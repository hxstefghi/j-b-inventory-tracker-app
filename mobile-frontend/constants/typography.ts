/**
 * Typography System - JB Inventory Tracker
 * Font Family: Plus Jakarta Sans
 * Single family for consistency and excellent number rendering
 */

// Font Weights
export const FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

// Font Families (loaded via expo-font)
export const FontFamilies = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

// Font Sizes (px)
export const FontSizes = {
  xs: 12,     // Helper text, timestamps, badges
  sm: 14,     // Secondary text, table cells, labels
  base: 16,   // Body text, input values (default)
  lg: 18,     // Section headers, card titles
  xl: 20,     // Screen subtitles, prominent labels
  '2xl': 24,  // Screen titles, modal headers
  '3xl': 32,  // Large display numbers, totals
} as const;

// Line Heights (ratio)
export const LineHeights = {
  tight: 1.2,    // Headlines, titles, numbers
  normal: 1.5,   // Body text, descriptions
  relaxed: 1.75, // Long-form content
} as const;

// Letter Spacing (px)
export const LetterSpacing = {
  tight: -0.5,   // Large headlines (≥24px)
  normal: 0,     // Body text, most UI
  wide: 0.5,     // Labels, all-caps text
} as const;

// Typography Presets
export const Typography = {
  // Display
  displayLarge: {
    fontFamily: FontFamilies.extrabold,
    fontSize: FontSizes['3xl'],
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },
  display: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes['2xl'],
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
    letterSpacing: LetterSpacing.tight,
  },

  // Headings
  h1: {
    fontFamily: FontFamilies.bold,
    fontSize: FontSizes['2xl'],
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
  },
  h2: {
    fontFamily: FontFamilies.semibold,
    fontSize: FontSizes.xl,
    lineHeight: FontSizes.xl * LineHeights.tight,
  },
  h3: {
    fontFamily: FontFamilies.semibold,
    fontSize: FontSizes.lg,
    lineHeight: FontSizes.lg * LineHeights.normal,
  },

  // Body
  body: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
  },
  bodyMedium: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
  },
  bodySmall: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },

  // Labels
  label: {
    fontFamily: FontFamilies.medium,
    fontSize: FontSizes.sm,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
  labelLarge: {
    fontFamily: FontFamilies.semibold,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.normal,
  },

  // Special
  caption: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
  button: {
    fontFamily: FontFamilies.semibold,
    fontSize: FontSizes.base,
    lineHeight: FontSizes.base * LineHeights.tight,
  },
  overline: {
    fontFamily: FontFamilies.semibold,
    fontSize: FontSizes.xs,
    lineHeight: FontSizes.xs * LineHeights.normal,
    letterSpacing: LetterSpacing.wide,
    textTransform: 'uppercase' as const,
  },

  // Numbers (for tables/totals)
  numberRegular: {
    fontFamily: FontFamilies.regular,
    fontSize: FontSizes.sm,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  numberBold: {
    fontFamily: FontFamilies.extrabold,
    fontSize: FontSizes.lg,
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
  numberLarge: {
    fontFamily: FontFamilies.extrabold,
    fontSize: FontSizes['2xl'],
    fontVariant: ['tabular-nums'] as ('tabular-nums')[],
  },
} as const;

export type TypographyKey = keyof typeof Typography;
