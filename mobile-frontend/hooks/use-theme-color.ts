/**
 * Theme Color Hook - JB Inventory Tracker
 * 
 * Returns colors from our design system.
 * Light mode only (no dark mode support needed).
 */

import { Colors, ColorKey } from '@/constants/colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorKey
) {
  const colorFromProps = props.light;

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[colorName];
  }
}
