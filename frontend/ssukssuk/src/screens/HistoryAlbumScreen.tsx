import React, { useMemo } from "react";
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Image } from "react-native";

const BG_COLOR = "#D4E1C6";
const BORDER = "#1A1A1A";
const CARD_BG = "#FFFFFF";

const SAMPLE1 = require("../assets/tomato_pic_1.jpg");
const SAMPLE2 = require("../assets/tomato_pic_2.jpg");

export default function HistoryAlbumScreen({ navigation, route }: any) {
    const { start, end } = route.params;

    // 지금은 샘플로 14장(2주) 채우기: 실제론 API 데이터로 대체
    const photos = useMemo(
        () => Array.from({ length: 14 }, (_, i) => (i % 2 === 0 ? SAMPLE1 : SAMPLE2)),
        []
    );

    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={10} style={styles.backBtn}>
                    <Text style={styles.backChevron}>‹</Text>
                </Pressable>
                <Text style={styles.title}>생장 앨범</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.periodBar}>
                    <Text style={styles.periodText}>
                        {start} - {end}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {photos.map((img, idx) => (
                        <View key={idx} style={styles.card}>
                            <Image source={img} style={styles.photo} />
                            <Text style={styles.caption}>DAY {idx + 1}</Text>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    // ✅ SettingsScreen 기준으로 타이틀 위치/여백 맞춤
    root: {
        flex: 1,
        backgroundColor: BG_COLOR,
        paddingHorizontal: 26,
        paddingTop: 45,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        marginBottom: 26,
    },
    backBtn: {
        paddingRight: 10,
        paddingVertical: 4,
    },
    backChevron: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: BORDER,
        lineHeight: 34,
    },
    title: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: BORDER,
    },

    // ✅ 아래는 기존 레이아웃 유지 (content 패딩만 root가 담당)
    content: { paddingTop: 8 },

    periodBar: {
        backgroundColor: CARD_BG,
        borderWidth: 3,
        borderColor: BORDER,
        padding: 12,
        marginBottom: 14,
    },
    periodText: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 16, color: BORDER },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    card: {
        width: "48%",
        backgroundColor: CARD_BG,
        borderWidth: 3,
        borderColor: BORDER,
        padding: 8,
    },
    photo: { width: "100%", height: 130, borderWidth: 2, borderColor: BORDER },
    caption: { marginTop: 8, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
});
