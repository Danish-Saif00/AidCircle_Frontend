import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {AdminDashboardScreen} from '../features/admin/AdminDashboardScreen';
import {AdminReportDetailScreen} from '../features/admin/AdminReportDetailScreen';
import {AdminReportsQueueScreen} from '../features/admin/AdminReportsQueueScreen';
import {AdminUserDetailScreen} from '../features/admin/AdminUserDetailScreen';
import {AdminUsersListScreen} from '../features/admin/AdminUsersListScreen';
import type {AdminStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<AdminStackParamList>();

export const AdminStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminDashboard"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUsersList" component={AdminUsersListScreen} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
      <Stack.Screen
        name="AdminReportsQueue"
        component={AdminReportsQueueScreen}
      />
      <Stack.Screen
        name="AdminReportDetail"
        component={AdminReportDetailScreen}
      />
    </Stack.Navigator>
  );
};