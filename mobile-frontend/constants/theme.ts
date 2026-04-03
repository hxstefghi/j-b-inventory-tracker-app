/**
 * JB Inventory Tracker - Design System Theme
 * 
 * Centralized design tokens for the entire app.
 * Based on Minimalist Flat Design with Plus Jakarta Sans typography.
 * 
 * Light Mode Only
 */

// Re-export all design tokens
export { Colors } from './colors';
export { 
  FontWeights, 
  FontFamilies, 
  FontSizes, 
  LineHeights, 
  LetterSpacing, 
  Typography,
  type TypographyKey,
} from './typography';
export { 
  Spacing, 
  Sizing, 
  BorderRadius, 
  Shadows, 
  Durations, 
  ZIndex,
  type SpacingKey,
  type SizingKey,
  type BorderRadiusKey,
  type ShadowKey,
} from './spacing';

// Theme object for compatibility with existing code
import { Colors } from './colors';

export const Theme = {
  colors: Colors,
  // Legacy compatibility
  light: {
    text: Colors.textPrimary,
    background: Colors.background,
    tint: Colors.primary,
    icon: Colors.textSecondary,
    tabIconDefault: Colors.textMuted,
    tabIconSelected: Colors.primary,
  },
} as const;
