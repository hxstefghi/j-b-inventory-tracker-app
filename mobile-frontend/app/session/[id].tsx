/**
 * Session Detail Screen - Inventory Tracking Table
 * 
 * Two-step flow:
 * Step 1: POS Data Entry - Enter menu items sold from POS
 * Step 2: Raw Inventory - Review/edit inventory with auto-calculated Sold Out
 * 
 * For old-style sessions (no raw inventory items), skip to inventory UI.
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
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
  upsertPosSalesBatch,
} from '@/lib/db';
import { generateSessionPDF, CalculatedSoldOutMap } from '@/utils/pdf';
import type { InventorySession, InventoryItem, PresetItem, PosSale } from '@/lib/db/schema';
import { 
  RAW_INVENTORY_ITEMS, 
  calculateRawInventoryFromSales,
  MENU_ITEMS,
  MENU_CATEGORIES,
  getMenuItemsByCategory,
  getMenuItem,
  MenuCategory,
} from '@/constants/menu';

/**
 * Calculate total revenue from combo meals containing chicken
 * Used for chicken items that don't have individual pricing
 */
function calculateChickenRevenueFromPOS(sales: PosSale[]): number {
  let total = 0;
  
  for (const sale of sales) {
    const menuItem = getMenuItem(sale.menu_item_id);
    if (!menuItem) continue;
    
    // Count all menu items that include chicken in their recipe
    // This includes: 1pc/2pc with rice, ala carte, assorted, combos
    if (menuItem.recipe.chicken && menuItem.recipe.chicken > 0) {
      total += menuItem.price * sale.quantity_sold;
    }
  }
  
  return total;
}

function calculateCoke15LRevenueFromPOS(sales: PosSale[]): number {
  let total = 0;
  
  for (const sale of sales) {
    const menuItem = getMenuItem(sale.menu_item_id);
    if (!menuItem) continue;
    
    // Count all menu items that include Coke 1.5L in their recipe
    if (menuItem.recipe.coke_1_5l && menuItem.recipe.coke_1_5l > 0) {
      total += menuItem.price * sale.quantity_sold;
    }
  }
  
  return total;
}
type SessionStep = 'pos' | 'inventory';

