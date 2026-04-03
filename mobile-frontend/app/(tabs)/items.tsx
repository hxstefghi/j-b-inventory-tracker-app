/**
 * Items Tab - Preset Items Management
 * 
 * Manage saved items with preset prices. Cashiers pick from these
 * when adding items to inventory sessions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption, Label } from '@/components/text';
import { Button, Input, NumberInput } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatCurrency } from '@/utils/format';
import { getPresetsByUser, createPreset, updatePreset, deletePreset } from '@/lib/db';
import type { PresetItem } from '@/lib/db/schema';

type Category = 'raw_inventory' | 'menu_item';

interface PresetFormData {
  item_name: string;
  category: Category;
  default_price: string;
}

const EMPTY_FORM: PresetFormData = {
  item_name: '',
  category: 'menu_item',
  default_price: '',
};

export default function ItemsScreen() {
  const { session } = useAuth();
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetItem | null>(null);
  const [formData, setFormData] = useState<PresetFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadPresets = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const data = await getPresetsByUser(session.user.id);
      setPresets(data);
    } catch (error) {
      console.error('Error loading presets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPresets();
  };

  const openAddModal = () => {
    setEditingPreset(null);
    setFormData(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEditModal = (preset: PresetItem) => {
    setEditingPreset(preset);
    setFormData({
      item_name: preset.item_name,
      category: (preset.category as Category) || 'menu_item',
      default_price: preset.default_price?.toString() || '',
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingPreset(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!session?.user || !formData.item_name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const presetData = {
        item_name: formData.item_name.trim(),
        category: formData.category,
        default_price: formData.default_price || '0',
        user_id: session.user.id,
        sort_order: presets.length,
      };

      if (editingPreset) {
        await updatePreset(editingPreset.id, presetData);
      } else {
        await createPreset(presetData);
      }

      closeModal();
      loadPresets();
    } catch (error) {
      console.error('Error saving preset:', error);
      Alert.alert('Error', 'Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (preset: PresetItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${preset.item_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePreset(preset.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadPresets();
            } catch (error) {
              console.error('Error deleting preset:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const rawInventoryItems = presets.filter(p => p.category === 'raw_inventory');
  const menuItems = presets.filter(p => p.category !== 'raw_inventory');

  const renderPresetItem = (item: PresetItem, index: number, items: PresetItem[]) => {
    const isFirst = index === 0;
    const isLast = index === items.length - 1;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => openEditModal(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
        style={[
          styles.presetCard,
          isFirst && styles.presetCardFirst,
          isLast && styles.presetCardLast,
          !isLast && styles.presetCardBorder,
        ]}
      >
        <View style={styles.presetInfo}>
          <Body style={styles.presetName}>{item.item_name}</Body>
          <Caption color="textMuted">
            {formatCurrency(parseFloat(item.default_price || '0'))}
          </Caption>
        </View>
        <IconSymbol name="chevronRight" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: PresetItem[], icon: 'restaurant' | 'localGroceryStore') => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: icon === 'restaurant' ? Colors.primary + '15' : Colors.secondary + '10' }]}>
            <IconSymbol 
              name={icon} 
              size={16} 
              color={icon === 'restaurant' ? Colors.primary : Colors.secondary} 
            />
          </View>
          <Subtitle style={styles.sectionTitle}>{title}</Subtitle>
          <View style={styles.countBadge}>
            <Caption style={styles.countText}>{items.length}</Caption>
          </View>
        </View>
        <View style={styles.sectionList}>
          {items.map((item, index) => renderPresetItem(item, index, items))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>My Items</Title>
          <Caption color="textMuted">Preset items for quick entry</Caption>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <IconSymbol name="add" size={22} color={Colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <Body color="textMuted">Loading...</Body>
        </View>
      ) : presets.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.emptyIcon}>
            <IconSymbol name="category" size={40} color={Colors.textMuted} />
          </View>
          <Subtitle color="textMuted" style={styles.emptyTitle}>No items yet</Subtitle>
          <Body color="textMuted" style={styles.emptyText}>
            Add your inventory items and menu items here.{'\n'}
            They'll be available when tracking.
          </Body>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={openAddModal}
            activeOpacity={0.7}
          >
            <Body style={styles.emptyButtonText}>Add First Item</Body>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <>
              {renderSection('Raw Inventory', rawInventoryItems, 'localGroceryStore')}
              {renderSection('Menu Items', menuItems, 'restaurant')}
              <View style={{ height: 120 }} />
            </>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal} style={styles.modalHeaderButton}>
              <Body color="textSecondary">Cancel</Body>
            </TouchableOpacity>
            <Subtitle style={styles.modalTitle}>
              {editingPreset ? 'Edit Item' : 'Add Item'}
            </Subtitle>
            <TouchableOpacity 
              onPress={handleSave} 
              disabled={saving}
              style={styles.modalHeaderButton}
            >
              <Body style={[
                styles.saveText,
                saving && { color: Colors.textMuted }
              ]}>
                {saving ? 'Saving...' : 'Save'}
              </Body>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.modalContent}>
            {/* Item Name */}
            <Input
              label="Item Name"
              placeholder="e.g., 1pc Chicken w/Rice"
              value={formData.item_name}
              onChangeText={(text) => setFormData({ ...formData, item_name: text })}
              autoFocus
              required
            />

            {/* Category */}
            <View style={styles.fieldContainer}>
              <Label color="textSecondary" style={styles.fieldLabel}>Category</Label>
              <View style={styles.categoryPicker}>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    formData.category === 'menu_item' && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: 'menu_item' })}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name="restaurant"
                    size={20}
                    color={formData.category === 'menu_item' ? Colors.primary : Colors.textMuted}
                  />
                  <Body style={[
                    styles.categoryLabel,
                    { color: formData.category === 'menu_item' ? Colors.primary : Colors.textSecondary }
                  ]}>
                    Menu Item
                  </Body>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    formData.category === 'raw_inventory' && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: 'raw_inventory' })}
                  activeOpacity={0.7}
                >
                  <IconSymbol
                    name="localGroceryStore"
                    size={20}
                    color={formData.category === 'raw_inventory' ? Colors.primary : Colors.textMuted}
                  />
                  <Body style={[
                    styles.categoryLabel,
                    { color: formData.category === 'raw_inventory' ? Colors.primary : Colors.textSecondary }
                  ]}>
                    Raw Inventory
                  </Body>
                </TouchableOpacity>
              </View>
            </View>

            {/* Price */}
            <NumberInput
              label="Price (PHP)"
              placeholder="0"
              value={formData.default_price}
              onChangeText={(text) => setFormData({ ...formData, default_price: text })}
              helperText="Leave blank or 0 for items without price"
            />

            {/* Delete button for editing */}
            {editingPreset && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  closeModal();
                  handleDelete(editingPreset);
                }}
                activeOpacity={0.7}
              >
                <Body style={styles.deleteButtonText}>Delete Item</Body>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    color: Colors.primaryForeground,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontWeight: '600',
  },
  countBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: {
    color: Colors.textMuted,
    fontWeight: '600',
    fontSize: 12,
  },
  sectionList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  presetCardFirst: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  presetCardLast: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  presetCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontWeight: '500',
    marginBottom: 2,
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
  modalHeaderButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  modalTitle: {
    fontWeight: '600',
  },
  saveText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  categoryLabel: {
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.lg,
  },
  deleteButtonText: {
    color: Colors.error,
    fontWeight: '600',
  },
});
