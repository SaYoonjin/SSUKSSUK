import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorScreenParams } from "@react-navigation/native";

import BottomBar from "../components/BottomBar";

import MainScreen from "../screens/MainScreen";
import HistoryScreen from "../screens/HistoryScreen";
import PlantScreen from "../screens/PlantScreen";
import ProfileStack, { ProfileStackParamList } from "./ProfileStack";

export type MainTabParamList = {
    Home: undefined;
    History: undefined;
    Plant: undefined;
    Profile: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarHideOnKeyboard: true,
            }}
            tabBar={(props) => <BottomBar {...props} />}
        >
            <Tab.Screen name="Home" component={MainScreen} />
            <Tab.Screen name="History" component={HistoryScreen} />
            <Tab.Screen name="Plant" component={PlantScreen} />

            <Tab.Screen
                name="Profile"
                component={ProfileStack}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.navigate("Profile", {
                            screen: "ProfileHome",
                        });
                    },
                })}
            />
        </Tab.Navigator>
    );
}
