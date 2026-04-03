import { Tabs, router } from 'expo-router';
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Shadows } from '@/constants/colors';

// Tab configuration - 4 tabs with center button
const TAB_CONFIG = [
  { name: 'index', icon: 'home', label: 'Home' },
  { name: 'explore', icon: 'history', label: 'History' },
  { name: 'items', icon: 'category', label: 'Items' },
  { name: 'profile', icon: 'account', label: 'Profile' },
];

// Custom Tab Bar with floating center button
function CustomTabBar({ state, descriptors, navigation }: any) {
  // Filter only our main tabs
  const mainRoutes = state.routes.filter((r: any) => 
    TAB_CONFIG.some(t => t.name === r.name)
  );

  // Split tabs: first 2 on left, last 2 on right
  const leftTabs = mainRoutes.filter((r: any) => 
    r.name === 'index' || r.name === 'explore'
  );
  const rightTabs = mainRoutes.filter((r: any) => 
    r.name === 'items' || r.name === 'profile'
  );

  const renderTab = (route: any) => {
    const isFocused = state.routes[state.index]?.name === route.name;
    const config = TAB_CONFIG.find(t => t.name === route.name);

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        onPress={onPress}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        <IconSymbol
          name={config?.icon as any}
          size={24}
          color={isFocused ? Colors.primary : Colors.textMuted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {/* Left tabs (Home, History) */}
        {leftTabs.map(renderTab)}

        {/* Center floating button */}
        <TouchableOpacity
          style={styles.centerButtonContainer}
          onPress={() => router.push('/session/new')}
          activeOpacity={0.8}
        >
          <View style={styles.centerButton}>
            <IconSymbol name="add" size={28} color={Colors.primaryForeground} />
          </View>
        </TouchableOpacity>

        {/* Right tabs (Items, Profile) */}
        {rightTabs.map(renderTab)}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'History',
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 28 : 20,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.large,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
  centerButtonContainer: {
    marginTop: -36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
});