export default function SessionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session: authSession } = useAuth();
  const navigation = useNavigation();
  
  const [sessionData, setSessionData] = useState<InventorySession | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [posSales, setPosSales] = useState<PosSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  
  // Step navigation
  const [currentStep, setCurrentStep] = useState<SessionStep>('pos');
  
  // POS data (integrated from pos/[id].tsx)
  const [salesEntries, setSalesEntries] = useState<Map<string, number>>(new Map());
  const [savingPos, setSavingPos] = useState(false);
  const [hasUnsavedPosChanges, setHasUnsavedPosChanges] = useState(false);

  // Check if this is a new-style session with raw inventory items
  // Need to check AFTER data is loaded
  const isNewStyleSession = dataLoaded && items.length > 0 && 
    RAW_INVENTORY_ITEMS.some(raw => items.some(item => item.item_name === raw.name));

  // Calculate raw inventory from POS sales (only if loaded)
  const calculatedSoldOut = dataLoaded ? calculateRawInventoryFromSales(
    posSales.map(sale => ({
      menuItemId: sale.menu_item_id,
      quantity: sale.quantity_sold,
    }))
  ) : {};

  // For step 1 - calculate from current salesEntries
  const calculatedSoldOutFromEntries = dataLoaded ? calculateRawInventoryFromSales(
    Array.from(salesEntries.entries()).map(([menuItemId, quantity]) => ({
      menuItemId,
      quantity,
    }))
  ) : {};

  // Determine initial step based on session type (after data loads)
  useEffect(() => {
    if (dataLoaded && !isNewStyleSession) {
      setCurrentStep('inventory');
    }
  }, [dataLoaded, isNewStyleSession]);

  // Derived value - used in beforeRemove listener
  const isSessionOpen = sessionData?.status === 'open';

  // Warn on unsaved changes when navigating away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (hasUnsavedPosChanges && isSessionOpen) {
        e.preventDefault();
        handleUnsavedChangesWarning(() => {
          navigation.dispatch(e.data.action);
        });
      }
    });
    return unsubscribe;
  }, [hasUnsavedPosChanges, isSessionOpen, navigation]);

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
      
      setSessionData(session);
      setItems(sessionItems || []);
      setPresets(userPresets || []);
      setPosSales(sessionPosSales || []);
      
      // Load existing POS sales into state
      const entriesMap = new Map<string, number>();
      for (const sale of sessionPosSales) {
        entriesMap.set(sale.menu_item_id, sale.quantity_sold);
      }
      setSalesEntries(entriesMap);
      
      setDataLoaded(true);
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
      const rawItem = RAW_INVENTORY_ITEMS.find(raw => raw.name === item.item_name);
      if (rawItem) {
        return calculatedSoldOut[rawItem.id] || 0;
      }
    }
    const soldOutVal = item.sold_out || '';
    const isNumeric = /^[0-9]+\.?[0-9]*$/.test(soldOutVal);
    return isNumeric ? parseFloat(soldOutVal) : 0;
  };

  // Calculate grand total - for chicken items, use POS revenue instead of price * soldOut
  const grandTotal = items.reduce((sum, item) => {
    const soldOut = getSoldOutValue(item);
    const price = parseFloat(item.price?.toString() || '0');
    
    // For chicken items in new-style sessions, skip - revenue calculated from POS separately
    const isChickenItem = item.item_name === 'Chicken';
    
    if (isChickenItem && isNewStyleSession) {
      return sum; // Don't add soldOut * 0
    }
    
    return sum + (soldOut * price);
  }, 0);

  // Add chicken revenue from POS combo meals for new-style sessions
  const chickenRevenue = isNewStyleSession ? calculateChickenRevenueFromPOS(posSales) : 0;
  const finalGrandTotal = grandTotal + chickenRevenue;

  // Handle field update
  const handleUpdateField = async (
    itemId: string,
    field: string,
    value: string
  ) => {
    if (field === 'total') return;
    
    try {
      const dbValue = value === '' ? null : value;
      await updateItem(itemId, { [field]: dbValue });
      
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

      for (const item of newItems) {
        await createItem(item);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPickerVisible(false);
      setSelectedPresets(new Set());
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
      'Are you sure you want to close this session?',
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
      
      // Calculate chicken revenue from POS for new-style sessions
      const chickenRevenue = isNewStyleSession ? calculateChickenRevenueFromPOS(posSales) : undefined;
      
      // Calculate Coke 1.5L revenue from POS for new-style sessions
      const coke15LRevenue = isNewStyleSession ? calculateCoke15LRevenueFromPOS(posSales) : undefined;
      
      await generateSessionPDF(sessionData, items, finalGrandTotal, pdfCalculatedSoldOut, totalMenuSales, chickenRevenue, coke15LRevenue);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', `Failed to export PDF: ${error.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  // ========== POS STEP HANDLERS ==========
  
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
    setHasUnsavedPosChanges(true);
  };

  const adjustQuantity = (menuItemId: string, delta: number) => {
    const current = salesEntries.get(menuItemId) || 0;
    const newValue = Math.max(0, current + delta);
    updateQuantity(menuItemId, newValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSavePOSAndProceed = async () => {
    if (!id) return;

    setSavingPos(true);
    try {
      const salesArray = Array.from(salesEntries.entries()).map(([menuItemId, qty]) => ({
        menuItemId,
        quantitySold: qty,
      }));

      // Include items with 0 quantity to clear them
      for (const menuItem of MENU_ITEMS) {
        if (!salesEntries.has(menuItem.id)) {
          salesArray.push({
            menuItemId: menuItem.id,
            quantitySold: 0,
          });
        }
      }

      await upsertPosSalesBatch(id, salesArray);
      
      // Reload to get fresh data
      await loadData();
      
      setHasUnsavedPosChanges(false);
      setCurrentStep('inventory');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error saving POS data:', error);
      Alert.alert('Error', 'Failed to save POS data. Please try again.');
    } finally {
      setSavingPos(false);
    }
  };

  const handleUnsavedChangesWarning = (onDiscard: () => void) => {
    Alert.alert(
      'Unsaved POS Data',
      'You have unsaved POS data. What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setHasUnsavedPosChanges(false);
            onDiscard();
          },
        },
        {
          text: 'Save & Leave',
          onPress: async () => {
            await handleSavePOSAndProceed();
            onDiscard();
          },
        },
      ]
    );
  };

  const goBackToPOS = () => {
    setCurrentStep('pos');
  };

  // Calculate totals for POS summary
  const totalMenuSales = Array.from(salesEntries.entries()).reduce((sum, [menuItemId, qty]) => {
    const menuItem = MENU_ITEMS.find(m => m.id === menuItemId);
    return sum + (menuItem ? menuItem.price * qty : 0);
  }, 0);

  const totalItemsSold = Array.from(salesEntries.values()).reduce((sum, qty) => sum + qty, 0);

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

      {/* Step Indicator (only for new-style sessions) */}
      {isNewStyleSession && (
        <View style={styles.stepIndicator}>
          <TouchableOpacity 
            style={[styles.stepItem, currentStep === 'pos' && styles.stepItemActive]}
            onPress={() => isSessionOpen && setCurrentStep('pos')}
            disabled={!isSessionOpen}
          >
            <View style={[
              styles.stepCircle,
              currentStep === 'pos' && styles.stepCircleActive,
              currentStep === 'inventory' && styles.stepCircleCompleted,
            ]}>
              {currentStep === 'inventory' ? (
                <IconSymbol name="check" size={12} color="white" />
              ) : (
                <Caption style={currentStep === 'pos' ? styles.stepCircleTextActive : styles.stepCircleText}>
                  1
                </Caption>
              )}
            </View>
            <Caption style={[
              styles.stepLabel,
              currentStep === 'pos' && styles.stepLabelActive,
            ]}>POS Data</Caption>
          </TouchableOpacity>
          
          <View style={styles.stepLine}>
            <View style={[
              styles.stepLineInner,
              currentStep === 'inventory' && styles.stepLineCompleted,
            ]} />
          </View>
          
          <TouchableOpacity 
            style={[styles.stepItem, currentStep === 'inventory' && styles.stepItemActive]}
            onPress={() => isSessionOpen && setCurrentStep('inventory')}
            disabled={!isSessionOpen}
          >
            <View style={[
              styles.stepCircle,
              currentStep === 'inventory' && styles.stepCircleActive,
            ]}>
              <Caption style={currentStep === 'inventory' ? styles.stepCircleTextActive : styles.stepCircleText}>
                2
              </Caption>
            </View>
            <Caption style={[
              styles.stepLabel,
              currentStep === 'inventory' && styles.stepLabelActive,
            ]}>Inventory</Caption>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* STEP 1: POS DATA ENTRY */}
          {currentStep === 'pos' && isNewStyleSession && (
            <POSDataStep
              salesEntries={salesEntries}
              totalItemsSold={totalItemsSold}
              totalMenuSales={totalMenuSales}
              calculatedInventory={calculatedSoldOutFromEntries}
              onUpdateQuantity={updateQuantity}
              onAdjustQuantity={adjustQuantity}
              isEditable={isSessionOpen}
            />
          )}

          {/* STEP 2: INVENTORY (or old-style sessions) */}
          {(currentStep === 'inventory' || !isNewStyleSession) && (
            <InventoryStep
              items={items}
              presets={presets}
              isNewStyleSession={isNewStyleSession}
              isSessionOpen={isSessionOpen}
              getSoldOutValue={getSoldOutValue}
              grandTotal={finalGrandTotal}
              posTotal={totalMenuSales}
              posSales={posSales}
              onUpdateField={handleUpdateField}
              onDeleteItem={handleDeleteItem}
              onAddItem={() => setPickerVisible(true)}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      {isNewStyleSession && items.length > 0 && (
        <View style={[styles.bottomSection, { paddingBottom: Math.max(insets.bottom, Spacing.md) }]}>
          {currentStep === 'pos' ? (
            <TouchableOpacity
              style={[styles.nextButton, savingPos && styles.nextButtonDisabled]}
              onPress={handleSavePOSAndProceed}
              disabled={savingPos}
              activeOpacity={0.8}
            >
              <IconSymbol name="arrowForward" size={20} color="white" />
              <Body style={styles.nextButtonText}>
                {savingPos ? 'Saving...' : 'Next: Review Inventory'}
              </Body>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.backButtonPos}
                onPress={goBackToPOS}
                activeOpacity={0.7}
              >
                <IconSymbol name="arrowBack" size={18} color={Colors.primary} />
                <Body color="primary">Back to POS</Body>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExportPDF}
                disabled={exporting}
                activeOpacity={0.7}
              >
                <IconSymbol 
                  name="pdfExport" 
                  size={18} 
                  color={exporting ? Colors.textMuted : Colors.primary} 
                />
                <Body style={styles.exportButtonLabel}>
                  {exporting ? 'Exporting...' : 'Export'}
                </Body>
              </TouchableOpacity>

              {isSessionOpen && (
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={handleCloseSession}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="lockClosed" size={18} color="white" />
                  <Body style={styles.completeButtonLabel}>Complete</Body>
                </TouchableOpacity>
              )}
            </View>
          )}
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
                      onToggle={() => {
                        const next = new Set(selectedPresets);
                        if (next.has(preset.id)) {
                          next.delete(preset.id);
                        } else {
                          next.add(preset.id);
                        }
                        setSelectedPresets(next);
                      }}
                    />
                  ))}
                </View>
              )}

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
                      onToggle={() => {
                        const next = new Set(selectedPresets);
                        if (next.has(preset.id)) {
                          next.delete(preset.id);
                        } else {
                          next.add(preset.id);
                        }
                        setSelectedPresets(next);
                      }}
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

