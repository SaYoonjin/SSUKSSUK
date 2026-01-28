import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    View,
    Text,
} from "react-native";

import BottomSheet, {
    BottomSheetView,
    BottomSheetBackgroundProps,
} from "@gorhom/bottom-sheet";

const BG_DAY = require("../assets/background1.png");
const BG_NIGHT = require("../assets/background2.png");
const ALARM_ICON = require("../assets/alarm_balloon.png");
const TOMATO_NORMAL = require("../assets/tomato_normal.png");

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;

const SHEET_BG = "#D4E1C6";
const BORDER = "#1A1A1A";
const FONT = "NeoDunggeunmoPro-Regular";

// --------------------
// 픽셀 박스 컴포넌트
// - 기본(두꺼운) / 카드용(얇은) 둘 다 지원
// - cardThin={true} 주면 카드 테두리만 얇아짐
// --------------------
function PixelBox({
                      children,
                      style,
                      bgColor = "#FFFFFF",
                      cardThin = false,
                  }: any) {
    // 기본은 기존 값 유지(4px), 카드만 2px로 줄임
    const t = cardThin ? 2 : 4;         // 테두리 두께
    const s = cardThin ? 4 : 8;         // 코너 공간(직선 시작/끝 여유)
    const step = t;                     // 계단 조각 크기(정사각)

    return (
        <View style={[styles.pixelBoxContainer, style]}>
            {/* 배경색 */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, margin: t }]} />

            {/* 상하좌우 직선 */}
            <View style={[styles.pLine, { top: 0, left: s, right: s, height: t }]} />
            <View style={[styles.pLine, { bottom: 0, left: s, right: s, height: t }]} />
            <View style={[styles.pLine, { left: 0, top: s, bottom: s, width: t }]} />
            <View style={[styles.pLine, { right: 0, top: s, bottom: s, width: t }]} />

            {/* 코너 계단 조각 */}
            {/* 좌상단 */}
            <View style={[styles.pLine, { top: t, left: t, width: step, height: step }]} />
            <View style={[styles.pLine, { top: 0, left: t, width: step, height: step }]} />
            <View style={[styles.pLine, { top: t, left: 0, width: step, height: step }]} />

            {/* 우상단 */}
            <View style={[styles.pLine, { top: t, right: t, width: step, height: step }]} />
            <View style={[styles.pLine, { top: 0, right: t, width: step, height: step }]} />
            <View style={[styles.pLine, { top: t, right: 0, width: step, height: step }]} />

            {/* 좌하단 */}
            <View style={[styles.pLine, { bottom: t, left: t, width: step, height: step }]} />
            <View style={[styles.pLine, { bottom: 0, left: t, width: step, height: step }]} />
            <View style={[styles.pLine, { bottom: t, left: 0, width: step, height: step }]} />

            {/* 우하단 */}
            <View style={[styles.pLine, { bottom: t, right: t, width: step, height: step }]} />
            <View style={[styles.pLine, { bottom: 0, right: t, width: step, height: step }]} />
            <View style={[styles.pLine, { bottom: t, right: 0, width: step, height: step }]} />

            <View style={[styles.pixelBoxInner, cardThin && { padding: 10, paddingTop: 12 }]}>
                {children}
            </View>
        </View>
    );
}

// --------------------
// 바텀시트 배경 (삐져나옴 수정 버전)
// --------------------
function PixelSheetBackground({ style }: BottomSheetBackgroundProps) {
    return (
        <View style={[style, { backgroundColor: "transparent", top: -1 }]}>
            <View style={styles.pixelSheetFrame}>
                <View style={styles.pixelSheetInner} />
                <View style={styles.pixelSheetCornerTL} />
                <View style={styles.pixelSheetCornerTR} />
            </View>
        </View>
    );
}

// --------------------
// 유틸
// --------------------
function isDayTime(now: Date) {
    const h = now.getHours();
    return h >= DAY_START_HOUR && h < DAY_END_HOUR;
}

function getNextSwitchTime(now: Date) {
    const next = new Date(now);
    const h = now.getHours();
    if (h >= DAY_START_HOUR && h < DAY_END_HOUR) {
        next.setHours(DAY_END_HOUR, 0, 0, 0);
        return next;
    }
    next.setHours(DAY_START_HOUR, 0, 0, 0);
    if (h >= DAY_END_HOUR) next.setDate(next.getDate() + 1);
    return next;
}

