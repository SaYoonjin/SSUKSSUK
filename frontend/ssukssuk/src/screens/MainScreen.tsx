import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function MainScreen() {
    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/background1.png")}
                style={styles.bg}
                resizeMode="cover"
            />

            <View style={styles.content}>
                <Text style={styles.sub}>
                    홈 화면 🌱{"\n"}
                </Text>
            </View>
        </View>
    );
}

const GREEN = "#75A743";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    bg: {
        ...StyleSheet.absoluteFillObject,
        width: undefined,
        height: undefined,
    },
    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 12,
    },
    title: {
        fontSize: 36,
        color: GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        marginBottom: 10,
    },
    sub: {
        textAlign: "center",
        fontSize: 16,
        lineHeight: 22,
        color: "#2E5A35",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },
});
