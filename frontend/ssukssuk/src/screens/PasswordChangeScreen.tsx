import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PasswordChangeScreen() {
    return (
        <View style={styles.root}>
            <Text style={styles.title}>비밀번호 변경하기</Text>
            <Text style={styles.desc}>아직 구현 전입니다.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
    title: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 26, color: "#000" },
    desc: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 16, color: "#777", marginTop: 10 },
});
