/**
 * Text Component - JB Inventory Tracker
 * 
 * Typography-based text component with predefined variants.
 * Replaces the standard React Native Text with design system tokens.
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { Typography, type TypographyKey } from '@/constants/typography';
import { Colors } from '@/constants/colors';

export type TextVariant = TypographyKey;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof typeof Colors;
  children?: React.ReactNode;
}

export function Text({ 
  variant = 'body', 
  color,
  style, 
  children, 
  ...props 
}: TextProps) {
  const variantStyle = { ...Typography[variant] };
  const colorStyle = color ? { color: Colors[color] } : { color: Colors.textPrimary };

  return (
    <RNText 
      style={[variantStyle as any, colorStyle, style]} 
      {...props}
    >
      {children}
    </RNText>
  );
}

// Convenience exports for common text types
export function Title({ children, style, ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="h1" style={style} {...props}>{children}</Text>;
}

export function Subtitle({ children, style, ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="h2" style={style} {...props}>{children}</Text>;
}

export function Body({ children, style, ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="body" style={style} {...props}>{children}</Text>;
}

export function Label({ children, style, ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="label" style={style} {...props}>{children}</Text>;
}

export function Caption({ children, style, ...props }: Omit<TextProps, 'variant'>) {
  return <Text variant="caption" style={style} {...props}>{children}</Text>;
}
