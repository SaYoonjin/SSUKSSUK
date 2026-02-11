import React from 'react'; // React 임포트 추가 (필요 시)
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/SplashScreen';
import LaunchScreen from '../screens/LaunchScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import InitialSetupScreen from '../screens/InitialSetupScreen';

import MainTabs from './MainTabs';

import DeviceAddScreen from '../screens/DeviceaddScreen.tsx';
import DeviceManagementScreen from '../screens/DevicemanagementScreen.tsx';
import PlantScreen from '../screens/PlantScreen.tsx';
import PlantAddEditScreen from '../screens/PlantAddEditScreen.tsx';

export type RootStackParamList = {
  Splash: undefined; // 스플래시 추가
  Launch: undefined;
  Login: undefined;
  Signup: undefined;
  InitialSetup: undefined;
  Main: undefined;
  DeviceManagement: undefined;
  DeviceAdd: undefined;
  Plant: undefined;
  PlantAddEdit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />

        <Stack.Screen name="Launch" component={LaunchScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="InitialSetup" component={InitialSetupScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="DeviceManagement"
          component={DeviceManagementScreen}
        />
        <Stack.Screen name="DeviceAdd" component={DeviceAddScreen} />
        <Stack.Screen name="Plant" component={PlantScreen} />
        <Stack.Screen name="PlantAddEdit" component={PlantAddEditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
