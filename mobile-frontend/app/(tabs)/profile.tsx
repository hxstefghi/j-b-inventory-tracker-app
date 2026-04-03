/**
 * Profile Tab - User Profile & Settings
 * 
 * Display user information and app settings.
 * Allows sign out and basic profile management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { Title, Subtitle, Body, Caption } from '@/components/text';
import { Button } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { getProfile, getSessionsByUser } from '@/lib/db';
import type { Profile } from '@/lib/db/schema';

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);

  const loadData = useCallback(async () => {
    if (!session?.user) return;

    try {
      const [profileData, sessions] = await Promise.all([
        getProfile(session.user.id),
        getSessionsByUser(session.user.id, 1000), // Get all to count
      ]);
      setProfile(profileData);
      setSessionCount(sessions.length);
    } catch (error) {
      console.error('Error loading profile:', error);
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await signOut();
          },
        },
      ]
    );
  };

  // Extract first name from full name
  const firstName = profile?.full_name?.split(' ')[0] || 'User';
  const email = session?.user?.email || '';
  const role = profile?.role || 'cashier';
  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      })
    : '';

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
        {/* Header */}
        <View style={styles.header}>
          <Title style={styles.title}>Profile</Title>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <IconSymbol name="account" size={40} color={Colors.primary} />
            </View>
          </View>
          <Title style={styles.name}>{profile?.full_name || 'Loading...'}</Title>
          <Caption color="textMuted">{email}</Caption>
          <View style={styles.roleBadge}>
            <Caption style={styles.roleText}>
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </Caption>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Subtitle style={styles.statValue}>{sessionCount}</Subtitle>
            <Caption color="textMuted">Sessions</Caption>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Subtitle style={styles.statValue}>{memberSince || '-'}</Subtitle>
            <Caption color="textMuted">Member Since</Caption>
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Subtitle style={styles.sectionTitle}>Account</Subtitle>
          
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <IconSymbol name="account" size={20} color={Colors.primary} />
                </View>
                <Body>Edit Profile</Body>
              </View>
              <IconSymbol name="chevronRight" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.warningLight }]}>
                  <IconSymbol name="settings" size={20} color={Colors.warning} />
                </View>
                <Body>Settings</Body>
              </View>
              <IconSymbol name="chevronRight" size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: Colors.successLight }]}>
                  <IconSymbol name="help" size={20} color={Colors.success} />
                </View>
                <Body>Help & Support</Body>
              </View>
              <IconSymbol name="chevronRight" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <View style={styles.signOutSection}>
          <Button
            onPress={handleSignOut}
            variant="secondary"
            style={styles.signOutButton}
          >
            Sign Out
          </Button>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Caption color="textMuted">JB Inventory Tracker v1.0.0</Caption>
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
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  avatarContainer: {
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  roleBadge: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  menuSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 60,
  },
  signOutSection: {
    marginTop: Spacing.md,
  },
  signOutButton: {
    borderColor: Colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
});
