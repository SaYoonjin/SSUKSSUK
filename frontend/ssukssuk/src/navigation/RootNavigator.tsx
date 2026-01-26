import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LaunchScreen from "../screens/LaunchScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

import MainTabs from "./MainTabs";

import DeviceAddScreen from "../screens/DeviceaddScreen.tsx";
import DeviceManagementScreen from "../screens/DevicemanagementScreen.tsx";
import PlantListScreen from "../screens/PlantLIstScreen.tsx";
import PlantAddEditScreen from "../screens/PlantAddEditScreen.tsx";

export type RootStackParamList = {
    Launch: undefined;
    Login: undefined;
    Main: undefined;
    Signup: undefined;

    DeviceManagement: undefined;
    DeviceAdd: undefined;
    PlantList: undefined;
    PlantAddEdit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Launch" component={LaunchScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />

                <Stack.Screen name="Main" component={MainTabs} />

                <Stack.Screen name="Signup" component={SignupScreen} />
                <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
                <Stack.Screen name="DeviceAdd" component={DeviceAddScreen} />
                <Stack.Screen name="PlantList" component={PlantListScreen} />
                <Stack.Screen name="PlantAddEdit" component={PlantAddEditScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
