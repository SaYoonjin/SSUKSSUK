import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorScreenParams } from "@react-navigation/native";

import BottomBar from "../components/BottomBar";

import MainScreen from "../screens/MainScreen";
import HistoryScreen from "../screens/HistoryScreen";
import PlantStack, { PlantStackParamList } from "./PlantStack";
import ProfileStack, { ProfileStackParamList } from "./ProfileStack";

export type MainTabParamList = {
    Home: undefined;
    History: undefined;
    Plant: NavigatorScreenParams<PlantStackParamList>;
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

            <Tab.Screen
                name="Plant"
                component={PlantStack}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.navigate("Plant", {
                            screen: "PlantHome",
                        });
                    },
                })}
            />

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
