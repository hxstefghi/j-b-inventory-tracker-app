/**
 * New Session Screen
 * 
 * Create a new inventory tracking session with:
 * - Date picker (defaults to today)
 * - AM/PM shift toggle
 * - Cashier name input
 */

import React, { useState } from 'react';
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
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatDateLong, getCurrentShift } from '@/utils/format';
import { createSession, getOpenSession } from '@/lib/db';

type Shift = 'AM' | 'PM';

export default function NewSessionScreen() {
  const { session } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [shift, setShift] = useState<Shift>(getCurrentShift());
  const [cashierName, setCashierName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreateSession = async () => {
    if (!session?.user) {
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
      const existingSession = await getOpenSession(session.user.id, date, shift);
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
        user_id: session.user.id,
        session_date: date.toISOString(),
        shift,
        cashier_name: cashierName.trim(),
        status: 'open',
      });

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
        <Title>New Session</Title>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Date Picker */}
        <View style={styles.fieldContainer}>
          <Label color="textSecondary" style={styles.fieldLabel}>Date</Label>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <IconSymbol name="calendar" size={20} color={Colors.primary} />
            <Body style={styles.dateText}>{formatDateLong(date)}</Body>
            <IconSymbol name="chevronDown" size={20} color={Colors.textMuted} />
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
            >
              <IconSymbol
                name="accessTime"
                size={20}
                color={shift === 'AM' ? Colors.primary : Colors.textMuted}
              />
              <View>
                <Body
                  color={shift === 'AM' ? 'primary' : 'textSecondary'}
                  style={styles.shiftLabel}
                >
                  AM
                </Body>
                <Caption color="textMuted">Morning shift</Caption>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.shiftOption,
                shift === 'PM' && styles.shiftOptionSelected,
              ]}
              onPress={() => setShift('PM')}
            >
              <IconSymbol
                name="accessTime"
                size={20}
                color={shift === 'PM' ? Colors.primary : Colors.textMuted}
              />
              <View>
                <Body
                  color={shift === 'PM' ? 'primary' : 'textSecondary'}
                  style={styles.shiftLabel}
                >
                  PM
                </Body>
                <Caption color="textMuted">Afternoon shift</Caption>
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
        <Card variant="outlined" style={styles.previewCard}>
          <CardContent>
            <Caption color="textMuted" style={styles.previewLabel}>SESSION PREVIEW</Caption>
            <View style={styles.previewRow}>
              <Body color="textSecondary">Date:</Body>
              <Body style={styles.previewValue}>{formatDateLong(date)}</Body>
            </View>
            <View style={styles.previewRow}>
              <Body color="textSecondary">Shift:</Body>
              <Body style={styles.previewValue}>{shift}</Body>
            </View>
            <View style={styles.previewRow}>
              <Body color="textSecondary">Cashier:</Body>
              <Body style={styles.previewValue}>{cashierName || '-'}</Body>
            </View>
          </CardContent>
        </Card>

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
  placeholder: {
    width: 40,
  },
  content: {
    padding: Spacing.md,
  },
  fieldContainer: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateText: {
    flex: 1,
  },
  datePickerContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.default,
    marginBottom: Spacing.md,
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
    borderRadius: BorderRadius.default,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  shiftOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  shiftLabel: {
    fontWeight: '600',
  },
  previewCard: {
    backgroundColor: Colors.tableHeader,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  previewLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  previewValue: {
    fontWeight: '500',
  },
  createButton: {
    marginTop: Spacing.sm,
  },
});
