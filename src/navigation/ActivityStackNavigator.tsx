import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {MyEmergencyHistoryScreen} from '../features/sos/MyEmergencyHistoryScreen';
import type {ActivityStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<ActivityStackParamList>();

export const ActivityStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MyEmergencyHistory"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="MyEmergencyHistory"
        component={MyEmergencyHistoryScreen}
      />
    </Stack.Navigator>
  );
};