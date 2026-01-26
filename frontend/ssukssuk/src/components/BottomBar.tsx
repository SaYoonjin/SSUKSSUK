import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const ASSETS = {
    Home: {
        on: require("../assets/home_select.png"),
        off: require("../assets/home_not_select.png"),
        label: "홈",
    },
    History: {
        on: require("../assets/history_select.png"),
        off: require("../assets/history_not_select.png"),
        label: "히스토리",
    },
    Plant: {
        on: require("../assets/plant_select.png"),
        off: require("../assets/plant_not_select.png"),
        label: "식물",
    },
    Profile: {
        on: require("../assets/profile_select.png"),
        off: require("../assets/profile_not_select.png"),
        label: "프로필",
    },
} as const;

type RouteName = keyof typeof ASSETS;

export default function BottomBar({ state, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.wrap}>
            {state.routes.map((route, index) => {
                const name = route.name as RouteName;
                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: "tabPress",
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name as never);
                    }
                };

                const iconSource = isFocused ? ASSETS[name].on : ASSETS[name].off;

                return (
                    <Pressable
                        key={route.key}
                        onPress={onPress}
                        style={styles.item}
                        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                        <Image source={iconSource} style={styles.icon} resizeMode="contain" />
                        <Text style={[styles.label, isFocused && styles.labelOn]}>
                            {ASSETS[name].label}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        height: 76,
        backgroundColor: "#9BA57A",
        borderTopWidth: 3,
        borderTopColor: "#0B0B0B",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: 8,
    },

    item: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },

    icon: {
        width: 26,
        height: 26,
    },

    label: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 14,
        color: "#0B0B0B",
        opacity: 0.75,
        letterSpacing: 0.2,
    },
    labelOn: {
        opacity: 1,
    },
});
