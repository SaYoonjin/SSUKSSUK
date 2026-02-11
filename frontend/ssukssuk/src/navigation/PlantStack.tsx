import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import PlantScreen from "../screens/PlantScreen";
import PlantAddEditScreen from "../screens/PlantAddEditScreen";

export type PlantStackParamList = {
    PlantHome: undefined;
    PlantAddEdit: undefined;
};

const Stack = createNativeStackNavigator<PlantStackParamList>();

export default function PlantStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="PlantHome" component={PlantScreen} />
            <Stack.Screen name="PlantAddEdit" component={PlantAddEditScreen} />
        </Stack.Navigator>
    );
}