// ========== POS DATA STEP COMPONENT ==========

interface POSDataStepProps {
  salesEntries: Map<string, number>;
  totalItemsSold: number;
  totalMenuSales: number;
  calculatedInventory: Record<string, number>;
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onAdjustQuantity: (menuItemId: string, delta: number) => void;
  isEditable: boolean;
}

function POSDataStep({
  salesEntries,
  totalItemsSold,
  totalMenuSales,
  calculatedInventory,
  onUpdateQuantity,
  onAdjustQuantity,
  isEditable,
}: POSDataStepProps) {
  return (
    <View style={styles.posStepContainer}>
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

      {/* Menu Items by Category */}
      {MENU_CATEGORIES.map(category => {
        const categoryItems = getMenuItemsByCategory(category.id);
        const categoryTotal = categoryItems.reduce((sum, item) => {
          return sum + (salesEntries.get(item.id) || 0);
        }, 0);

        if (categoryItems.length === 0) return null;

        return (
          <View key={category.id} style={styles.categorySection}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIcon}>
                <IconSymbol name={category.icon as any} size={16} color={Colors.primary} />
              </View>
              <Subtitle style={styles.categoryTitle}>{category.label}</Subtitle>
              {categoryTotal > 0 && (
                <View style={styles.categoryBadge}>
                  <Caption style={styles.categoryBadgeText}>{categoryTotal}</Caption>
                </View>
              )}
            </View>
            
            <View style={styles.categoryList}>
              {categoryItems.map((menuItem, index) => {
                const quantity = salesEntries.get(menuItem.id) || 0;
                const isLast = index === categoryItems.length - 1;

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
                        onPress={() => onAdjustQuantity(menuItem.id, -1)}
                        disabled={quantity === 0 || !isEditable}
                        activeOpacity={0.7}
                      >
                        <IconSymbol 
                          name="remove" 
                          size={18} 
                          color={quantity === 0 || !isEditable ? Colors.textMuted : Colors.textPrimary} 
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
                          onUpdateQuantity(menuItem.id, num);
                        }}
                        keyboardType="number-pad"
                        placeholder="0"
                        placeholderTextColor={Colors.textMuted}
                        selectTextOnFocus
                        editable={isEditable}
                      />
                      
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => onAdjustQuantity(menuItem.id, 1)}
                        disabled={!isEditable}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="add" size={18} color={isEditable ? Colors.primary : Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}

      {/* Calculated Inventory Preview */}
      {totalItemsSold > 0 && (
        <View style={styles.previewSection}>
          <View style={styles.previewHeader}>
            <IconSymbol name="calculator" size={16} color={Colors.primary} />
            <Caption style={styles.previewTitle}>Calculated Raw Inventory</Caption>
          </View>
          <View style={styles.previewGrid}>
            {RAW_INVENTORY_ITEMS.map(item => {
              const qty = calculatedInventory[item.id] || 0;
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

      <View style={{ height: 100 }} />
    </View>
  );
}

// ========== INVENTORY STEP COMPONENT ==========

interface InventoryStepProps {
  items: InventoryItem[];
  presets: PresetItem[];
  isNewStyleSession: boolean;
  isSessionOpen: boolean;
  getSoldOutValue: (item: InventoryItem) => number;
  grandTotal: number;
  posTotal: number;
  posSales: PosSale[];
  onUpdateField: (itemId: string, field: string, value: string) => void;
  onDeleteItem: (item: InventoryItem) => void;
  onAddItem: () => void;
}

function InventoryStep({
  items,
  presets,
  isNewStyleSession,
  isSessionOpen,
  getSoldOutValue,
  grandTotal,
  posTotal,
  posSales,
  onUpdateField,
  onDeleteItem,
  onAddItem,
}: InventoryStepProps) {
  const rawInventoryPresets = presets.filter(p => p.category === 'raw_inventory');

  return (
    <View style={styles.inventoryStepContainer}>
      {/* Add Bar for new-style sessions */}
      {isSessionOpen && isNewStyleSession && (
        <View style={styles.stickyAddBar}>
          <TouchableOpacity
            style={styles.stickyAddButton}
            onPress={onAddItem}
            activeOpacity={0.7}
          >
            <IconSymbol name="add" size={18} color={Colors.primary} />
            <Body color="primary" style={{ fontWeight: '600', fontSize: FontSizes.sm }}>Add Item</Body>
          </TouchableOpacity>
        </View>
      )}

      {items.length === 0 ? (
        <Card variant="outlined" style={styles.emptyCard}>
          <CardContent style={styles.emptyContent}>
            <IconSymbol name="inventory" size={40} color={Colors.textMuted} />
            <Subtitle color="textMuted" style={styles.emptyTitle}>No items yet</Subtitle>
            <Body color="textMuted" style={styles.emptyText}>
              {isNewStyleSession 
                ? 'Raw inventory items are auto-created for new sessions.'
                : 'Tap "Add Item" to start tracking inventory'}
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
              posSales={posSales}
              onUpdate={onUpdateField}
              onDelete={() => onDeleteItem(item)}
            />
          ))}
        </View>
      )}

      {/* Grand Total - Show POS Total (Revenue) */}
      {items.length > 0 && (
        <View style={styles.posTotalCard}>
          <View style={styles.posTotalRow}>
            <View style={styles.posTotalItem}>
              <Caption color="textMuted">POS Sales (Revenue)</Caption>
              <Title style={styles.posTotalValue}>{formatCurrency(posTotal)}</Title>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ========== ITEM CARD COMPONENT ==========

interface ItemCardProps {
  item: InventoryItem;
  index: number;
  isEditable: boolean;
  isNewStyleSession: boolean;
  calculatedSoldOut: number;
  posSales: PosSale[];
  onUpdate: (itemId: string, field: string, value: string) => void;
  onDelete: () => void;
}

function ItemCard({ item, index, isEditable, isNewStyleSession, calculatedSoldOut, posSales, onUpdate, onDelete }: ItemCardProps) {
  const soldOut = isNewStyleSession ? calculatedSoldOut : (() => {
    const soldOutVal = item.sold_out || '';
    const isNumeric = /^[0-9]+\.?[0-9]*$/.test(soldOutVal);
    return isNumeric ? parseFloat(soldOutVal) : 0;
  })();
  
  const isChickenItem = item.item_name === 'Chicken';
  const price = parseFloat(item.price?.toString() || '0');
  
  // For chicken items in new-style sessions, calculate revenue from POS combo sales
  let total: number;
  if (isChickenItem && isNewStyleSession) {
    total = calculateChickenRevenueFromPOS(posSales);
  } else {
    total = soldOut * price;
  }

  return (
    <TouchableOpacity
      onLongPress={isEditable ? onDelete : undefined}
      activeOpacity={1}
      delayLongPress={500}
    >
      <View style={styles.itemCard}>
        <View style={styles.itemCardHeader}>
          <View style={{ flex: 1 }}>
            <Body style={styles.itemCardName}>{item.item_name}</Body>
          </View>
          <View style={styles.priceBadge}>
            <Caption color="textMuted" style={styles.priceLabel}>PRICE</Caption>
            <Caption style={styles.priceValue}>
              {isChickenItem ? '-' : formatCurrency(price)}
            </Caption>
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

        <View style={styles.inputGrid}>
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

// ========== INLINE TEXT INPUT ==========

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
  
  const normalizedValue = value ?? '';
  
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(normalizedValue);
    }
  }, [normalizedValue, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
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

// ========== PRESET PICKER ITEM ==========

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

// ========== STYLES ==========

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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepItemActive: {},
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: Colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: Colors.success,
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  stepCircleTextActive: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginHorizontal: Spacing.sm,
    marginBottom: 16,
  },
  stepLineInner: {
    height: 2,
    backgroundColor: Colors.borderLight,
  },
  stepLineCompleted: {
    backgroundColor: Colors.success,
  },
  content: {
    padding: Spacing.md,
    paddingBottom: 180,
  },
  
  // POS Step Styles
  posStepContainer: {
    gap: Spacing.md,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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
  categorySection: {
    marginBottom: Spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTitle: {
    flex: 1,
    fontWeight: '600',
    fontSize: FontSizes.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  categoryList: {
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
  previewSection: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
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

  // Inventory Step Styles
  inventoryStepContainer: {
    gap: Spacing.md,
  },
  stickyAddBar: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.small,
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
  itemsList: {
    gap: Spacing.md,
  },
  itemCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.small,
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
  inputField: {
    flex: 1,
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
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
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

  // Bottom Section
  bottomSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    ...Shadows.medium,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: FontSizes.base,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  backButtonPos: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  exportButton: {
    flex: 1,
    minWidth: '45%',
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
    flex: 1,
    minWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  completeButtonLabel: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: 'white',
  },
  grandTotalCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
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
  posTotalCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  posTotalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  posTotalItem: {
    alignItems: 'center',
  },
  posTotalValue: {
    fontSize: 28,
    fontWeight: '700',
    color: 'white',
    marginTop: 4,
  },

  // Modal Styles
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
