/**
 * IconButton Component - JB Inventory Tracker
 * 
 * Touch-friendly circular icon button (44pt minimum).
 * Includes haptic feedback and proper accessibility.
 */

import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { Sizing } from '@/constants/spacing';

export type IconButtonVariant = 'default' | 'primary' | 'ghost' | 'destructive';
export type IconButtonSize = 'default' | 'small' | 'large';

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel: string; // Required for accessibility
}

export function IconButton({
  icon,
  variant = 'default',
  size = 'default',
  style,
  disabled = false,
  onPress,
  accessibilityLabel,
  ...props
}: IconButtonProps) {
  const handlePress = (event: any) => {
    if (!disabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.(event);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      hitSlop={8} // Expand touch area
      {...props}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999, // Circular
  },

  // Sizes
  default: {
    width: Sizing.iconButtonSize,
    height: Sizing.iconButtonSize,
  },
  small: {
    width: 36,
    height: 36,
  },
  large: {
    width: 52,
    height: 52,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: Colors.error,
  },

  // States
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
