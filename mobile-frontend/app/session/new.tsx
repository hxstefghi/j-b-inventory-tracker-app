/**
 * New Session Screen
 * 
 * Create a new inventory tracking session with:
 * - Date picker (defaults to today)
 * - AM/PM shift toggle
 * - Cashier name input
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption, Label } from '@/components/text';
import { Button, Input, Card, CardContent } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatDateLong, getCurrentShift } from '@/utils/format';
import { createSession, getOpenSession, getProfile, createItem } from '@/lib/db';
import { RAW_INVENTORY_ITEMS } from '@/constants/menu';

type Shift = 'AM' | 'PM';

export default function NewSessionScreen() {
  const { session: authSession } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shift, setShift] = useState<Shift>(getCurrentShift());
  const [cashierName, setCashierName] = useState('');
  const [loading, setLoading] = useState(false);

  // Load user's profile to get their name
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!authSession?.user) return;
      
      try {
        const profile = await getProfile(authSession.user.id);
        if (profile?.full_name) {
          const firstName = profile.full_name.split(' ')[0];
          setCashierName(firstName);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    
    loadUserProfile();
  }, [authSession?.user]);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreateSession = async () => {
    if (!authSession?.user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    if (!cashierName.trim()) {
      Alert.alert('Error', 'Please enter cashier name');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Check if session already exists for this date/shift
      const existingSession = await getOpenSession(authSession.user.id, date, shift);
      if (existingSession) {
        Alert.alert(
          'Session Exists',
          `An open session already exists for ${formatDateLong(date)} ${shift}. Would you like to continue it?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Session',
              onPress: () => router.replace(`/session/${existingSession.id}` as any),
            },
          ]
        );
        setLoading(false);
        return;
      }

      // Create new session
      const newSession = await createSession({
        user_id: authSession.user.id,
        session_date: date.toISOString(),
        shift,
        cashier_name: cashierName.trim(),
        status: 'open',
      });

      // Auto-create raw inventory items for the new session
      for (const rawItem of RAW_INVENTORY_ITEMS) {
        await createItem({
          session_id: newSession.id,
          item_name: rawItem.name,
          unit: rawItem.unit,
          price: rawItem.unitPrice.toString(),
          beg_balance: null,
          delivery: null,
          pull_out: null,
          sold_out: null,
          ending: null,
          remarks: null,
          sort_order: rawItem.sortOrder,
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace(`/session/${newSession.id}` as any);
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert('Error', 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevronLeft" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Title style={styles.headerTitle}>New Session</Title>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Picker */}
        <View style={styles.fieldContainer}>
          <Label color="textSecondary" style={styles.fieldLabel}>Date</Label>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateIconContainer}>
              <IconSymbol name="calendar" size={18} color={Colors.primary} />
            </View>
            <Body style={styles.dateText}>{formatDateLong(date)}</Body>
            <IconSymbol name="chevronDown" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {showDatePicker && (
          <View style={styles.datePickerContainer}>
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
            {Platform.OS === 'ios' && (
              <Button
                variant="ghost"
                size="small"
                onPress={() => setShowDatePicker(false)}
                style={styles.datePickerDone}
              >
                Done
              </Button>
            )}
          </View>
        )}

        {/* Shift Toggle */}
        <View style={styles.fieldContainer}>
          <Label color="textSecondary" style={styles.fieldLabel}>Shift</Label>
          <View style={styles.shiftPicker}>
            <TouchableOpacity
              style={[
                styles.shiftOption,
                shift === 'AM' && styles.shiftOptionSelected,
              ]}
              onPress={() => setShift('AM')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.shiftIconContainer,
                { backgroundColor: shift === 'AM' ? Colors.primary + '15' : Colors.borderLight }
              ]}>
                <IconSymbol
                  name="accessTime"
                  size={18}
                  color={shift === 'AM' ? Colors.primary : Colors.textMuted}
                />
              </View>
              <View>
                <Body style={[
                  styles.shiftLabel,
                  { color: shift === 'AM' ? Colors.primary : Colors.textSecondary }
                ]}>
                  AM
                </Body>
                <Caption color="textMuted">Morning</Caption>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shiftOption,
                shift === 'PM' && styles.shiftOptionSelected,
              ]}
              onPress={() => setShift('PM')}
              activeOpacity={0.7}
            >
              <View style={[
                styles.shiftIconContainer,
                { backgroundColor: shift === 'PM' ? Colors.primary + '15' : Colors.borderLight }
              ]}>
                <IconSymbol
                  name="accessTime"
                  size={18}
                  color={shift === 'PM' ? Colors.primary : Colors.textMuted}
                />
              </View>
              <View>
                <Body style={[
                  styles.shiftLabel,
                  { color: shift === 'PM' ? Colors.primary : Colors.textSecondary }
                ]}>
                  PM
                </Body>
                <Caption color="textMuted">Afternoon</Caption>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cashier Name */}
        <Input
          label="Cashier Name"
          placeholder="e.g., Ate Beth"
          value={cashierName}
          onChangeText={setCashierName}
          autoCapitalize="words"
          required
        />

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Caption color="textMuted" style={styles.previewLabel}>SESSION PREVIEW</Caption>
          <View style={styles.previewRow}>
            <Body color="textMuted">Date</Body>
            <Body style={styles.previewValue}>{formatDateLong(date)}</Body>
          </View>
          <View style={styles.previewRow}>
            <Body color="textMuted">Shift</Body>
            <Body style={styles.previewValue}>{shift}</Body>
          </View>
          <View style={styles.previewRow}>
            <Body color="textMuted">Cashier</Body>
            <Body style={styles.previewValue}>{cashierName || '-'}</Body>
          </View>
        </View>

        {/* Create Button */}
        <Button
          fullWidth
          loading={loading}
          disabled={!cashierName.trim()}
          onPress={handleCreateSession}
          style={styles.createButton}
        >
          Start Session
        </Button>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    flex: 1,
    fontWeight: '500',
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  datePickerDone: {
    alignSelf: 'flex-end',
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  shiftPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  shiftOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  shiftOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  shiftIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftLabel: {
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    ...Shadows.small,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  previewValue: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  createButton: {
    marginTop: Spacing.sm,
  },
});
