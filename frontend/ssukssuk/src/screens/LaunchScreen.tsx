import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Launch">;

export default function LaunchScreen({ navigation }: Props) {
    const [showStart, setShowStart] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowStart(true);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {/* 중앙 고정 영역 */}
            <View style={styles.centerBox}>
                <Image
                    source={require("../assets/logo.png")}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>쑥쑥</Text>
            </View>

            {/* 하단 START 영역 */}
            {showStart && (
                <Pressable
                    onPress={() => navigation.replace("Login")}
                    style={styles.startBox}
                >
                    <Text style={styles.startText}>
                        <Text style={styles.arrow}>&gt;</Text> start!
                    </Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#EDEDE9",
    },

    centerBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    logo: {
        width: 160,
        height: 160,
        marginBottom: 16,
    },

    title: {
        fontSize: 40,
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: "#75A743",
    },

    startBox: {
        position: "absolute",
        bottom: 170,
        alignSelf: "center",
    },

    startText: {
        fontSize: 30,
        color: "#75A743",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },

    arrow: {
        marginRight: 6,
        color: "#75A743",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },
});
