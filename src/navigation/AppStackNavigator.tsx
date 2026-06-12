import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {PermissionsSetupScreen} from '../features/onboarding/PermissionsSetupScreen';
import {ConfirmSosScreen} from '../features/sos/ConfirmSosScreen';
import {LiveSosStatusScreen} from '../features/sos/LiveSosStatusScreen';
import {SelectCategoryScreen} from '../features/sos/SelectCategoryScreen';
import {SosDetailsScreen} from '../features/sos/SosDetailsScreen';
import {CreateReportScreen} from '../features/reports/CreateReportScreen';
import {PublicUserProfileScreen} from '../features/profile/PublicUserProfileScreen';
import {MainTabsNavigator} from './MainTabsNavigator';
import type {AppStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="PermissionsSetup" component={PermissionsSetupScreen} />

      <Stack.Screen name="MainTabs" component={MainTabsNavigator} />

      <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} />

      <Stack.Screen name="SosDetails" component={SosDetailsScreen} />

      <Stack.Screen name="ConfirmSos" component={ConfirmSosScreen} />

      <Stack.Screen name="LiveSosStatus" component={LiveSosStatusScreen} />

      <Stack.Screen
        name="PublicUserProfile"
        component={PublicUserProfileScreen}
      />

      <Stack.Screen name="CreateReport" component={CreateReportScreen} />
    </Stack.Navigator>
  );
};