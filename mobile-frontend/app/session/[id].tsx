/**
 * Session Detail Screen - Inventory Tracking Table
 * 
 * Core feature where mom:
 * 1. Adds items from saved presets
 * 2. Manually enters: Beg. Balance, Delivery, Pull Out, Ending, Sold Out
 * 3. App auto-computes: Total = Sold Out × Price
 * 4. Exports to PDF
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
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { FontSizes, FontFamilies } from '@/constants/typography';
import { formatCurrency, formatDateLong } from '@/utils/format';
import {
  getSessionById,
  getItemsBySession,
  getPresetsByUser,
  createItem,
  updateItem,
  deleteItem,
  closeSession,
} from '@/lib/db';
import { generateSessionPDF } from '@/utils/pdf';
import type { InventorySession, InventoryItem, PresetItem } from '@/lib/db/schema';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: authSession } = useAuth();
  const [sessionData, setSessionData] = useState<InventorySession | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || !authSession?.user) return;

    try {
      setLoading(true);
      
      const [session, sessionItems, userPresets] = await Promise.all([
        getSessionById(id),
        getItemsBySession(id),
        getPresetsByUser(authSession.user.id),
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
      setItems(sessionItems);
      setPresets(userPresets);
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

  // Calculate grand total
  const grandTotal = items.reduce((sum, item) => {
    const soldOutVal = item.sold_out || '';
    const soldOut = soldOutVal === '' ? 0 : parseFloat(soldOutVal);
    const price = parseFloat(item.price?.toString() || '0');
    return sum + (soldOut * price);
  }, 0);

  // Handle field update
  const handleUpdateField = async (
    itemId: string,
    field: string,
    value: string
  ) => {
    // Skip generated columns (ending and total are computed by DB)
    if (field === 'ending' || field === 'total') return;
    
    try {
      await updateItem(itemId, { [field]: value });
      
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
      
      // Create items with empty values (will show as "-")
      const newItems = selectedItems.map((preset, idx) => ({
        session_id: id,
        item_name: preset.item_name,
        price: preset.default_price || '0',
        beg_balance: '',
        delivery: '',
        pull_out: '',
        sold_out: '',
        remarks: '',
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
      await generateSessionPDF(sessionData, items, grandTotal);
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Add Item Button */}
          {isSessionOpen && (
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <IconSymbol name="add" size={20} color={Colors.primary} />
              <Body color="primary" style={{ fontWeight: '500' }}>Add Item from Presets</Body>
            </TouchableOpacity>
          )}

          {/* Items Table */}
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
            <View style={styles.tableContainer}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={[styles.tableCell, styles.itemCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>ITEM</Caption>
                </View>
                <View style={[styles.tableCell, styles.numericCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>BEG</Caption>
                </View>
                <View style={[styles.tableCell, styles.numericCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>DEL</Caption>
                </View>
                <View style={[styles.tableCell, styles.numericCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>PULL</Caption>
                </View>
                <View style={[styles.tableCell, styles.numericCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>END</Caption>
                </View>
                <View style={[styles.tableCell, styles.numericCell]}>
                  <Caption color="textSecondary" style={styles.headerText}>SOLD</Caption>
                </View>
              </View>

              {/* Table Rows */}
              {items.map((item, index) => (
                <TableRow
                  key={item.id}
                  item={item}
                  index={index}
                  isEditable={isSessionOpen}
                  onUpdate={handleUpdateField}
                  onDelete={() => handleDeleteItem(item)}
                />
              ))}

              {/* Grand Total */}
              <View style={styles.grandTotalRow}>
                <Body style={styles.grandTotalLabel}>GRAND TOTAL</Body>
                <Title style={styles.grandTotalValue}>{formatCurrency(grandTotal)}</Title>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              variant="secondary"
              fullWidth
              loading={exporting}
              onPress={handleExportPDF}
              icon={<IconSymbol name="pdfExport" size={20} color={Colors.primary} />}
              disabled={items.length === 0}
            >
              Export PDF
            </Button>

            {isSessionOpen && (
              <Button
                variant="ghost"
                fullWidth
                onPress={handleCloseSession}
              >
                Close Session
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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

// Table Row Component with Inline Editing
interface TableRowProps {
  item: InventoryItem;
  index: number;
  isEditable: boolean;
  onUpdate: (itemId: string, field: string, value: string) => void;
  onDelete: () => void;
}

function TableRow({ item, index, isEditable, onUpdate, onDelete }: TableRowProps) {
  // Allow null values - use '-' if empty/null
  const soldOutVal = item.sold_out || '';
  const price = parseFloat(item.price?.toString() || '0');
  const soldOut = soldOutVal === '' ? 0 : parseFloat(soldOutVal);
  const total = soldOut * price;

  return (
    <TouchableOpacity
      onLongPress={isEditable ? onDelete : undefined}
      activeOpacity={1}
      delayLongPress={500}
    >
      <View style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}>
        {/* Item Name & Price */}
        <View style={[styles.tableCell, styles.itemCell]}>
          <Body style={styles.itemName} numberOfLines={2}>{item.item_name}</Body>
          <Caption color="textMuted">{formatCurrency(price)}</Caption>
        </View>

        {/* Beg Balance */}
        <View style={[styles.tableCell, styles.numericCell]}>
          <InlineNumberInput
            value={item.beg_balance || ''}
            onChangeValue={(val) => onUpdate(item.id, 'beg_balance', val)}
            editable={isEditable}
          />
        </View>

        {/* Delivery */}
        <View style={[styles.tableCell, styles.numericCell]}>
          <InlineNumberInput
            value={item.delivery || ''}
            onChangeValue={(val) => onUpdate(item.id, 'delivery', val)}
            editable={isEditable}
          />
        </View>

        {/* Pull Out */}
        <View style={[styles.tableCell, styles.numericCell]}>
          <InlineNumberInput
            value={item.pull_out || ''}
            onChangeValue={(val) => onUpdate(item.id, 'pull_out', val)}
            editable={isEditable}
          />
        </View>

        {/* Ending */}
        <View style={[styles.tableCell, styles.numericCell]}>
          <InlineNumberInput
            value={item.ending || ''}
            onChangeValue={(val) => onUpdate(item.id, 'ending', val)}
            editable={isEditable}
          />
        </View>

        {/* Sold Out */}
        <View style={[styles.tableCell, styles.numericCell]}>
          <InlineNumberInput
            value={item.sold_out || ''}
            onChangeValue={(val) => onUpdate(item.id, 'sold_out', val)}
            editable={isEditable}
          />
        </View>
      </View>

      {/* Row Footer - Total & Remarks */}
      <View style={[styles.rowFooter, index % 2 === 1 && styles.tableRowAlt]}>
        <View style={styles.remarksContainer}>
          {isEditable ? (
            <TextInput
              style={styles.remarksInput}
              value={item.remarks || ''}
              onChangeText={(val) => onUpdate(item.id, 'remarks', val)}
              placeholder="Remarks..."
              placeholderTextColor={Colors.textMuted}
            />
          ) : (
            <Caption color="textMuted">{item.remarks || '-'}</Caption>
          )}
        </View>
        <View style={styles.totalContainer}>
          <Caption color="textSecondary">Total:</Caption>
          <Body style={styles.totalValue}>{formatCurrency(total)}</Body>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Inline Number Input Component
interface InlineNumberInputProps {
  value: string;
  onChangeValue: (value: string) => void;
  editable: boolean;
}

function InlineNumberInput({ value, onChangeValue, editable }: InlineNumberInputProps) {
  const inputRef = useRef<TextInput>(null);
  
  // Force re-render when value prop changes
  const [key, setKey] = React.useState(0);
  const [localValue, setLocalValue] = React.useState('');
  
  // Initialize and update when value changes
  React.useEffect(() => {
    const newValue = value || '';
    setLocalValue(newValue);
    // Force re-render with new key
    setKey(prev => prev + 1);
  }, [value]);

  const handleBlur = () => {
    const currentValue = localValue || '';
    const cleaned = currentValue.toString().trim();
    
    if (cleaned === '') {
      setLocalValue('-');
      onChangeValue('');
    } else {
      const numValue = cleaned.replace(/[^0-9.]/g, '');
      setLocalValue(numValue || '-');
      onChangeValue(numValue);
    }
  };

  const displayValue = localValue === '' ? '-' : (localValue || '-');
  
  if (!editable) {
    return <Body style={styles.numericValue}>{displayValue}</Body>;
  }

  return (
    <TextInput
      key={key}
      ref={inputRef}
      style={styles.inlineInput}
      value={localValue}
      onChangeText={(text) => setLocalValue(text)}
      onBlur={handleBlur}
      keyboardType="default"
      selectTextOnFocus
      placeholder="-"
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    marginBottom: Spacing.md,
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
  tableContainer: {
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  tableRowAlt: {
    // Removed alternating background color
  },
  tableCell: {
    paddingHorizontal: Spacing.xs,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  itemCell: {
    flex: 2,
    paddingLeft: Spacing.sm,
  },
  numericCell: {
    flex: 1,
    alignItems: 'center',
  },
  itemName: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    lineHeight: 18,
  },
  numericValue: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamilies.regular,
    textAlign: 'center',
  },
  inlineInput: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamilies.regular,
    textAlign: 'center',
    color: Colors.textPrimary,
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 40,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  remarksContainer: {
    flex: 1,
  },
  remarksInput: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    padding: 0,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  totalValue: {
    fontWeight: '600',
    color: Colors.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  grandTotalLabel: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  grandTotalValue: {
    color: Colors.primary,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
    borderBottomColor: Colors.border,
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
    borderRadius: BorderRadius.default,
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
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
});
