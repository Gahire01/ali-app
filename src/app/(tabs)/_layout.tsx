import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dumbbell, Home, LayoutDashboard, MessagesSquare, User } from 'lucide-react-native';

import { colors, fontSize, letterSpacing } from '@/constants/theme';
import { isStaff } from '@/lib/data';
import { useAuthStore } from '@/stores/auth-store';

function TabIcon({ focused, active, inactive }: { focused: boolean; active: React.ReactNode; inactive: React.ReactNode }) {
  return <View style={styles.iconWrap}>{focused ? active : inactive}</View>;
}

export default function TabsLayout() {
  const profile = useAuthStore((state) => state.profile);
  const staff = Boolean(profile && isStaff(profile.role));

  const tint = (focused: boolean) => (focused ? colors.secondary : colors.subtle);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.caption - 2,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: letterSpacing.heading * 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={<Home size={22} color={colors.secondary} />}
              inactive={<Home size={22} color={tint(false)} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          title: 'Training',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={<Dumbbell size={22} color={colors.secondary} />}
              inactive={<Dumbbell size={22} color={tint(false)} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={<MessagesSquare size={22} color={colors.secondary} />}
              inactive={<MessagesSquare size={22} color={tint(false)} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={<User size={22} color={colors.secondary} />}
              inactive={<User size={22} color={tint(false)} />}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: staff ? undefined : null,
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              active={<LayoutDashboard size={22} color={colors.secondary} />}
              inactive={<LayoutDashboard size={22} color={tint(false)} />}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
});