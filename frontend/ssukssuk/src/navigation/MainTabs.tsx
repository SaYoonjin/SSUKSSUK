import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigatorScreenParams } from "@react-navigation/native";

import BottomBar from "../components/BottomBar";

import MainScreen from "../screens/MainScreen";
import PlantStack, { PlantStackParamList } from "./PlantStack";
import ProfileStack, { ProfileStackParamList } from "./ProfileStack";
import HistoryStack, { HistoryStackParamList } from "./HistoryStack";

export type MainTabParamList = {
    Home: undefined;
    History: NavigatorScreenParams<HistoryStackParamList>;
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

            <Tab.Screen
                name="History"
                component={HistoryStack}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.navigate("History", { screen: "HistoryHome" });
                    },
                })}
            />

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
