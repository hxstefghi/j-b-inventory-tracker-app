/**
 * Color Palette - JB Inventory Tracker
 * Design System: Minimalist iOS-style
 * Theme: Orange / Black / White (JB Chicken Branding)
 * Light Mode Only
 */

export const Colors = {
  // Primary - Orange (JB Chicken Brand)
  primary: '#FF6B00',
  primaryLight: '#FF8534',
  primaryDark: '#E55A00',
  primaryForeground: '#FFFFFF',

  // Secondary - Black
  secondary: '#1A1A1A',
  secondaryForeground: '#FFFFFF',

  // Accent - Same as primary for consistency
  accent: '#FF6B00',
  accentForeground: '#FFFFFF',

  // Surfaces
  background: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text Hierarchy
  textPrimary: '#1A1A1A',     // Near black
  textSecondary: '#666666',   // Dark gray
  textMuted: '#999999',       // Medium gray
  textLight: '#CCCCCC',       // Light gray

  // Feedback States
  success: '#22C55E',
  successLight: '#DCFCE7',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningForeground: '#FFFFFF',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorForeground: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E5E5',
  borderLight: '#F0F0F0',
  borderStrong: '#D4D4D4',

  // Table-specific
  tableHeader: '#F5F5F5',
  tableRowAlt: '#FAFAFA',

  // Special
  overlay: 'rgba(0, 0, 0, 0.4)',
  disabled: '#CCCCCC',
  disabledBg: '#F5F5F5',
  
  // Shadows (for elevated elements)
  shadowColor: '#000000',
} as const;

// Type for TypeScript autocomplete
export type ColorKey = keyof typeof Colors;

// Shadow presets for iOS-style elevation
export const Shadows = {
  small: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;
