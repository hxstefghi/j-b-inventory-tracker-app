/**
 * Badge Component - JB Inventory Tracker
 * 
 * Status indicator badges (Open/Closed, Success/Error, etc.)
 * Small pill-shaped indicators for session status and other states.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from '@/components/text';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'small' | 'default';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Badge({
  variant = 'neutral',
  size = 'default',
  children,
  style,
}: BadgeProps) {
  return (
    <View style={[
      styles.base,
      styles[variant],
      styles[size],
      style,
    ]}>
      <Text 
        variant="caption" 
        style={[styles.text, styles[`${variant}Text`]]}
      >
        {children}
      </Text>
    </View>
  );
}

// Convenience exports for common badge types
export function StatusBadge({ 
  status, 
  style 
}: { 
  status: 'open' | 'closed';
  style?: ViewStyle;
}) {
  return (
    <Badge 
      variant={status === 'open' ? 'success' : 'neutral'} 
      style={style}
    >
      {status.toUpperCase()}
    </Badge>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },

  // Sizes
  default: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  small: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },

  // Variants
  success: {
    backgroundColor: `${Colors.success}20`, // 20% opacity
  },
  warning: {
    backgroundColor: `${Colors.warning}20`,
  },
  error: {
    backgroundColor: `${Colors.error}20`,
  },
  info: {
    backgroundColor: `${Colors.primary}20`,
  },
  neutral: {
    backgroundColor: `${Colors.textMuted}20`,
  },

  // Text styles
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  successText: {
    color: Colors.success,
  },
  warningText: {
    color: Colors.warning,
  },
  errorText: {
    color: Colors.error,
  },
  infoText: {
    color: Colors.primary,
  },
  neutralText: {
    color: Colors.textSecondary,
  },
});
