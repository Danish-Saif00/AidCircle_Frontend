import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {HomeMapSosScreen} from '../features/home/HomeMapSosScreen';
import type {HomeStackParamList} from './navigation.types';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeMapSos"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="HomeMapSos" component={HomeMapSosScreen} />
    </Stack.Navigator>
  );
};