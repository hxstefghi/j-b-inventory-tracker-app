import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Title, Body, Caption, Subtitle } from '@/components/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatDate } from '@/utils/format';
import { getSessionsByUser } from '@/lib/db';
import type { InventorySession } from '@/lib/db/schema';

interface SessionSection {
  title: string;
  data: InventorySession[];
}

type FilterType = 'all' | 'open' | 'closed';

export default function HistoryScreen() {
  const { session } = useAuth();
  const [allSessions, setAllSessions] = useState<InventorySession[]>([]);
  const [sections, setSections] = useState<SessionSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const loadData = async () => {
    if (!session?.user) return;
    
    try {
      const sessions = await getSessionsByUser(session.user.id, 100);
      setAllSessions(sessions);
      groupSessions(sessions, activeFilter);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const groupSessions = (sessions: InventorySession[], filter: FilterType) => {
    // Apply filter
    let filtered = sessions;
    if (filter === 'open') {
      filtered = sessions.filter(s => s.status === 'open');
    } else if (filter === 'closed') {
      filtered = sessions.filter(s => s.status === 'closed');
    }

    // Group by date
    const grouped = filtered.reduce((acc, item) => {
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
  };

  useEffect(() => {
    loadData();
  }, [session]);

  useEffect(() => {
    groupSessions(allSessions, activeFilter);
  }, [activeFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const renderSectionHeader = ({ section }: { section: SessionSection }) => (
    <View style={styles.sectionHeader}>
      <Caption style={styles.sectionTitle}>{section.title}</Caption>
    </View>
  );

  const renderItem = ({ item, index, section }: { item: InventorySession; index: number; section: SessionSection }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    return (
      <TouchableOpacity
        onPress={() => router.push(`/session/${item.id}` as any)}
        activeOpacity={0.7}
        style={[
          styles.sessionCard,
          isFirst && styles.sessionCardFirst,
          isLast && styles.sessionCardLast,
          !isLast && styles.sessionCardBorder,
        ]}
      >
        <View style={styles.sessionLeft}>
          <View style={[
            styles.shiftBadge,
            { backgroundColor: item.shift === 'AM' ? Colors.primary + '15' : Colors.secondary + '10' }
          ]}>
            <Caption style={[
              styles.shiftText,
              { color: item.shift === 'AM' ? Colors.primary : Colors.secondary }
            ]}>
              {item.shift}
            </Caption>
          </View>
        </View>
        
        <View style={styles.sessionCenter}>
          <Body style={styles.cashierName}>{item.cashier_name}</Body>
          <Caption color="textMuted">
            {item.status === 'open' ? 'In Progress' : 'Completed'}
          </Caption>
        </View>

        <View style={styles.sessionRight}>
          <View style={[
            styles.statusIndicator,
            { backgroundColor: item.status === 'open' ? Colors.success : Colors.textLight }
          ]} />
          <IconSymbol name="chevronRight" size={18} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <IconSymbol name="history" size={40} color={Colors.textMuted} />
      </View>
      <Subtitle color="textMuted" style={styles.emptyTitle}>No sessions found</Subtitle>
      <Body color="textMuted" style={styles.emptyText}>
        {activeFilter !== 'all' 
          ? `No ${activeFilter} sessions to show`
          : 'Start tracking inventory with the + button'
        }
      </Body>
    </View>
  );

  const FilterButton = ({ filter, label }: { filter: FilterType; label: string }) => {
    const isActive = activeFilter === filter;
    return (
      <TouchableOpacity
        style={[styles.filterTab, isActive && styles.filterTabActive]}
        onPress={() => handleFilterChange(filter)}
        activeOpacity={0.7}
      >
        <Body style={[
          styles.filterText,
          isActive && styles.filterTextActive
        ]}>
          {label}
        </Body>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>History</Title>
        <Caption color="textMuted">All inventory sessions</Caption>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          <FilterButton filter="all" label="All" />
          <FilterButton filter="open" label="Open" />
          <FilterButton filter="closed" label="Closed" />
        </View>
      </View>

      {/* Sessions List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading ? renderEmpty : null}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
          />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  filterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    ...Shadows.small,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontWeight: '500',
    fontSize: 14,
  },
  filterTextActive: {
    color: Colors.primaryForeground,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  sectionHeader: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Colors.textMuted,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  sessionCardFirst: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  sessionCardLast: {
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    ...Shadows.small,
  },
  sessionCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  sessionLeft: {
    marginRight: Spacing.md,
  },
  shiftBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftText: {
    fontWeight: '700',
    fontSize: 13,
  },
  sessionCenter: {
    flex: 1,
  },
  cashierName: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
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
    maxWidth: 240,
  },
});
