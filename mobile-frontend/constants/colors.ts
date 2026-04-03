/**
 * Color Palette - JB Inventory Tracker
 * Design System: Minimalist Flat Design
 * Light Mode Only
 */

export const Colors = {
  // Primary - Teal (Productivity, Trust)
  primary: '#0D9488',
  primaryForeground: '#FFFFFF',

  // Secondary
  secondary: '#14B8A6',
  secondaryForeground: '#0F172A',

  // Accent/CTA - Orange (Action, Warmth)
  accent: '#EA580C',
  accentForeground: '#FFFFFF',

  // Surfaces
  background: '#FAFAFA',
  surface: '#FFFFFF',
  card: '#FFFFFF',

  // Text Hierarchy
  textPrimary: '#0F172A',     // Slate 900
  textSecondary: '#475569',   // Slate 600
  textMuted: '#94A3B8',       // Slate 400

  // Feedback States
  success: '#10B981',
  successForeground: '#FFFFFF',
  warning: '#F59E0B',
  warningForeground: '#FFFFFF',
  error: '#DC2626',
  errorForeground: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',          // Slate 200
  borderStrong: '#CBD5E1',    // Slate 300

  // Table-specific
  tableHeader: '#F1F5F9',     // Slate 100
  tableRowAlt: '#F8FAFC',     // Slate 50

  // Special
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#94A3B8',
  disabledBg: '#F1F5F9',
} as const;

// Type for TypeScript autocomplete
export type ColorKey = keyof typeof Colors;