export default function MainScreen({ navigation }: any) {
    const [useDayBg, setUseDayBg] = useState(() => isDayTime(new Date()));
    const [hasAlarm, setHasAlarm] = useState(false);
    const sheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ["8%", "43%"], []);

    const backgroundSource = useMemo(() => (useDayBg ? BG_DAY : BG_NIGHT), [useDayBg]);

    const scheduleBackgroundSwitch = useCallback(() => {
        const now = new Date();
        setUseDayBg(isDayTime(now));
        const next = getNextSwitchTime(now);
        const ms = Math.max(500, next.getTime() - now.getTime());
        setTimeout(() => scheduleBackgroundSwitch(), ms);
    }, []);

    useEffect(() => {
        scheduleBackgroundSwitch();
    }, [scheduleBackgroundSwitch]);

    return (
        <View style={styles.root}>
            <ImageBackground source={backgroundSource} style={styles.bg} resizeMode="cover">
                <Pressable style={styles.alarmWrap} onPress={() => { }}>
                    <View style={styles.alarmBox}>
                        <Image source={ALARM_ICON} style={styles.alarmIcon} />
                        {hasAlarm && <View style={styles.badgeDot} />}
                    </View>
                </Pressable>
                {/* 토마토 캐릭터 */}
                <Image source={TOMATO_NORMAL} style={styles.tomato} />

            </ImageBackground>

            <BottomSheet
                ref={sheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose={false}
                backgroundComponent={PixelSheetBackground}
                handleStyle={styles.handleArea}
                handleIndicatorStyle={styles.handleIndicator}
            >
                <BottomSheetView style={styles.sheetContent}>
                    <View style={styles.sheetHeader}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.plantName}>토토</Text>
                            <Text style={styles.plantType}>(방울토마토)</Text>
                        </View>
                        <View style={styles.dDayPill}>
                            <Text style={styles.dDayText}>D+45</Text>
                        </View>
                    </View>

                    <PixelBox style={styles.statusPanel} bgColor="#F2F7ED" cardThin>
                        <Text style={styles.panelTitle}>현재 상태</Text>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: "80%" }]} />
                        </View>
                        <Text style={[styles.panelTitle, { marginTop: 12 }]}>성장 상태</Text>
                        <View style={styles.barTrack}>
                            <View style={[styles.barFillDark, { width: "65%" }]} />
                        </View>
                    </PixelBox>

                    <Text style={styles.sectionTitle}>현재 기기 상태</Text>

                    <View style={styles.cardRow}>
                        <PixelBox style={styles.card} bgColor="#BFD1F1" cardThin>
                            <Text style={styles.cardTitle}>수위</Text>
                            <Text style={styles.cardDesc}>충분함</Text>
                        </PixelBox>
                        <PixelBox style={styles.card} bgColor="#E7CF90" cardThin>
                            <Text style={styles.cardTitle}>농도</Text>
                            <Text style={styles.cardDesc}>적당함</Text>
                        </PixelBox>
                        <PixelBox style={styles.card} bgColor="#DDE8C8" cardThin>
                            <Text style={styles.cardTitle}>기온/습도</Text>
                            <Text style={styles.cardDesc}>25도 / 58%</Text>
                        </PixelBox>
                    </View>
                </BottomSheetView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#000" },
    bg: { flex: 1 },

    // --- 픽셀 공통 요소 ---
    pLine: { position: "absolute", backgroundColor: BORDER },

    pixelBoxContainer: { position: "relative" },
    pixelBoxInner: { padding: 12, paddingTop: 14 },

    // --- 바텀시트 배경 수정 ---
    pixelSheetFrame: { flex: 1, backgroundColor: "transparent" },
    pixelSheetInner: {
        flex: 1,
        backgroundColor: SHEET_BG,
        borderTopWidth: 4,
        borderColor: BORDER,
        marginTop: 0,
    },
    pixelSheetCornerTL: {
        position: "absolute",
        top: 0,
        left: 0,
        width: 8,
        height: 8,
        backgroundColor: "transparent",
        borderLeftWidth: 4,
        borderTopWidth: 4,
        borderColor: BORDER,
    },
    pixelSheetCornerTR: {
        position: "absolute",
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        backgroundColor: "transparent",
        borderRightWidth: 4,
        borderTopWidth: 4,
        borderColor: BORDER,
    },
    tomato: {
        position: "absolute",
        bottom: 270,     // 울타리 앞 땅 위에 걸치도록 조정
        left: "50%",
        transform: [{ translateX: -160 }], // 이미지 가로 절반만큼 이동
        width: 320,
        height: 320,
        resizeMode: "contain",
    },

    // --- 레이아웃 ---
    alarmWrap: { position: "absolute", top: 80, right: 1, zIndex: 20 },
    alarmBox: { width: 78, height: 78, justifyContent: "center", alignItems: "center" },
    alarmIcon: { width: 70, height: 70, resizeMode: "contain" },
    badgeDot: {
        position: "absolute",
        top: 10,
        right: 10,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "red",
        borderWidth: 2,
        borderColor: "white",
    },

    handleArea: { paddingTop: 12, paddingBottom: 4 },
    handleIndicator: { width: 60, height: 5, borderRadius: 10, backgroundColor: BORDER, opacity: 0.2 },

    sheetContent: { flex: 1, paddingHorizontal: 20 },
    sheetHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    headerLeft: { flexDirection: "row", alignItems: "flex-end", gap: 6 },
    plantName: { fontSize: 32, color: "#1A1A1A", fontFamily: FONT },
    plantType: { fontSize: 16, color: "#1A1A1A", opacity: 0.6, marginBottom: 4, fontFamily: FONT },
    dDayPill: { backgroundColor: "#000", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    dDayText: { fontSize: 13, color: "#FFF", fontFamily: FONT },

    statusPanel: { marginTop: 4 },
    panelTitle: { fontSize: 13, color: "#1A1A1A", marginBottom: 8, fontFamily: FONT },
    barTrack: { height: 18, borderWidth: 3, borderColor: BORDER, backgroundColor: "#FFF", overflow: "hidden" },
    barFill: { height: "100%", backgroundColor: "#7EC37A" },
    barFillDark: { height: "100%", backgroundColor: "#2E5A35" },

    sectionTitle: { marginTop: 24, fontSize: 18, color: "#1A1A1A", fontFamily: FONT },

    cardRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    card: { flex: 1, minHeight: 100, justifyContent: "center" },
    cardTitle: { fontSize: 16, color: "#1A1A1A", marginBottom: 4, fontFamily: FONT, textAlign: "center" },
    cardDesc: { fontSize: 11, color: "#1A1A1A", opacity: 0.8, fontFamily: FONT, textAlign: "center" },
});
