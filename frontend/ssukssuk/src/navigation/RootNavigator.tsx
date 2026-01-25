import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LaunchScreen from "../screens/LaunchScreen";
import LoginScreen from "../screens/LoginScreen";
import MainScreen from "../screens/MainScreen";
import SignupScreen from "../screens/SignupScreen";
import DeviceAddScreen from '../screens/DeviceaddScreen.tsx';
import DeviceManagementScreen from '../screens/DevicemanagementScreen.tsx';

export type RootStackParamList = {
    Launch: undefined;
    Login: undefined;
    Main: undefined;
    Signup: undefined;
    DeviceManagement: undefined;
    DeviceAdd: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Launch" component={LaunchScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen
            name="DeviceManagement"
            component={DeviceManagementScreen}
          />
          <Stack.Screen name="DeviceAdd" component={DeviceAddScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
}
