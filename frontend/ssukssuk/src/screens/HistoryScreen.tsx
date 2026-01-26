import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HistoryScreen() {
    return (
        <View style={styles.screen}>
            <Text style={styles.title}>히스토리 화면(임시)</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
    title: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 22, color: "#2E5A35", marginBottom: 8 },
    desc: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 14, color: "#75A743" },
});
