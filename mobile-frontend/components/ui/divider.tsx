/**
 * Divider Component - JB Inventory Tracker
 * 
 * Horizontal or vertical line separator.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  style?: ViewStyle;
  color?: keyof typeof Colors;
  thickness?: number;
}

export function Divider({
  orientation = 'horizontal',
  style,
  color = 'border',
  thickness = 1,
}: DividerProps) {
  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        {
          backgroundColor: Colors[color],
          [orientation === 'horizontal' ? 'height' : 'width']: thickness,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    width: '100%',
    height: 1,
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
