/**
 * Spacing System - JB Inventory Tracker
 * 8pt Grid System
 */

// Spacing Scale (px)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,  // Alias for '2xl'
  xxxl: 64, // Alias for '3xl'
  '2xl': 48,
  '3xl': 64,
} as const;

// Component Sizing (Touch-Friendly)
export const Sizing = {
  // Interactive Elements
  buttonHeight: 48,
  inputHeight: 48,
  iconButtonSize: 44,
  fabSize: 56,

  // List Items
  listItemHeight: 56,
  tableRowHeight: 52,

  // Navigation
  bottomNavHeight: 64,
  headerHeight: 56,

  // Touch Targets
  minTouchTarget: 44,
} as const;

// Border Radius
export const BorderRadius = {
  none: 0,
  sm: 4,
  default: 8,
  md: 12,
  lg: 16,
  full: 999,
} as const;

// Shadows (React Native Platform-Specific)
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// Animation Durations (ms)
export const Durations = {
  fast: 150,
  normal: 200,
  slow: 300,
  modal: 350,
} as const;

// Z-Index Scale
export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalOverlay: 40,
  modal: 50,
  toast: 60,
} as const;

export type SpacingKey = keyof typeof Spacing;
export type SizingKey = keyof typeof Sizing;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type ShadowKey = keyof typeof Shadows;
