/**
 * POS Entry Screen - Duplicate Menu Item Sales
 * 
 * Enter the quantity sold for each menu item from the original POS.
 * Data is used to calculate raw inventory "Sold Out" values.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption, Label } from '@/components/text';
import { Button } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSizes } from '@/constants/typography';
import { formatCurrency, formatDateLong } from '@/utils/format';
import {
  getSessionById,
  getPosSalesBySession,
  upsertPosSalesBatch,
} from '@/lib/db';
import type { InventorySession, PosSale } from '@/lib/db/schema';
import { MENU_ITEMS, calculateRawInventoryFromSales, RAW_INVENTORY_ITEMS } from '@/constants/menu';

interface SalesEntry {
  menuItemId: string;
  quantity: number;
}

export default function POSEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: authSession } = useAuth();
  const [sessionData, setSessionData] = useState<InventorySession | null>(null);
  const [salesEntries, setSalesEntries] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      const [session, existingSales] = await Promise.all([
        getSessionById(id),
        getPosSalesBySession(id),
      ]);
      
      setSessionData(session);
      
      // Load existing POS sales into state
      const entriesMap = new Map<string, number>();
      for (const sale of existingSales) {
        entriesMap.set(sale.menu_item_id, sale.quantity_sold);
      }
      setSalesEntries(entriesMap);
    } catch (error) {
      console.error('Error loading POS data:', error);
      Alert.alert('Error', 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update quantity for a menu item
  const updateQuantity = (menuItemId: string, quantity: number) => {
    setSalesEntries(prev => {
      const next = new Map(prev);
      if (quantity > 0) {
        next.set(menuItemId, quantity);
      } else {
        next.delete(menuItemId);
      }
      return next;
    });
  };

  // Increment/decrement quantity
  const adjustQuantity = (menuItemId: string, delta: number) => {
    const current = salesEntries.get(menuItemId) || 0;
    const newValue = Math.max(0, current + delta);
    updateQuantity(menuItemId, newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Save all POS entries
  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      // Convert map to array for batch upsert
      const salesArray = Array.from(salesEntries.entries()).map(([menuItemId, qty]) => ({
        menuItemId,
        quantitySold: qty,
      }));

      // Also include items with 0 quantity to clear them
      for (const menuItem of MENU_ITEMS) {
        if (!salesEntries.has(menuItem.id)) {
          salesArray.push({
            menuItemId: menuItem.id,
            quantitySold: 0,
          });
        }
      }

      await upsertPosSalesBatch(id, salesArray);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'POS data saved successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving POS data:', error);
      Alert.alert('Error', 'Failed to save POS data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Calculate totals
  const totalMenuSales = Array.from(salesEntries.entries()).reduce((sum, [menuItemId, qty]) => {
    const menuItem = MENU_ITEMS.find(m => m.id === menuItemId);
    return sum + (menuItem ? menuItem.price * qty : 0);
  }, 0);

  const totalItemsSold = Array.from(salesEntries.values()).reduce((sum, qty) => sum + qty, 0);

  // Calculate raw inventory from current entries
  const rawInventoryTotals = calculateRawInventoryFromSales(
    Array.from(salesEntries.entries()).map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
    }))
  );

  const isSessionOpen = sessionData?.status === 'open';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Body color="textMuted">Loading...</Body>
        </View>
      </SafeAreaView>
    );
  }

  if (!sessionData) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Body color="textMuted">Session not found</Body>
          <Button variant="ghost" onPress={() => router.back()} style={{ marginTop: Spacing.md }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevronLeft" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Subtitle>POS Entry</Subtitle>
          <Caption color="textMuted">
            {formatDateLong(new Date(sessionData.session_date))} • {sessionData.shift}
          </Caption>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: isSessionOpen ? Colors.success + '20' : Colors.textMuted + '20' }
        ]}>
          <Caption style={{ color: isSessionOpen ? Colors.success : Colors.textMuted, fontWeight: '600' }}>
            {isSessionOpen ? 'Open' : 'Closed'}
          </Caption>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Caption color="textMuted">Items Sold</Caption>
                <Title style={styles.summaryValue}>{totalItemsSold}</Title>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Caption color="textMuted">Total Sales</Caption>
                <Title style={styles.summaryValuePrimary}>{formatCurrency(totalMenuSales)}</Title>
              </View>
            </View>
          </View>

          {/* Raw Inventory Preview */}
          {totalItemsSold > 0 && (
            <View style={styles.previewSection}>
              <View style={styles.previewHeader}>
                <IconSymbol name="calculator" size={16} color={Colors.primary} />
                <Caption style={styles.previewTitle}>Calculated Raw Inventory</Caption>
              </View>
              <View style={styles.previewGrid}>
                {RAW_INVENTORY_ITEMS.map(item => {
                  const qty = rawInventoryTotals[item.id] || 0;
                  if (qty === 0) return null;
                  return (
                    <View key={item.id} style={styles.previewItem}>
                      <Caption color="textSecondary">{item.name}</Caption>
                      <Body style={styles.previewQty}>{qty} {item.unit}</Body>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Menu Items List */}
          <View style={styles.menuSection}>
            <Subtitle style={styles.menuSectionTitle}>Menu Items</Subtitle>
            <Caption color="textMuted" style={styles.menuSectionSubtitle}>
              Enter the quantity sold for each item
            </Caption>
            
            <View style={styles.menuList}>
              {MENU_ITEMS.map((menuItem, index) => {
                const quantity = salesEntries.get(menuItem.id) || 0;
                const isLast = index === MENU_ITEMS.length - 1;
                
                return (
                  <View
                    key={menuItem.id}
                    style={[
                      styles.menuItemCard,
                      !isLast && styles.menuItemBorder,
                    ]}
                  >
                    <View style={styles.menuItemInfo}>
                      <Body style={styles.menuItemName}>{menuItem.name}</Body>
                      <Caption color="textMuted">{formatCurrency(menuItem.price)}</Caption>
                    </View>
                    
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={[
                          styles.quantityButton,
                          quantity === 0 && styles.quantityButtonDisabled,
                        ]}
                        onPress={() => adjustQuantity(menuItem.id, -1)}
                        disabled={quantity === 0}
                        activeOpacity={0.7}
                      >
                        <IconSymbol 
                          name="remove" 
                          size={18} 
                          color={quantity === 0 ? Colors.textMuted : Colors.textPrimary} 
                        />
                      </TouchableOpacity>
                      
                      <TextInput
                        style={[
                          styles.quantityInput,
                          quantity > 0 && styles.quantityInputActive,
                        ]}
                        value={quantity > 0 ? quantity.toString() : ''}
                        onChangeText={(text) => {
                          const num = parseInt(text) || 0;
                          updateQuantity(menuItem.id, num);
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        selectTextOnFocus
                      />
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => adjustQuantity(menuItem.id, 1)}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="add" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <IconSymbol name="check" size={20} color="white" />
          <Body style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save POS Data'}
          </Body>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.small,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  content: {
    padding: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.borderLight,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 4,
  },
  summaryValuePrimary: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 4,
  },
  previewSection: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  previewTitle: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  previewItem: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 80,
  },
  previewQty: {
    fontWeight: '600',
    color: Colors.textPrimary,
    fontSize: FontSizes.sm,
  },
  menuSection: {
    marginTop: Spacing.sm,
  },
  menuSectionTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSectionSubtitle: {
    marginBottom: Spacing.md,
  },
  menuList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  menuItemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  menuItemName: {
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityInput: {
    width: 56,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  quantityInputActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  bottomBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.medium,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: FontSizes.base,
  },
});
