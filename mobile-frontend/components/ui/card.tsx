/**
 * Card Component - JB Inventory Tracker
 * 
 * Surface container with optional header and footer.
 * Supports press interactions with haptic feedback.
 */

import React from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, Shadows as ColorShadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';

export interface CardProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: ViewStyle;
  pressable?: boolean;
  noPadding?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
}

export function Card({
  children,
  style,
  pressable = false,
  noPadding = false,
  variant = 'default',
  onPress,
  ...props
}: CardProps) {
  const handlePress = (event: any) => {
    if (pressable && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(event);
    }
  };

  const Container = pressable ? Pressable : View;

  return (
    <Container
      onPress={handlePress}
      style={({ pressed }: any) => [
        styles.base,
        styles[variant],
        !noPadding && styles.padding,
        pressable && pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      {children}
    </Container>
  );
}

// Card Header Component
export interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      {children}
    </View>
  );
}

// Card Content Component
export interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps) {
  return (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );
}

// Card Footer Component
export interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps) {
  return (
    <View style={[styles.footer, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  padding: {
    padding: Spacing.md,
  },

  // Variants
  default: {
    ...ColorShadows.small,
  },
  elevated: {
    ...ColorShadows.medium,
  },
  outlined: {
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // States
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // Sub-components
  header: {
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.sm,
  },
  content: {
    // Content is just a wrapper, no specific styles
  },
  footer: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.sm,
  },
});
