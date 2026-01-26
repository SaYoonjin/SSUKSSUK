import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HistoryScreen from "../screens/HistoryScreen";
import HistoryAlbumScreen from "../screens/HistoryAlbumScreen";

export type HistoryStackParamList = {
    HistoryHome: undefined;
    HistoryAlbum: { start: string; end: string }; // 2주 기간 넘길 거면 이렇게
};

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="HistoryHome" component={HistoryScreen} />
            <Stack.Screen name="HistoryAlbum" component={HistoryAlbumScreen} />
        </Stack.Navigator>
    );
}
