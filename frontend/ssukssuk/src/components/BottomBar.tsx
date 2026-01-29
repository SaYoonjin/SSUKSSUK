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
    },
    History: {
        on: require("../assets/history_select.png"),
        off: require("../assets/history_not_select.png"),
    },
    Plant: {
        on: require("../assets/plant_select.png"),
        off: require("../assets/plant_not_select.png"),
    },
    Profile: {
        on: require("../assets/profile_select.png"),
        off: require("../assets/profile_not_select.png"),
    },
} as const;

type RouteName = keyof typeof ASSETS;
const BOTTOM_BG = require("../assets/bottom.png");

export default function BottomBar({ state, navigation }: BottomTabBarProps) {
    return (
        <View style={styles.container}>
            <ImageBackground
                source={BOTTOM_BG}
                resizeMode="stretch"
                style={StyleSheet.absoluteFill}
            />

            <View style={styles.row}>
                {state.routes.map((route, index) => {
                    const name = route.name as RouteName;
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (isFocused) {
                            // ✅ 이미 포커스된 상태에서 다시 누를 경우
                            // History 탭이라면 스택의 메인인 HistoryHome으로 이동
                            if (name === "History") {
                                navigation.navigate("History", { screen: "HistoryHome" });
                            }
                            // 다른 탭들도 같은 방식으로 처리 가능합니다.
                        } else if (!event.defaultPrevented) {
                            // 포커스되지 않은 탭을 누를 경우 해당 탭으로 이동
                            navigation.navigate(route.name);
                        }
                    };

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={styles.item}
                        >
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
});