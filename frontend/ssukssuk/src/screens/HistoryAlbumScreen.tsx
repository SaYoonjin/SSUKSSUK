import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Pressable,
    Image,
} from "react-native";

const BG_COLOR = "#EDEDE9";
const BORDER = "#1A1A1A";
const CARD_BG = "#FFFEF6";
const SHADOW = "#4A4A4A";
const ACCENT = "rgba(243,253,224,0.9)";

const SAMPLE1 = require("../assets/tomato_pic_1.jpg");
const SAMPLE2 = require("../assets/tomato_pic_2.jpg");

function parseDotDate(s: string) {
    const [y, m, d] = s.split(".").map((v) => Number(v));
    return new Date(y, (m || 1) - 1, d || 1);
}

function formatDotDate(dt: Date) {
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    return `${y}.${m}.${d}`;
}

function makeDateRangeAsc(startStr: string, endStr: string) {
    const start = parseDotDate(startStr);
    const end = parseDotDate(endStr);

    const s = start <= end ? start : end;
    const e = start <= end ? end : start;

    const out: Date[] = [];
    const cur = new Date(s);
    cur.setHours(0, 0, 0, 0);

    while (cur <= e) {
        out.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
    return out;
}

const PixelTape = ({ style, width }: any) => (
    <View style={[styles.tapeContainer, { width: width || "65%" }, style]}>
        <View style={styles.tapeBody}>
            <View style={styles.endCapLeft} />
            <View style={styles.endCapRight} />

            <View style={[styles.zigzagCut, { left: -6 }]}>
                {[...Array(3)].map((_, i) => (
                    <View key={`l-${i}`} style={styles.cutPiece} />
                ))}
            </View>

            <View style={styles.tapeHighlight} />

            <View style={[styles.zigzagCut, { right: -6 }]}>
                {[...Array(3)].map((_, i) => (
                    <View key={`r-${i}`} style={styles.cutPiece} />
                ))}
            </View>
        </View>
    </View>
);

export default function HistoryAlbumScreen({ navigation, route }: any) {
    const { start, end } = route.params;

    const photoData = useMemo(() => {
        const datesAsc = makeDateRangeAsc(start, end);
        const datesDesc = [...datesAsc].reverse();

        return datesDesc.flatMap((dt, dayIdx) => {
            return [0, 1].map((shotIdx) => ({
                img: (dayIdx * 2 + shotIdx) % 2 === 0 ? SAMPLE1 : SAMPLE2,
                dateLabel: formatDotDate(dt),
                tapeStyle: {
                    rotate: `${(Math.random() * 14 - 9).toFixed(1)}deg`,
                    translateX: Math.random() * 20 - 10,
                    width: `${50 + Math.random() * 8}%`,
                },
            }));
        });
    }, [start, end]);


    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    hitSlop={10}
                    style={styles.backBtn}
                >
                    <Text style={styles.backChevron}>‹</Text>
                </Pressable>
                <Text style={styles.title}>생장 앨범</Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.periodBar}>
                    <Text style={styles.periodText}>
                        {start} - {end}
                    </Text>
                </View>

                <View style={styles.grid}>
                    {photoData.map((item, idx) => (
                        <View key={idx} style={styles.cardContainer}>
                            <PixelTape
                                width={item.tapeStyle.width}
                                style={{
                                    transform: [
                                        { rotate: item.tapeStyle.rotate },
                                        { translateX: item.tapeStyle.translateX },
                                    ],
                                    marginBottom: -12,
                                    zIndex: 10,
                                }}
                            />

                            <View style={styles.card}>
                                <View style={styles.photoFrame}>
                                    <Image
                                        source={item.img}
                                        style={styles.photo}
                                        resizeMode="cover"
                                    />
                                </View>

                                <View style={styles.captionWrapper}>
                                    <View style={styles.captionLine} />
                                    <View style={styles.captionLabel}>
                                        <Text style={styles.caption}>{item.dateLabel}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: BG_COLOR,
        paddingHorizontal: 20,
        paddingTop: 45,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 26,
    },
    backBtn: { paddingRight: 10 },
    backChevron: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: "rgba(36,46,19,0.9)",
    },
    title: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: "rgba(36,46,19,0.9)",
    },
    content: { paddingTop: 8 },

    periodBar: {
        backgroundColor: "#dedfde",
        borderWidth: 2,
        borderColor: BORDER,
        padding: 12,
        marginBottom: 35,
        borderTopColor: SHADOW,
        borderLeftColor: SHADOW,
        borderBottomColor: "#FFFFFF",
        borderRightColor: "#FFFFFF",
    },
    periodText: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 24,
        color: "rgba(36,46,19,0.9)",
        textAlign: "center",
    },

    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    cardContainer: {
        width: "48%",
        marginBottom: 28,
        alignItems: "center",
    },

    tapeContainer: {
        height: 18,
        overflow: "hidden",
    },
    tapeBody: {
        flex: 1,
        backgroundColor: ACCENT,
        borderTopWidth: 2,
        borderBottomWidth: 2,
        borderColor: BORDER,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    endCapLeft: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: BG_COLOR,
        zIndex: 20,
    },
    endCapRight: {
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: BG_COLOR,
        zIndex: 20,
    },

    zigzagCut: {
        position: "absolute",
        width: 12,
        height: "140%",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 5,
    },
    cutPiece: {
        width: 10,
        height: 10,
        backgroundColor: BG_COLOR,
        borderWidth: 2,
        borderColor: BORDER,
        transform: [{ rotate: "45deg" }],
    },
    tapeHighlight: {
        width: "80%",
        height: 2,
        backgroundColor: "#FFF",
        opacity: 0.3,
    },

    card: {
        width: "100%",
        backgroundColor: CARD_BG,
        borderWidth: 2.5,
        borderColor: BORDER,
        padding: 8,
        borderBottomWidth: 6,
        borderRightWidth: 4,
    },
    photoFrame: {
        borderWidth: 2,
        borderColor: BORDER,
        backgroundColor: "rgba(36,46,19,0.9)",
        marginBottom: 10,
    },
    photo: {
        width: "100%",
        height: 105,
    },
    captionWrapper: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 2,
    },
    captionLine: {
        width: "80%",
        height: 2,
        backgroundColor: BORDER,
        opacity: 0.1,
        position: "absolute",
        bottom: 4,
    },
    captionLabel: {
        paddingHorizontal: 10,
        backgroundColor: CARD_BG,
    },
    caption: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 16,
        color: "rgba(36,46,19,0.9)",
        letterSpacing: 0.5,
    },
});
