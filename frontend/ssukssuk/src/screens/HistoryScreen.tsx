import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    Pressable,
    Dimensions,
    Animated,
    PixelRatio,
} from "react-native";
import Svg, { Line, Polyline, Rect, Text as SvgText, Circle, Path, G } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ✅ content padding(22*2) + pixelBox border(3*2) 만큼 정확히 빼서 "카드 내부 폭"에 맞춤
const CONTENT_PAD_H = 22;   // styles.content paddingHorizontal
const PIXELBOX_BORDER = 3;  // styles.pixelBox borderWidth
const PHOTO_WIDTH = PixelRatio.roundToNearestPixel(
    SCREEN_WIDTH - CONTENT_PAD_H * 2 - PIXELBOX_BORDER * 2
);

const BG_COLOR = "#D4E1C6";
const BORDER = "#1A1A1A";
const CARD_BG = "#FFFFFF";
const ACCENT = "#2E5A35";

const SAMPLE_PLANT_IMG = require("../assets/tomato_pic_1.jpg");
const SAMPLE_PLANT_IMG_2 = require("../assets/tomato_pic_2.jpg");

export default function HistoryScreen({ navigation }: any) {
    const periodLabel = "2026.01.17 - 2026.01.23";

    const [photoIndex, setPhotoIndex] = useState(0);
    const photos = [SAMPLE_PLANT_IMG, SAMPLE_PLANT_IMG_2];
    const scrollX = useRef(new Animated.Value(0)).current;

    const runSlide = (newIndex: number) => {
        setPhotoIndex(newIndex);
        Animated.spring(scrollX, {
            // translateX도 픽셀 라운딩 (끝 1px 틈 방지)
            toValue: PixelRatio.roundToNearestPixel(-newIndex * PHOTO_WIDTH),
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const goPrev = () => { if (photoIndex > 0) runSlide(photoIndex - 1); };
    const goNext = () => { if (photoIndex < photos.length - 1) runSlide(photoIndex + 1); };

    return (
        <SafeAreaView style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>식물 히스토리</Text>
                </View>

                <SectionHeader title="현재 모습" />
                <PixelBox hasShadow style={{ padding: 0 }}>
                    {/* 부모 Wrap에 배경색을 테두리색(BORDER)으로 설정하여 흰 틈 방지 */}
                    <View style={styles.photoWrap}>
                        <Animated.View style={[
                            styles.slideContainer,
                            { transform: [{ translateX: scrollX }] }
                        ]}>
                            {photos.map((img, i) => (
                                <View key={i} style={styles.photoContainer}>
                                    <Image source={img} style={styles.photo} resizeMode="cover" />
                                </View>
                            ))}
                        </Animated.View>

                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>LIVE FEED</Text>
                        </View>

                        {photoIndex > 0 && (
                            <Pressable onPress={goPrev} style={[styles.photoNavBtn, { left: 10 }]}>
                                <Text style={styles.photoNavText}>◀</Text>
                            </Pressable>
                        )}
                        {photoIndex < photos.length - 1 && (
                            <Pressable onPress={goNext} style={[styles.photoNavBtn, { right: 10 }]}>
                                <Text style={styles.photoNavText}>▶</Text>
                            </Pressable>
                        )}

                        <View style={styles.photoIndicatorRow}>
                            {photos.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.photoDot,
                                        i === photoIndex ? { backgroundColor: '#FFD700' } : { backgroundColor: '#FFF' }
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </PixelBox>

                <SectionHeader title="기록 보관소" />
                <Pressable
                    onPress={() => {
                        navigation.navigate("HistoryAlbum", {
                            start: "2026.01.10",
                            end: "2026.01.23",
                        });
                    }}
                >
                    <PixelBox hasShadow style={styles.archiveBar}>
                        <View style={styles.folderIcon}><View style={styles.folderTab} /><View style={styles.folderBody} /></View>
                        <View style={styles.archiveTextWrap}>
                            <Text style={styles.archiveTitle}>생장 앨범 열기</Text>
                            <Text style={styles.archiveSub}>TOTAL 24 RECORDS FOUND</Text>
                        </View>
                        <Text style={styles.arrow}>≫</Text>
                    </PixelBox>
                </Pressable>

                <SectionHeader title="생장 그래프" />
                <PixelBox hasShadow style={styles.chartBox}>
                    <View style={styles.chartHeader}><Text style={styles.periodText}>{periodLabel}</Text><LegendItem label="Height(cm)" color={ACCENT} /></View>
                    <GrowthLineChart days={dummyDays} values={dummyGrowth} width={SCREEN_WIDTH - 80} height={160} />
                </PixelBox>

                <SectionHeader title="이상치 알람 그래프" />
                <PixelBox hasShadow style={styles.chartBox}>
                    <View style={styles.monitorHeader}><View style={[styles.monitorLed, { backgroundColor: ACCENT }]} /><Text style={styles.monitorTitle}>ANOMALY MONITOR</Text></View>
                    <AnomalyMonitorChart days={dummyDays} data={dummyAnomaly} width={SCREEN_WIDTH - 80} height={180} />
                    <View style={styles.monitorFooter}>
                        <LegendItem label="수위" color="#6495ED" /><LegendItem label="농도" color="#9ACD32" /><LegendItem label="온습도" color="#FF6347" />
                    </View>
                </PixelBox>
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// --- 보조 컴포넌트 ---
function SectionHeader({ title }: { title: string }) {
    return (
        <View style={styles.sectionHeader}>
            <View style={styles.headerSquare} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}
function PixelBox({ children, style, hasShadow }: any) {
    return (
        <View style={styles.pixelContainer}>
            {hasShadow && <View style={styles.pixelShadow} />}
            <View style={[styles.pixelBox, style]}>{children}</View>
        </View>
    );
}
function LegendItem({ label, color }: any) {
    return (
        <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
        </View>
    );
}

// --- 그래프 컴포넌트 ---
function GrowthLineChart({ days, values, width, height }: any) {
    const p = 30;
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.1;
    const xStep = (width - p * 2) / (days.length - 1);
    const yPos = (v: number) => p + (height - p * 2) * (1 - (v - min) / (max - min));
    const points = values.map((v: any, i: any) => `${p + i * xStep},${yPos(v)}`).join(" ");
    const fillPath = `M${p},${height - p} ` + values.map((v: any, i: any) => `L${p + i * xStep},${yPos(v)}`).join(" ") + ` L${p + (values.length - 1) * xStep},${height - p} Z`;
    return (
        <Svg width={width} height={height}>
            {[0, 1, 2, 3, 4].map((i) => (<Line key={i} x1={p} y1={p + (i * (height - p * 2)) / 4} x2={width - p} y2={p + (i * (height - p * 2)) / 4} stroke="#F0F0F0" strokeWidth={1} />))}
            <Path d={fillPath} fill={ACCENT} fillOpacity={0.1} />
            <Polyline points={points} fill="none" stroke={ACCENT} strokeWidth={3} strokeLinejoin="round" />
            {values.map((v: any, i: any) => (
                <G key={i}>
                    <Circle cx={p + i * xStep} cy={yPos(v)} r={4} fill={CARD_BG} stroke={ACCENT} strokeWidth={2} />
                    <SvgText x={p + i * xStep} y={yPos(v) - 10} fontSize="13" textAnchor="middle" fill={ACCENT} fontFamily="NeoDunggeunmoPro-Regular">{v}</SvgText>
                </G>
            ))}
            <Line x1={p} y1={height - p} x2={width - p} y2={height - p} stroke={BORDER} strokeWidth={2} />
        </Svg>
    );
}
function AnomalyMonitorChart({ days, data, width, height }: any) {
    const p = 25;
    const maxScale = 6;
    const barAreaW = width - p * 2;
    const barW = (barAreaW / data.length) - 10;
    const scale = (height - p * 2) / maxScale;
    return (
        <Svg width={width} height={height}>
            {[0, 1, 2, 3, 4].map((i) => (<Line key={i} x1={p} y1={p + (i * (height - p * 2)) / 4} x2={width - p} y2={p + (i * (height - p * 2)) / 4} stroke="#F0F0F0" strokeWidth={1} />))}
            {data.map((d: any, i: number) => {
                const x = p + i * (barW + 10) + 5;
                const h1 = d.water * scale; const h2 = d.nutrient * scale; const h3 = d.tempHum * scale;
                const renderStackedBar = (y: number, h: number, color: string) => h > 0 && (
                    <G><Rect x={x} y={y} width={barW} height={h} fill={color} strokeWidth={1} /><Rect x={x + 1} y={y + 1} width={2} height={h - 2} fill="white" fillOpacity={0.2} /></G>
                );
                return (
                    <G key={i}>
                        {renderStackedBar(height - p - h1, h1, "#6495ED")}
                        {renderStackedBar(height - p - h1 - h2, h2, "#9ACD32")}
                        {renderStackedBar(height - p - h1 - h2 - h3, h3, "#FF6347")}
                        <SvgText x={x + barW / 2} y={height - 5} fontSize="12" textAnchor="middle" fill="#999" fontFamily="NeoDunggeunmoPro-Regular">{days[i]}</SvgText>
                    </G>
                );
            })}
            <Line x1={p} y1={height - p} x2={width - p} y2={height - p} stroke={BORDER} strokeWidth={1} />
        </Svg>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG_COLOR },
    content: { paddingHorizontal: 22, paddingBottom: 40 },
    header: { marginTop: 60, marginBottom: 20, alignItems: "center" },
    headerTitle: { fontSize: 30, fontFamily: "NeoDunggeunmoPro-Regular", color: "#000" },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 26, marginBottom: 12 },
    headerSquare: { width: 10, height: 10, backgroundColor: BORDER, marginRight: 8 },
    sectionTitle: { fontSize: 18, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
    pixelContainer: { marginBottom: 8, position: 'relative' },
    pixelShadow: { position: 'absolute', top: 4, left: 4, right: -4, bottom: -4, backgroundColor: BORDER },
    pixelBox: { backgroundColor: CARD_BG, borderWidth: 3, borderColor: BORDER, padding: 12 },

    photoWrap: {
        width: PHOTO_WIDTH,
        height: 220,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: BORDER,
    },
    slideContainer: {
        flexDirection: 'row',
        width: PHOTO_WIDTH * 2,
        height: '100%',
    },
    photoContainer: {
        width: PHOTO_WIDTH,
        height: '100%',
        overflow: 'hidden',
        backgroundColor: BORDER,
    },
    photo: {
        ...StyleSheet.absoluteFillObject,
        width: undefined,
        height: undefined,
    },

    statusBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: BORDER, flexDirection: 'row', alignItems: 'center', padding: 4, zIndex: 10 },
    statusDot: { width: 6, height: 6, backgroundColor: '#FF0000', marginRight: 5 },
    statusText: { color: '#FFF', fontSize: 10, fontFamily: "NeoDunggeunmoPro-Regular" },
    photoNavBtn: { position: 'absolute', top: '45%', backgroundColor: 'rgba(26,26,26,0.6)', padding: 8, borderRadius: 2, zIndex: 20 },
    photoNavText: { color: '#FFF', fontSize: 16 },
    photoIndicatorRow: { position: 'absolute', bottom: 10, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    photoDot: { width: 6, height: 6, borderWidth: 1, borderColor: BORDER },

    archiveBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
    folderIcon: { width: 28, height: 20, marginRight: 15, position: 'relative' },
    folderTab: { width: 10, height: 4, backgroundColor: BORDER, position: 'absolute', top: -4 },
    folderBody: { flex: 1, borderWidth: 2, borderColor: BORDER, backgroundColor: '#EEE' },
    archiveTextWrap: { flex: 1 },
    archiveTitle: { fontSize: 16, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
    archiveSub: { fontSize: 9, fontFamily: "NeoDunggeunmoPro-Regular", color: '#777', marginTop: 2 },
    arrow: { fontSize: 12, color: BORDER, fontWeight: 'bold' },
    chartBox: { padding: 12 },
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' },
    periodText: { fontSize: 13, fontFamily: "NeoDunggeunmoPro-Regular", color: '#666' },
    legendRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 10 },
    legendDot: { width: 8, height: 8, borderWidth: 1, borderColor: BORDER },
    legendText: { fontSize: 10, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
    monitorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 5 },
    monitorLed: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    monitorTitle: { fontSize: 13, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
    monitorFooter: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
});

const dummyDays = ["01.17", "01.18", "01.19", "01.20", "01.21", "01.22", "01.23"];
const dummyGrowth = [4.2, 4.7, 5.3, 5.3, 5.6, 6.1, 6.8];
const dummyAnomaly = [{ water: 1, nutrient: 1, tempHum: 2 }, { water: 3, nutrient: 2, tempHum: 1 }, { water: 0, nutrient: 1, tempHum: 1 }, { water: 1, nutrient: 0, tempHum: 0 }, { water: 1, nutrient: 1, tempHum: 0 }, { water: 0, nutrient: 1, tempHum: 1 }, { water: 0, nutrient: 0, tempHum: 1 }];
