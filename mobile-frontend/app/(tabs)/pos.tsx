/**
 * POS Tab - Duplicate POS Sales Entry
 * 
 * List sessions and navigate to POS entry screen to duplicate
 * menu item sales from the original POS system.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption } from '@/components/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatDate, formatDateLong } from '@/utils/format';
import { getSessionsByUser, getPosSalesBySession } from '@/lib/db';
import type { InventorySession } from '@/lib/db/schema';
import { MENU_ITEMS } from '@/constants/menu';

export default function POSScreen() {
  const { session } = useAuth();
  const [sessions, setSessions] = useState<InventorySession[]>([]);
  const [posEntryStatus, setPosEntryStatus] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      const sessionsData = await getSessionsByUser(session.user.id, 20);
      setSessions(sessionsData);
      
      // Check POS entry status for each session
      const statusMap: Record<string, number> = {};
      for (const s of sessionsData) {
        const posSales = await getPosSalesBySession(s.id);
        const totalItems = posSales.reduce((sum, sale) => sum + sale.quantity_sold, 0);
        statusMap[s.id] = totalItems;
      }
      setPosEntryStatus(statusMap);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openSessions = sessions.filter(s => s.status === 'open');
  const closedSessions = sessions.filter(s => s.status === 'closed');

  const renderSessionCard = (item: InventorySession, isLast: boolean) => {
    const posItemCount = posEntryStatus[item.id] || 0;
    const hasPosData = posItemCount > 0;

    return (
      <TouchableOpacity
        key={item.id}
        onPress={() => router.push(`/pos/${item.id}` as any)}
        activeOpacity={0.7}
        style={[
          styles.sessionCard,
          !isLast && styles.sessionCardBorder,
        ]}
      >
        <View style={styles.sessionLeft}>
          <View style={[
            styles.sessionIndicator,
            { backgroundColor: item.status === 'open' ? Colors.success : Colors.textMuted }
          ]} />
          <View style={styles.sessionInfo}>
            <Body style={styles.sessionDate}>
              {formatDate(new Date(item.session_date))}
            </Body>
            <Caption color="textMuted">
              {item.shift} Shift • {item.cashier_name}
            </Caption>
          </View>
        </View>
        <View style={styles.sessionRight}>
          {hasPosData ? (
            <View style={styles.posEnteredBadge}>
              <IconSymbol name="check" size={12} color={Colors.success} />
              <Caption style={styles.posEnteredText}>{posItemCount} items</Caption>
            </View>
          ) : (
            <View style={styles.posEmptyBadge}>
              <Caption style={styles.posEmptyText}>No POS data</Caption>
            </View>
          )}
          <IconSymbol name="chevronRight" size={16} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, items: InventorySession[], icon: string, iconColor: string) => {
    if (items.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionIcon, { backgroundColor: iconColor + '15' }]}>
            <IconSymbol name={icon as any} size={16} color={iconColor} />
          </View>
          <Subtitle style={styles.sectionTitle}>{title}</Subtitle>
          <View style={styles.countBadge}>
            <Caption style={styles.countText}>{items.length}</Caption>
          </View>
        </View>
        <View style={styles.sectionList}>
          {items.map((item, index) => renderSessionCard(item, index === items.length - 1))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Title style={styles.headerTitle}>POS Entry</Title>
          <Caption color="textMuted">Duplicate sales from your POS</Caption>
        </View>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <IconSymbol name="info" size={18} color={Colors.primary} />
        <Body style={styles.infoText}>
          Select a session to enter the menu items sold from your POS system. 
          The app will automatically calculate raw inventory usage.
        </Body>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <Body color="textMuted">Loading sessions...</Body>
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.centerContent}>
          <View style={styles.emptyIcon}>
            <IconSymbol name="receipt" size={40} color={Colors.textMuted} />
          </View>
          <Subtitle color="textMuted" style={styles.emptyTitle}>No sessions yet</Subtitle>
          <Body color="textMuted" style={styles.emptyText}>
            Create an inventory session first,{'\n'}then enter POS data here.
          </Body>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/session/new')}
            activeOpacity={0.7}
          >
            <Body style={styles.emptyButtonText}>Create Session</Body>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {renderSection('Open Sessions', openSessions, 'inventory', Colors.success)}
          {renderSection('Closed Sessions', closedSessions, 'checkAll', Colors.textMuted)}
          <View style={{ height: 120 }} />
        </ScrollView>
      )}
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
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
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
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  sessionCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sessionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  posEnteredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  posEnteredText: {
    color: Colors.success,
    fontWeight: '600',
    fontSize: 11,
  },
  posEmptyBadge: {
    backgroundColor: Colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  posEmptyText: {
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: 11,
  },
});
