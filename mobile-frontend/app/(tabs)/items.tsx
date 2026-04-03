/**
 * Items Tab - Preset Items Management
 * 
 * Manage saved items with preset prices. Mom picks from these
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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption, Label } from '@/components/text';
import { Card, CardContent, Button, Input, NumberInput } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
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

  const renderPresetItem = ({ item }: { item: PresetItem }) => (
    <TouchableOpacity
      onPress={() => openEditModal(item)}
      onLongPress={() => handleDelete(item)}
      activeOpacity={0.7}
    >
      <Card variant="outlined" style={styles.presetCard}>
        <CardContent style={styles.presetContent}>
          <View style={styles.presetInfo}>
            <Body style={styles.presetName}>{item.item_name}</Body>
            <Caption color="textMuted">
              {formatCurrency(parseFloat(item.default_price || '0'))}
            </Caption>
          </View>
          <IconSymbol name="chevronRight" size={20} color={Colors.textMuted} />
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderSection = (title: string, items: PresetItem[], icon: 'restaurant' | 'localGroceryStore') => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconSymbol name={icon} size={18} color={Colors.textSecondary} />
          <Subtitle style={styles.sectionTitle}>{title}</Subtitle>
          <Caption color="textMuted">{items.length}</Caption>
        </View>
        {items.map((item) => (
          <View key={item.id}>
            {renderPresetItem({ item })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Title>My Items</Title>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
          activeOpacity={0.7}
        >
          <IconSymbol name="add" size={24} color={Colors.accentForeground} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <Body color="textMuted">Loading...</Body>
        </View>
      ) : presets.length === 0 ? (
        <View style={styles.centerContent}>
          <IconSymbol name="category" size={48} color={Colors.textMuted} />
          <Subtitle color="textMuted" style={styles.emptyTitle}>No items yet</Subtitle>
          <Body color="textMuted" style={styles.emptyText}>
            Add your inventory items and menu items here.{'\n'}
            They'll be available to pick when tracking.
          </Body>
          <Button onPress={openAddModal} style={styles.emptyButton}>
            Add First Item
          </Button>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            <>
              {renderSection('Raw Inventory', rawInventoryItems, 'localGroceryStore')}
              {renderSection('Menu Items', menuItems, 'restaurant')}
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
            <TouchableOpacity onPress={closeModal}>
              <Body color="primary">Cancel</Body>
            </TouchableOpacity>
            <Subtitle>{editingPreset ? 'Edit Item' : 'Add Item'}</Subtitle>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Body color={saving ? 'textMuted' : 'primary'} style={{ fontWeight: '600' }}>
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
                >
                  <IconSymbol
                    name="restaurant"
                    size={20}
                    color={formData.category === 'menu_item' ? Colors.primary : Colors.textMuted}
                  />
                  <Body
                    color={formData.category === 'menu_item' ? 'primary' : 'textSecondary'}
                    style={styles.categoryLabel}
                  >
                    Menu Item
                  </Body>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    formData.category === 'raw_inventory' && styles.categoryOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, category: 'raw_inventory' })}
                >
                  <IconSymbol
                    name="localGroceryStore"
                    size={20}
                    color={formData.category === 'raw_inventory' ? Colors.primary : Colors.textMuted}
                  />
                  <Body
                    color={formData.category === 'raw_inventory' ? 'primary' : 'textSecondary'}
                    style={styles.categoryLabel}
                  >
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
              <Button
                variant="destructive"
                style={styles.deleteButton}
                onPress={() => {
                  closeModal();
                  handleDelete(editingPreset);
                }}
              >
                Delete Item
              </Button>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: Spacing.lg,
  },
  listContent: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  presetCard: {
    marginBottom: Spacing.sm,
  },
  presetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontWeight: '500',
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
  modalContent: {
    padding: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    marginBottom: 6,
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
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  categoryLabel: {
    fontWeight: '500',
  },
  deleteButton: {
    marginTop: Spacing.xl,
  },
});
