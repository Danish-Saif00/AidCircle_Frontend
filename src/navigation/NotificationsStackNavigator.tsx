import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {NotificationDetailScreen} from '../features/notifications/NotificationDetailScreen';
import {NotificationsListScreen} from '../features/notifications/NotificationsListScreen';
import type {NotificationsStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="NotificationsList"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsListScreen}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={NotificationDetailScreen}
      />
    </Stack.Navigator>
  );
};