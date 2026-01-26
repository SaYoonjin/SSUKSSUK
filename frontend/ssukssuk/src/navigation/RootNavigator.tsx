import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LaunchScreen from "../screens/LaunchScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import InitialSetupScreen from "../screens/InitialSetupScreen";

import MainTabs from "./MainTabs";

import DeviceAddScreen from "../screens/DeviceaddScreen.tsx";
import DeviceManagementScreen from "../screens/DevicemanagementScreen.tsx";
import PlantScreen from "../screens/PlantScreen.tsx";
import PlantAddEditScreen from "../screens/PlantAddEditScreen.tsx";

export type RootStackParamList = {
    Launch: undefined;
    Login: undefined;
    Signup: undefined;

    // 회원가입 직후 초기 디바이스+식물 등록
    InitialSetup: undefined;

    // 탭 메인
    Main: undefined;

    // 기존 스택
    DeviceManagement: undefined;
    DeviceAdd: undefined;
    Plant: undefined;
    PlantAddEdit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Launch" component={LaunchScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />

                {/* 회원가입 */}
                <Stack.Screen name="Signup" component={SignupScreen} />

                {/* ✅ 회원가입 성공 후 여기로 replace */}
                <Stack.Screen name="InitialSetup" component={InitialSetupScreen} />

                {/* 메인 탭 */}
                <Stack.Screen name="Main" component={MainTabs} />

                {/* 기존 스택들 */}
                <Stack.Screen name="DeviceManagement" component={DeviceManagementScreen} />
                <Stack.Screen name="DeviceAdd" component={DeviceAddScreen} />
                <Stack.Screen name="Plant" component={PlantScreen} />
                <Stack.Screen name="PlantAddEdit" component={PlantAddEditScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
