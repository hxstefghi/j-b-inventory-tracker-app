import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption } from '@/components/text';
import { Card, CardContent } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { formatCurrency, formatDate, formatTime } from '@/utils/format';
import { getSessionsByUser, getItemsBySession } from '@/lib/db';
import type { InventorySession } from '@/lib/db/schema';

export default function HomeScreen() {
  const { session } = useAuth();
  const [recentSessions, setRecentSessions] = useState<InventorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!session?.user) return;
    
    try {
      const sessions = await getSessionsByUser(session.user.id, 5);
      setRecentSessions(sessions);
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

  const getStatusLabel = (status: string) => {
    return status === 'open' ? 'Active' : 'Closed';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Title style={styles.greeting}>Welcome back</Title>
            <Caption color="textMuted">
              {formatDate(new Date())} • {session?.user?.email}
            </Caption>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <IconSymbol name="inventory" size={20} color={Colors.primary} />
              <Subtitle style={styles.statValue}>{recentSessions.length}</Subtitle>
              <Caption color="textMuted">Sessions</Caption>
            </CardContent>
          </Card>
          <Card variant="outlined" style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <IconSymbol name="check" size={20} color={Colors.success} />
              <Subtitle style={styles.statValue}>
                {recentSessions.filter(s => s.status === 'closed').length}
              </Subtitle>
              <Caption color="textMuted">Completed</Caption>
            </CardContent>
          </Card>
        </View>

        {/* Quick Action */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/session/new')}
          activeOpacity={0.8}
        >
          <View style={styles.actionContent}>
            <IconSymbol name="add" size={24} color={Colors.accentForeground} />
            <View style={styles.actionText}>
              <Subtitle style={styles.actionTitle}>New Session</Subtitle>
              <Caption color="accentForeground">Start tracking inventory</Caption>
            </View>
          </View>
          <IconSymbol name="chevronRight" size={20} color={Colors.accentForeground} />
        </TouchableOpacity>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Subtitle>Recent Activity</Subtitle>
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
              <Caption color="primary">See all</Caption>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Card variant="outlined">
              <CardContent>
                <Body color="textMuted">Loading...</Body>
              </CardContent>
            </Card>
          ) : recentSessions.length === 0 ? (
            <Card variant="outlined">
              <CardContent style={styles.emptyState}>
                <IconSymbol name="folder" size={32} color={Colors.textMuted} />
                <Body color="textMuted" style={styles.emptyText}>
                  No sessions yet
                </Body>
                <Caption color="textMuted">Start your first inventory session</Caption>
              </CardContent>
            </Card>
          ) : (
            recentSessions.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/session/${item.id}` as any)}
                activeOpacity={0.7}
              >
                <Card variant="outlined" style={styles.sessionCard}>
                  <CardContent style={styles.sessionContent}>
                    <View style={styles.sessionInfo}>
                      <View style={styles.sessionHeader}>
                        <Body style={styles.sessionDate}>
                          {formatDate(new Date(item.session_date))}
                        </Body>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status || 'open') + '20' }]}>
                          <Caption style={{ color: getStatusColor(item.status || 'open'), fontWeight: '600' }}>
                            {getStatusLabel(item.status || 'open')}
                          </Caption>
                        </View>
                      </View>
                      <Caption color="textMuted">
                        {item.shift} • {item.cashier_name}
                      </Caption>
                    </View>
                    <IconSymbol name="chevronRight" size={20} color={Colors.textMuted} />
                  </CardContent>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Tips Section */}
        <Card variant="outlined" style={styles.tipsCard}>
          <CardContent>
            <View style={styles.tipsHeader}>
              <IconSymbol name="inventory" size={18} color={Colors.primary} />
              <Caption color="textMuted">Quick Tips</Caption>
            </View>
            <Body style={styles.tipsText}>
              Tap on a session to view details. Swipe to edit or delete items.
            </Body>
          </CardContent>
        </Card>

        <View style={{ height: Spacing.xl }} />
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
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  actionButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionText: {
    gap: 2,
  },
  actionTitle: {
    color: Colors.accentForeground,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sessionCard: {
    marginBottom: Spacing.sm,
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 2,
  },
  sessionDate: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
  tipsCard: {
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '20',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tipsText: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
