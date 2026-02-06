import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "../screens/ProfileScreen";
import NicknameChangeScreen from "../screens/NicknameChangeScreen";
import PasswordChangeScreen from "../screens/PasswordChangeScreen";
import SettingsScreen from "../screens/SettingsScreen";
import DeviceManagementScreen from "../screens/DevicemanagementScreen";
import DeviceAddScreen from "../screens/DeviceaddScreen";

export type ProfileStackParamList = {
    ProfileHome: undefined;
    NicknameChange: undefined;
    PasswordChange: undefined;
    Settings: undefined;
    DeviceManagement: undefined;
    DeviceAdd: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ProfileHome" component={ProfileScreen} />
            <Stack.Screen name="NicknameChange" component={NicknameChangeScreen} />
            <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
            <Stack.Screen name="DeviceAdd" component={DeviceAddScreen} />
        </Stack.Navigator>
    );
}
