import React from "react";
import {
    View,
    Text,
    Pressable,
    Image,
    StyleSheet,
    ImageBackground,
} from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const ASSETS = {
    Home: {
        on: require("../assets/home_select.png"),
        off: require("../assets/home_not_select.png"),
        // label: "홈",
    },
    History: {
        on: require("../assets/history_select.png"),
        off: require("../assets/history_not_select.png"),
        // label: "히스토리",
    },
    Plant: {
        on: require("../assets/plant_select.png"),
        off: require("../assets/plant_not_select.png"),
        // label: "식물",
    },
    Profile: {
        on: require("../assets/profile_select.png"),
        off: require("../assets/profile_not_select.png"),
        // label: "프로필",
    },
} as const;

type RouteName = keyof typeof ASSETS;
const BOTTOM_BG = require("../assets/bottom.png");

export default function BottomBar({ state, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            {/* 바텀 배경 */}
            <ImageBackground
                source={BOTTOM_BG}
                resizeMode="stretch"
                style={StyleSheet.absoluteFill}
            />

            {/* 아이콘 레이어 */}
            <View style={styles.row}>
                {state.routes.map((route, index) => {
                    const name = route.name as RouteName;
                    const isFocused = state.index === index;

                    const onPress = () => {
                        if (!isFocused) {
                            navigation.navigate(route.name as never);
                        }
                    };

                    return (
                        <Pressable key={route.key} onPress={onPress} style={styles.item}>
                            <Image
                                source={isFocused ? ASSETS[name].on : ASSETS[name].off}
                                style={styles.icon}
                            />
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 65,
        borderTopWidth: 3,
        borderTopColor: "#0B0B0B",
    },

    row: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        paddingBottom: 10,
    },

    item: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    icon: {
        width: 50,
        height: 50,
        marginTop: 10
    },

    // label: {
    //     fontFamily: "NeoDunggeunmoPro-Regular",
    //     fontSize: 0,
    //     color: "#0B0B0B",
    //     opacity: 0.7,
    // },
    // labelOn: {
    //     opacity: 1,
    // },
});
