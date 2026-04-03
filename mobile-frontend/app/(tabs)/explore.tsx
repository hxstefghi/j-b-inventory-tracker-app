import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Title, Body, Caption, Subtitle } from '@/components/text';
import { Card, CardContent } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { formatCurrency, formatDate, getCurrentShift } from '@/utils/format';
import { getSessionsByUser, getItemsBySession } from '@/lib/db';
import type { InventorySession } from '@/lib/db/schema';

interface SessionSection {
  title: string;
  data: InventorySession[];
}

export default function HistoryScreen() {
  const { session } = useAuth();
  const [sections, setSections] = useState<SessionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!session?.user) return;
    
    try {
      const allSessions = await getSessionsByUser(session.user.id, 50);
      
      // Group by date
      const grouped = allSessions.reduce((acc, item) => {
        const dateKey = formatDate(new Date(item.session_date));
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
      }, {} as Record<string, InventorySession[]>);

      // Convert to sections
      const sectionData: SessionSection[] = Object.entries(grouped).map(([title, data]) => ({
        title,
        data,
      }));

      setSections(sectionData);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    return status === 'open' ? Colors.success : Colors.textMuted;
  };

  const renderSectionHeader = ({ section }: { section: SessionSection }) => (
    <View style={styles.sectionHeader}>
      <Caption color="textMuted" style={styles.sectionTitle}>
        {section.title}
      </Caption>
    </View>
  );

  const renderItem = ({ item }: { item: InventorySession }) => (
    <TouchableOpacity
      onPress={() => router.push(`/session/${item.id}` as any)}
      activeOpacity={0.7}
    >
      <Card variant="outlined" style={styles.sessionCard}>
        <CardContent style={styles.sessionContent}>
          <View style={styles.sessionLeft}>
            <View style={styles.sessionHeader}>
              <Subtitle style={styles.shiftLabel}>{item.shift}</Subtitle>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status || 'open') }]} />
            </View>
            <Caption color="textMuted">{item.cashier_name}</Caption>
          </View>
          <View style={styles.sessionRight}>
            <Caption color="textMuted">{item.table_number || ''}</Caption>
            <IconSymbol name="chevronRight" size={18} color={Colors.textMuted} />
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <IconSymbol name="folder" size={48} color={Colors.textMuted} />
      <Body color="textMuted" style={styles.emptyTitle}>No sessions yet</Body>
      <Caption color="textMuted" style={styles.emptyText}>
        Start tracking inventory from the Home screen
      </Caption>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Title>History</Title>
        <Caption color="textMuted">All inventory sessions</Caption>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterTab} activeOpacity={0.7}>
          <Caption style={{ color: Colors.textPrimary }}>All</Caption>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabInactive]} activeOpacity={0.7}>
          <Caption color="textMuted">Open</Caption>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterTab, styles.filterTabInactive]} activeOpacity={0.7}>
          <Caption color="textMuted">Closed</Caption>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
  },
  filterTabInactive: {
    backgroundColor: Colors.surface,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sessionCard: {
    marginBottom: Spacing.sm,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLeft: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  shiftLabel: {
    fontWeight: '600',
    fontSize: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    marginTop: Spacing.md,
  },
  emptyText: {
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
