/**
 * Input Component - JB Inventory Tracker
 * 
 * Text input with label, error state, and helper text.
 * Touch-friendly (48pt height) with proper keyboard types.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  TextInputProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Text } from '@/components/text';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, Sizing, BorderRadius } from '@/constants/spacing';
import { FontFamilies, FontSizes } from '@/constants/typography';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  containerStyle?: ViewStyle;
  required?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  containerStyle,
  required,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text variant="label" style={styles.label} color="textSecondary">
          {label}
          {required && <Text color="error"> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />

      {error && (
        <Text variant="caption" style={styles.errorText} color="error">
          {error}
        </Text>
      )}

      {helperText && !error && (
        <Text variant="caption" style={styles.helperText} color="textMuted">
          {helperText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    height: Sizing.inputHeight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  inputFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
    ...Shadows.small,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    marginTop: 6,
    color: Colors.error,
  },
  helperText: {
    marginTop: 6,
  },
});

// Number Input variant
export interface NumberInputProps extends Omit<InputProps, 'keyboardType'> {
  min?: number;
  max?: number;
  step?: number;
  value?: string;
  onChangeValue?: (value: number) => void;
}

export function NumberInput({
  min,
  max,
  step = 1,
  value,
  onChangeValue,
  onChangeText,
  ...props
}: NumberInputProps) {
  const handleChange = (text: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Call original onChangeText if provided
    onChangeText?.(cleaned);

    // Parse and validate
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (min !== undefined && num < min) return;
      if (max !== undefined && num > max) return;
      onChangeValue?.(num);
    } else if (cleaned === '') {
      onChangeValue?.(0);
    }
  };

  return (
    <Input
      keyboardType="numeric"
      value={value}
      onChangeText={handleChange}
      {...props}
    />
  );
}
