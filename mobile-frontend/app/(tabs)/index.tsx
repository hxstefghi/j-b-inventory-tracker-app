import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption } from '@/components/text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { formatDate } from '@/utils/format';
import { getSessionsByUser, getProfile } from '@/lib/db';
import type { InventorySession, Profile } from '@/lib/db/schema';

export default function HomeScreen() {
  const { session, signOut } = useAuth();
  const [recentSessions, setRecentSessions] = useState<InventorySession[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!session?.user) return;
    
    try {
      const [sessions, profileData] = await Promise.all([
        getSessionsByUser(session.user.id, 5),
        getProfile(session.user.id),
      ]);
      setRecentSessions(sessions);
      setProfile(profileData);
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

  const openCount = recentSessions.filter(s => s.status === 'open').length;
  const closedCount = recentSessions.filter(s => s.status === 'closed').length;

  // Extract first name from full name
  const firstName = profile?.full_name?.split(' ')[0] || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={Colors.primary} 
          />
        }
      >
        {/* Header with Profile */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Title style={styles.greeting}>
              {firstName ? `Hi, ${firstName}` : 'JB Inventory'}
            </Title>
            <Caption color="textMuted">{formatDate(new Date())}</Caption>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
            activeOpacity={0.7}
          >
            <IconSymbol name="account" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCardPrimary]}>
            <View style={styles.statIcon}>
              <IconSymbol name="inventory" size={20} color={Colors.primary} />
            </View>
            <Body style={styles.statLabel}>Sessions</Body>
            <Title style={styles.statValue}>{recentSessions.length}</Title>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.successLight }]}>
              <IconSymbol name="check" size={20} color={Colors.success} />
            </View>
            <Body style={styles.statLabel}>Open</Body>
            <Subtitle style={styles.statValueSmall}>{openCount}</Subtitle>
          </View>
          
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: Colors.borderLight }]}>
              <IconSymbol name="checkAll" size={20} color={Colors.textMuted} />
            </View>
            <Body style={styles.statLabel}>Closed</Body>
            <Subtitle style={styles.statValueSmall}>{closedCount}</Subtitle>
          </View>
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Subtitle style={styles.sectionTitle}>Recent Activity</Subtitle>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Body color="primary" style={styles.viewAll}>View All</Body>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyContainer}>
              <Body color="textMuted">Loading...</Body>
            </View>
          ) : recentSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <IconSymbol name="folder" size={40} color={Colors.textMuted} />
              </View>
              <Subtitle color="textMuted" style={styles.emptyTitle}>No sessions yet</Subtitle>
              <Body color="textMuted" style={styles.emptySubtitle}>
                Tap the + button to start tracking
              </Body>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {recentSessions.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/session/${item.id}` as any)}
                  activeOpacity={0.7}
                  style={[
                    styles.sessionCard,
                    index === recentSessions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.sessionLeft}>
                    <View style={[
                      styles.sessionIndicator,
                      { backgroundColor: item.status === 'open' ? Colors.success : Colors.textMuted }
                    ]} />
                    <View>
                      <Body style={styles.sessionDate}>
                        {formatDate(new Date(item.session_date))}
                      </Body>
                      <Caption color="textMuted">
                        {item.shift} Shift • {item.cashier_name}
                      </Caption>
                    </View>
                  </View>
                  <View style={styles.sessionRight}>
                    <View style={[
                      styles.statusPill,
                      { backgroundColor: item.status === 'open' ? Colors.successLight : Colors.borderLight }
                    ]}>
                      <Caption style={{ 
                        color: item.status === 'open' ? Colors.success : Colors.textMuted,
                        fontWeight: '600',
                        fontSize: 11,
                      }}>
                        {item.status === 'open' ? 'Active' : 'Closed'}
                      </Caption>
                    </View>
                    <IconSymbol name="chevronRight" size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.small,
  },
  statCardPrimary: {
    flex: 1.5,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statValueSmall: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  viewAll: {
    fontWeight: '500',
  },
  sessionsList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
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
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  emptyContainer: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
