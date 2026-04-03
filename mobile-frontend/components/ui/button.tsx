/**
 * Button Component - JB Inventory Tracker
 * 
 * Touch-friendly button with variants: primary, secondary, ghost, destructive
 * Includes haptic feedback and proper accessibility support
 */

import React from 'react';
import { 
  Pressable, 
  StyleSheet, 
  ViewStyle, 
  PressableProps,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/text';
import { Colors } from '@/constants/colors';
import { Spacing, Sizing, BorderRadius } from '@/constants/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'default' | 'small' | 'large';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  variant = 'primary',
  size = 'default',
  fullWidth = false,
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  children,
  style,
  onPress,
  ...props
}: ButtonProps) {
  const handlePress = (event: any) => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress?.(event);
    }
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator 
          color={getTextColor(variant)} 
          size="small" 
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text 
            variant="button" 
            style={[
              styles.text,
              styles[`${variant}Text`],
              icon && iconPosition === 'left' ? { marginLeft: Spacing.sm } : undefined,
              icon && iconPosition === 'right' ? { marginRight: Spacing.sm } : undefined,
            ]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

function getTextColor(variant: ButtonVariant): string {
  switch (variant) {
    case 'primary':
      return Colors.accentForeground;
    case 'secondary':
      return Colors.primary;
    case 'ghost':
      return Colors.primary;
    case 'destructive':
      return Colors.errorForeground;
    default:
      return Colors.textPrimary;
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.default,
    paddingHorizontal: Spacing.lg,
  },

  // Variants
  primary: {
    backgroundColor: Colors.accent,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: Colors.error,
  },

  // Sizes
  default: {
    height: Sizing.buttonHeight,
    paddingHorizontal: Spacing.lg,
  },
  small: {
    height: 40,
    paddingHorizontal: Spacing.md,
  },
  large: {
    height: 56,
    paddingHorizontal: Spacing.xl,
  },

  // States
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
  fullWidth: {
    width: '100%',
  },

  // Text styles
  text: {
    textAlign: 'center',
  },
  primaryText: {
    color: Colors.accentForeground,
  },
  secondaryText: {
    color: Colors.primary,
  },
  ghostText: {
    color: Colors.primary,
  },
  destructiveText: {
    color: Colors.errorForeground,
  },
});
