import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {
  Bell,
  History,
  Home,
  MapPinned,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import {USER_ROLES} from '../config/constants';
import {colors, fontSize, fontWeight, spacing} from '../shared/theme';
import {useAuthStore} from '../store';
import {ActivityStackNavigator} from './ActivityStackNavigator';
import {AdminStackNavigator} from './AdminStackNavigator';
import {HelperStackNavigator} from './HelperStackNavigator';
import {HomeStackNavigator} from './HomeStackNavigator';
import {NotificationsStackNavigator} from './NotificationsStackNavigator';
import {ProfileStackNavigator} from './ProfileStackNavigator';
import type {MainTabParamList} from './navigation.types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabsNavigator = () => {
  const profile = useAuthStore(state => state.profile);
  const isAdmin = profile?.role === USER_ROLES.ADMIN;

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.semibold,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.tabBarBorder,
          minHeight: 68,
          paddingBottom: spacing.sm,
          paddingTop: spacing.xs,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          title: 'SOS',
          tabBarIcon: ({color, size}) => <Home color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="NearbyTab"
        component={HelperStackNavigator}
        options={{
          title: 'Nearby',
          tabBarIcon: ({color, size}) => <MapPinned color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="ActivityTab"
        component={ActivityStackNavigator}
        options={{
          title: 'Activity',
          tabBarIcon: ({color, size}) => <History color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          title: 'Alerts',
          tabBarIcon: ({color, size}) => <Bell color={color} size={size} />,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({color, size}) => <User color={color} size={size} />,
        }}
      />

      {isAdmin ? (
        <Tab.Screen
          name="AdminTab"
          component={AdminStackNavigator}
          options={{
            title: 'Admin',
            tabBarIcon: ({color, size}) => (
              <ShieldCheck color={color} size={size} />
            ),
          }}
        />
      ) : null}
    </Tab.Navigator>
  );
};