import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {ProfileScreen} from '../features/profile/ProfileScreen';
import {EditProfileScreen} from '../features/profile/EditProfileScreen';
import {MyReportsScreen} from '../features/reports/MyReportsScreen';
import type {ProfileStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyReports" component={MyReportsScreen} />
    </Stack.Navigator>
  );
};