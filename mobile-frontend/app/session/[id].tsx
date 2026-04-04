/**
 * Session Detail Screen - Inventory Tracking Table
 * 
 * Core feature where mom:
 * 1. Adds items from saved presets
 * 2. Manually enters: Beg. Balance, Delivery, Pull Out, Ending (can be numbers OR text like "N/A", "broken")
 * 3. Manually enters: Sold Out (numbers only, used for computation)
 * 4. App auto-computes: Total = Sold Out × Price (only if Sold Out is numeric)
 * 5. Exports to PDF
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption, Label } from '@/components/text';
import { Button, Card, CardContent, Input } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSizes, FontFamilies } from '@/constants/typography';
import { formatCurrency, formatDateLong } from '@/utils/format';
import {
  getSessionById,
  getItemsBySession,
  getPresetsByUser,
  getPosSalesBySession,
  createItem,
  updateItem,
  deleteItem,
  closeSession,
} from '@/lib/db';
import { generateSessionPDF, CalculatedSoldOutMap } from '@/utils/pdf';
import type { InventorySession, InventoryItem, PresetItem, PosSale } from '@/lib/db/schema';
import { RAW_INVENTORY_ITEMS, calculateRawInventoryFromSales } from '@/constants/menu';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: authSession } = useAuth();
  const [sessionData, setSessionData] = useState<InventorySession | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [posSales, setPosSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  // Check if this is a new-style session with raw inventory items
  const isNewStyleSession = items.length > 0 && 
    RAW_INVENTORY_ITEMS.some(raw => items.some(item => item.item_name === raw.name));

  // Calculate raw inventory from POS sales
  const calculatedSoldOut = calculateRawInventoryFromSales(
    posSales.map(sale => ({
      menuItemId: sale.menu_item_id,
      quantity: sale.quantity_sold,
    }))
  );

  const loadData = useCallback(async () => {
    if (!id || !authSession?.user) return;

    try {
      setLoading(true);
      
      const [session, sessionItems, userPresets, sessionPosSales] = await Promise.all([
        getSessionById(id),
        getItemsBySession(id),
        getPresetsByUser(authSession.user.id),
        getPosSalesBySession(id),
      ]);
      
      // Log what we get from DB
      console.log('Session Items from DB:', sessionItems.map(item => ({
        id: item.id,
        beg_balance: item.beg_balance,
        delivery: item.delivery,
        pull_out: item.pull_out,
        sold_out: item.sold_out
      })));
      
      setSessionData(session);
      setItems(sessionItems || []);
      setPresets(userPresets || []);
      setPosSales(sessionPosSales || []);
    } catch (error) {
      console.error('Error loading session:', error);
      Alert.alert('Error', 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  }, [id, authSession?.user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Get sold out value for an item (from POS calculation for new-style sessions)
  const getSoldOutValue = (item: InventoryItem): number => {
    if (isNewStyleSession) {
      // Find matching raw inventory item
      const rawItem = RAW_INVENTORY_ITEMS.find(raw => raw.name === item.item_name);
      if (rawItem) {
        return calculatedSoldOut[rawItem.id] || 0;
      }
    }
    // For old-style sessions, use the stored sold_out value
    const soldOutVal = item.sold_out || '';
    const isNumeric = /^[0-9]+\.?[0-9]*$/.test(soldOutVal);
    return isNumeric ? parseFloat(soldOutVal) : 0;
  };

  // Calculate grand total (only from sold_out if it's numeric)
  const grandTotal = items.reduce((sum, item) => {
    const soldOut = getSoldOutValue(item);
    const price = parseFloat(item.price?.toString() || '0');
    return sum + (soldOut * price);
  }, 0);

  // Handle field update
  const handleUpdateField = async (
    itemId: string,
    field: string,
    value: string
  ) => {
    // Skip generated column (total is computed by DB)
    if (field === 'total') return;
    
    try {
      // Convert empty strings to null for PostgreSQL
      const dbValue = value === '' ? null : value;
      await updateItem(itemId, { [field]: dbValue });
      
      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // Add items from preset picker
  const handleAddFromPresets = async () => {
    if (selectedPresets.size === 0) return;

    try {
      const selectedItems = presets.filter(p => selectedPresets.has(p.id));
      
      // Create items with null values (will show as "-" in UI)
      const newItems = selectedItems.map((preset, idx) => ({
        session_id: id,
        item_name: preset.item_name,
        price: preset.default_price || '0',
        beg_balance: null,
        delivery: null,
        pull_out: null,
        sold_out: null,
        remarks: null,
        sort_order: items.length + idx,
      }));

      // Insert all items
      for (const item of newItems) {
        await createItem(item);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickerVisible(false);
      setSelectedPresets(new Set());
      
      // Refresh data to get new items with IDs
      await loadData();
    } catch (error) {
      console.error('Error adding items:', error);
      Alert.alert('Error', 'Failed to add items');
    }
  };

  // Delete item
  const handleDeleteItem = (item: InventoryItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.item_name}" from this session?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item.id);
              setItems(prev => prev.filter(i => i.id !== item.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error deleting item:', error);
            }
          },
        },
      ]
    );
  };

  // Close session
  const handleCloseSession = () => {
    Alert.alert(
      'Close Session',
      'Are you sure you want to close this session? You can still view it but cannot make changes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Close Session',
          onPress: async () => {
            try {
              await closeSession(id!);
              setSessionData(prev => prev ? { ...prev, status: 'closed' } : null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error closing session:', error);
            }
          },
        },
      ]
    );
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!sessionData) return;
    
    setExporting(true);
    try {
      // Build calculatedSoldOut map using item names for PDF
      let pdfCalculatedSoldOut: CalculatedSoldOutMap | undefined;
      
      if (isNewStyleSession) {
        pdfCalculatedSoldOut = {};
        items.forEach(item => {
          const rawItem = RAW_INVENTORY_ITEMS.find(raw => raw.name === item.item_name);
          if (rawItem) {
            pdfCalculatedSoldOut![item.item_name] = calculatedSoldOut[rawItem.id] || 0;
          }
        });
      }
      
      await generateSessionPDF(sessionData, items, grandTotal, pdfCalculatedSoldOut);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  // Toggle preset selection
  const togglePresetSelection = (presetId: string) => {
    setSelectedPresets(prev => {
      const next = new Set(prev);
      if (next.has(presetId)) {
        next.delete(presetId);
      } else {
        next.add(presetId);
      }
      return next;
    });
  };

  const isSessionOpen = sessionData?.status === 'open';

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Body color="textMuted">Loading session...</Body>
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

  const rawInventoryPresets = presets.filter(p => p.category === 'raw_inventory');
  const menuItemPresets = presets.filter(p => p.category !== 'raw_inventory');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevronLeft" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Subtitle>{formatDateLong(new Date(sessionData.session_date))}</Subtitle>
          <Caption color="textMuted">
            {sessionData.shift} Shift • {sessionData.cashier_name}
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

      {/* Sticky Add Bar - Different for new vs old style sessions */}
      {isSessionOpen && (
        <View style={styles.stickyAddBar}>
          {isNewStyleSession ? (
            <TouchableOpacity
              style={styles.stickyPosButton}
              onPress={() => router.push(`/pos/${id}` as any)}
              activeOpacity={0.7}
            >
              <IconSymbol name="receipt" size={18} color={Colors.primary} />
              <Body color="primary" style={{ fontWeight: '600', fontSize: FontSizes.sm }}>
                {posSales.length > 0 ? 'Edit POS Data' : 'Enter POS Data'}
              </Body>
              {posSales.length > 0 && (
                <View style={styles.posDataBadge}>
                  <Caption style={styles.posDataBadgeText}>
                    {posSales.reduce((sum, s) => sum + s.quantity_sold, 0)} items
                  </Caption>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.stickyAddButton}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="add" size={18} color={Colors.primary} />
              <Body color="primary" style={{ fontWeight: '600', fontSize: FontSizes.sm }}>Add Item</Body>
            </TouchableOpacity>
          )}
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Items List */}
          {items.length === 0 ? (
            <Card variant="outlined" style={styles.emptyCard}>
              <CardContent style={styles.emptyContent}>
                <IconSymbol name="inventory" size={40} color={Colors.textMuted} />
                <Subtitle color="textMuted" style={styles.emptyTitle}>No items yet</Subtitle>
                <Body color="textMuted" style={styles.emptyText}>
                  Tap "Add Item" to start tracking inventory
                </Body>
              </CardContent>
            </Card>
          ) : (
            <View style={styles.itemsList}>
              {items.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isEditable={isSessionOpen}
                  isNewStyleSession={isNewStyleSession}
                  calculatedSoldOut={getSoldOutValue(item)}
                  onUpdate={handleUpdateField}
                  onDelete={() => handleDeleteItem(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Compact Bottom Section: Grand Total + Action Buttons */}
      {items.length > 0 && (
        <View style={styles.bottomSection}>
          {/* Compact Grand Total */}
          <View style={styles.grandTotalCard}>
            <View style={styles.grandTotalIcon}>
              <IconSymbol name="attachMoney" size={20} color="white" />
            </View>
            <View style={styles.grandTotalInfo}>
              <Caption style={styles.grandTotalLabel}>Total Sales</Caption>
              <Title style={styles.grandTotalAmount}>{formatCurrency(grandTotal)}</Title>
            </View>
          </View>

          {/* Compact Action Buttons */}
          <View style={styles.actionButtonsRow}>
            {/* Export to PDF Button */}
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportPDF}
              disabled={exporting || items.length === 0}
              activeOpacity={0.7}
            >
              <IconSymbol 
                name="pdfExport" 
                size={18} 
                color={exporting ? Colors.textMuted : Colors.primary} 
              />
              <Body style={styles.exportButtonLabel}>
                {exporting ? 'Exporting...' : 'Export to PDF'}
              </Body>
            </TouchableOpacity>

            {/* Complete Session Button */}
            {isSessionOpen && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={handleCloseSession}
                activeOpacity={0.7}
              >
                <IconSymbol name="lockClosed" size={18} color="white" />
                <Body style={styles.completeButtonLabel}>Complete Session</Body>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Preset Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPickerVisible(false)}>
              <Body color="primary">Cancel</Body>
            </TouchableOpacity>
            <Subtitle>Select Items</Subtitle>
            <TouchableOpacity onPress={handleAddFromPresets}>
              <Body color="primary" style={{ fontWeight: '600' }}>
                Add ({selectedPresets.size})
              </Body>
            </TouchableOpacity>
          </View>

          {presets.length === 0 ? (
            <View style={styles.centerContent}>
              <IconSymbol name="category" size={40} color={Colors.textMuted} />
              <Body color="textMuted" style={{ marginTop: Spacing.md, textAlign: 'center' }}>
                No preset items yet.{'\n'}Add items in the Items tab first.
              </Body>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.pickerContent}>
              {/* Raw Inventory Section */}
              {rawInventoryPresets.length > 0 && (
                <View style={styles.pickerSection}>
                  <View style={styles.pickerSectionHeader}>
                    <IconSymbol name="localGroceryStore" size={18} color={Colors.textSecondary} />
                    <Subtitle style={styles.pickerSectionTitle}>Raw Inventory</Subtitle>
                  </View>
                  {rawInventoryPresets.map(preset => (
                    <PresetPickerItem
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.has(preset.id)}
                      onToggle={() => togglePresetSelection(preset.id)}
                    />
                  ))}
                </View>
              )}

              {/* Menu Items Section */}
              {menuItemPresets.length > 0 && (
                <View style={styles.pickerSection}>
                  <View style={styles.pickerSectionHeader}>
                    <IconSymbol name="restaurant" size={18} color={Colors.textSecondary} />
                    <Subtitle style={styles.pickerSectionTitle}>Menu Items</Subtitle>
                  </View>
                  {menuItemPresets.map(preset => (
                    <PresetPickerItem
                      key={preset.id}
                      preset={preset}
                      isSelected={selectedPresets.has(preset.id)}
                      onToggle={() => togglePresetSelection(preset.id)}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Item Card Component with Full-Width Inputs
interface ItemCardProps {
  item: InventoryItem;
  index: number;
  isEditable: boolean;
  isNewStyleSession: boolean;
  calculatedSoldOut: number;
  onUpdate: (itemId: string, field: string, value: string) => void;
  onDelete: () => void;
}

function ItemCard({ item, index, isEditable, isNewStyleSession, calculatedSoldOut, onUpdate, onDelete }: ItemCardProps) {
  // Calculate total from sold_out
  const soldOut = isNewStyleSession ? calculatedSoldOut : (() => {
    const soldOutVal = item.sold_out || '';
    const isNumeric = /^[0-9]+\.?[0-9]*$/.test(soldOutVal);
    return isNumeric ? parseFloat(soldOutVal) : 0;
  })();
  const price = parseFloat(item.price?.toString() || '0');
  const total = soldOut * price;

  return (
    <TouchableOpacity
      onLongPress={isEditable ? onDelete : undefined}
      activeOpacity={1}
      delayLongPress={500}
    >
      <View style={styles.itemCard}>
        {/* Header: Item Name & Price */}
        <View style={styles.itemCardHeader}>
          <View style={{ flex: 1 }}>
            <Body style={styles.itemCardName}>{item.item_name}</Body>
          </View>
          <View style={styles.priceBadge}>
            <Caption color="textMuted" style={styles.priceLabel}>PRICE</Caption>
            <Caption style={styles.priceValue}>{formatCurrency(price)}</Caption>
          </View>
          {isEditable && !isNewStyleSession && (
            <TouchableOpacity 
              onPress={onDelete} 
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} 
              style={styles.deleteButton}
            >
              <IconSymbol name="trash" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>

        {/* Simplified Input Form */}
        <View style={styles.inputGrid}>
          {/* Starting Stock */}
          <View style={styles.formSection}>
            <View style={styles.formSectionHeader}>
              <View style={styles.stepNumber}>
                <Caption style={styles.stepNumberText}>1</Caption>
              </View>
              <Body style={styles.formSectionTitle}>Beginning Balance</Body>
            </View>
            <View style={styles.inputField}>
              <InlineTextInput
                value={item.beg_balance || ''}
                onChangeValue={(val) => onUpdate(item.id, 'beg_balance', val)}
                editable={isEditable}
                placeholder="-"
              />
            </View>
          </View>

          {/* Stock Changes */}
          <View style={styles.formSection}>
            <View style={styles.formSectionHeader}>
              <View style={styles.stepNumber}>
                <Caption style={styles.stepNumberText}>2</Caption>
              </View>
              <Body style={styles.formSectionTitle}>Stock Changes</Body>
              <Caption color="textMuted" style={styles.optionalTag}>(Optional)</Caption>
            </View>
            <View style={styles.stockChangesRow}>
              <View style={styles.stockChangeItem}>
                <View style={styles.stockChangeHeader}>
                  <IconSymbol name="add" size={16} color={Colors.success} />
                  <Caption color="success" style={styles.stockChangeLabel}>Delivery</Caption>
                </View>
                <InlineTextInput
                  value={item.delivery || ''}
                  onChangeValue={(val) => onUpdate(item.id, 'delivery', val)}
                  editable={isEditable}
                  placeholder="-"
                />
              </View>
              <View style={styles.stockChangeItem}>
                <View style={styles.stockChangeHeader}>
                  <IconSymbol name="remove" size={16} color={Colors.error} />
                  <Caption color="error" style={styles.stockChangeLabel}>Pull Out</Caption>
                </View>
                <InlineTextInput
                  value={item.pull_out || ''}
                  onChangeValue={(val) => onUpdate(item.id, 'pull_out', val)}
                  editable={isEditable}
                  placeholder="-"
                />
              </View>
            </View>
          </View>

          {/* Ending Count */}
          <View style={styles.formSection}>
            <View style={styles.formSectionHeader}>
              <View style={styles.stepNumber}>
                <Caption style={styles.stepNumberText}>3</Caption>
              </View>
              <Body style={styles.formSectionTitle}>Ending</Body>
            </View>
            <View style={styles.inputField}>
              <InlineTextInput
                value={item.ending || ''}
                onChangeValue={(val) => onUpdate(item.id, 'ending', val)}
                editable={isEditable}
                placeholder="-"
              />
            </View>
          </View>

          {/* Sold Quantity - Most Important */}
          <View style={styles.soldSection}>
            <View style={styles.formSectionHeader}>
              <View style={[styles.stepNumber, styles.stepNumberPrimary]}>
                <Caption style={styles.stepNumberTextWhite}>4</Caption>
              </View>
              <Body style={styles.formSectionTitlePrimary}>Sold Out</Body>
              {isNewStyleSession ? (
                <View style={styles.calculatedBadge}>
                  <IconSymbol name="calculator" size={12} color={Colors.primary} />
                  <Caption style={styles.calculatedBadgeText}>From POS</Caption>
                </View>
              ) : (
                <View style={styles.calculationBadge}>
                  <Caption style={styles.calculationBadgeText}>Used for total</Caption>
                </View>
              )}
            </View>
            <View style={styles.inputField}>
              {isNewStyleSession ? (
                <View style={styles.calculatedValue}>
                  <Body style={styles.calculatedValueText}>
                    {soldOut > 0 ? soldOut.toString() : '-'}
                  </Body>
                </View>
              ) : (
                <InlineTextInput
                  value={item.sold_out || ''}
                  onChangeValue={(val) => onUpdate(item.id, 'sold_out', val)}
                  editable={isEditable}
                  placeholder="-"
                  keyboardType="numeric"
                  emphasized
                />
              )}
            </View>
          </View>
        </View>

        {/* Footer: Remarks & Total */}
        <View style={styles.itemCardFooter}>
          <View style={styles.remarksField}>
            <Caption color="textSecondary" style={styles.inputLabel}>REMARKS</Caption>
            {isEditable ? (
              <TextInput
                style={styles.remarksInput}
                value={item.remarks || ''}
                onChangeText={(val) => onUpdate(item.id, 'remarks', val)}
                placeholder="Optional notes..."
                placeholderTextColor={Colors.textMuted}
              />
            ) : (
              <Caption color="textMuted">{item.remarks || '-'}</Caption>
            )}
          </View>
          <View style={styles.totalField}>
            <Caption color="textSecondary" style={styles.inputLabel}>TOTAL</Caption>
            <Body style={styles.totalValue}>{formatCurrency(total)}</Body>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Inline Text Input Component (Accepts both numbers and text)
interface InlineTextInputProps {
  value: string | null;
  onChangeValue: (value: string) => void;
  editable: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  emphasized?: boolean;
}

function InlineTextInput({ 
  value, 
  onChangeValue, 
  editable, 
  placeholder = '-',
  keyboardType = 'default',
  emphasized = false
}: InlineTextInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState('');
  
  // Normalize prop value (handle null, undefined, and string)
  const normalizedValue = value ?? '';
  
  // Sync local state with prop value when not focused
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(normalizedValue);
    }
  }, [normalizedValue, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    // Clear placeholder values when focusing
    if (localValue === '-' || localValue === '') {
      setLocalValue('');
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const cleaned = localValue.toString().trim();
    
    if (cleaned === '' || cleaned === '-') {
      setLocalValue('');
      onChangeValue('');
    } else {
      setLocalValue(cleaned);
      onChangeValue(cleaned);
    }
  };

  // Display value: show dash for empty when not focused
  const displayValue = isFocused ? localValue : (localValue === '' ? '-' : localValue);
  
  if (!editable) {
    return <Body style={styles.displayValue}>{normalizedValue === '' ? '-' : normalizedValue}</Body>;
  }

  return (
    <TextInput
      ref={inputRef}
      style={[styles.textInput, emphasized && styles.textInputEmphasized]}
      value={displayValue}
      onChangeText={setLocalValue}
      onFocus={handleFocus}
      onBlur={handleBlur}
      keyboardType={keyboardType}
      selectTextOnFocus
      placeholder={placeholder}
      placeholderTextColor={Colors.textMuted}
    />
  );
}

// Preset Picker Item
interface PresetPickerItemProps {
  preset: PresetItem;
  isSelected: boolean;
  onToggle: () => void;
}

function PresetPickerItem({ preset, isSelected, onToggle }: PresetPickerItemProps) {
  return (
    <TouchableOpacity
      style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.pickerItemInfo}>
        <Body style={{ fontWeight: isSelected ? '600' : '400' }}>{preset.item_name}</Body>
        <Caption color="textMuted">
          {formatCurrency(parseFloat(preset.default_price || '0'))}
        </Caption>
      </View>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <IconSymbol name="check" size={16} color={Colors.accentForeground} />}
      </View>
    </TouchableOpacity>
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
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
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
    paddingBottom: 180,
  },
  // Sticky Add Bar
  stickyAddBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  stickyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '05',
  },
  stickyPosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  posDataBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  posDataBadgeText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  emptyCard: {
    marginBottom: Spacing.md,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  // Item Card Styles
  itemsList: {
    gap: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  itemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  itemCardName: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  priceBadge: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  priceLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  priceValue: {
    fontSize: FontSizes.xs,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  inputGrid: {
    gap: Spacing.md,
  },
  formSection: {
    gap: Spacing.sm,
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  formSectionTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  formSectionTitlePrimary: {
    fontSize: FontSizes.base,
    fontWeight: '700',
    color: Colors.primary,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  stepNumberTextWhite: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  optionalTag: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  stockChangesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stockChangeItem: {
    flex: 1,
    gap: Spacing.xs,
  },
  stockChangeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockChangeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  soldSection: {
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  calculationBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  calculationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  calculatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  calculatedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  calculatedValue: {
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    minHeight: 44,
    justifyContent: 'center',
  },
  calculatedValueText: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Colors.primary,
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputField: {
    flex: 1,
  },
  soldOutField: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.regular,
    color: Colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 44,
  },
  textInputEmphasized: {
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary,
    borderWidth: 2,
    fontWeight: '600',
  },
  displayValue: {
    fontSize: FontSizes.base,
    fontFamily: FontFamilies.regular,
    color: Colors.textPrimary,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    minHeight: 44,
  },
  itemCardFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  remarksField: {
    flex: 2,
  },
  remarksInput: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 40,
  },
  totalField: {
    flex: 1,
    alignItems: 'center',
  },
  totalValue: {
    fontWeight: '700',
    color: Colors.primary,
    fontSize: FontSizes.lg,
    marginTop: 4,
    textAlign: 'center',
  },
  // Compact Bottom Section
  bottomSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    shadowColor: Colors.shadowColor,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: Spacing.sm,
  },
  grandTotalCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  grandTotalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grandTotalInfo: {
    flex: 1,
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    opacity: 0.85,
  },
  grandTotalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
  },
  actionButtonsRow: {
    gap: Spacing.sm,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    gap: Spacing.xs,
  },
  exportButtonLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  completeButtonLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: 'white',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  pickerContent: {
    padding: Spacing.md,
  },
  pickerSection: {
    marginBottom: Spacing.lg,
  },
  pickerSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  pickerSectionTitle: {
    flex: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.sm,
  },
  pickerItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  pickerItemInfo: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
