import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {AcceptedEmergencyActiveScreen} from '../features/helper/AcceptedEmergencyActiveScreen';
import {EmergencyDetailHelperScreen} from '../features/helper/EmergencyDetailHelperScreen';
import {MyActiveResponsesScreen} from '../features/helper/MyActiveResponsesScreen';
import {MyResponseHistoryScreen} from '../features/helper/MyResponseHistoryScreen';
import {NearbyEmergenciesListScreen} from '../features/helper/NearbyEmergenciesListScreen';
import {NearbyEmergenciesMapScreen} from '../features/helper/NearbyEmergenciesMapScreen';
import type {HelperStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<HelperStackParamList>();

export const HelperStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="NearbyEmergenciesMap"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen
        name="NearbyEmergenciesMap"
        component={NearbyEmergenciesMapScreen}
      />
      <Stack.Screen
        name="NearbyEmergenciesList"
        component={NearbyEmergenciesListScreen}
      />
      <Stack.Screen
        name="EmergencyDetailHelper"
        component={EmergencyDetailHelperScreen}
      />
      <Stack.Screen
        name="AcceptedEmergencyActive"
        component={AcceptedEmergencyActiveScreen}
      />
      <Stack.Screen
        name="MyActiveResponses"
        component={MyActiveResponsesScreen}
      />
      <Stack.Screen
        name="MyResponseHistory"
        component={MyResponseHistoryScreen}
      />
    </Stack.Navigator>
  );
};