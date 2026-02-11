import React, { useCallback, useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    Image,
    Animated,
    SafeAreaView,
    ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import client from "../api";

const TOMATO_IMG = require("../assets/tomato_normal.png");

// 상수는 스타일 시트 외부에서 공통 관리
const BG_COLOR = "#EDEDE9";
const PIXEL = 4;
const BORDER_COLOR = "#300e08";
const CARD_BG = "#f6f6f6";

// ✅ HistoryScreen과 완전 동일한 고정 헤더 높이
const STICKY_HEADER_H = 100;

// ✅ [추가] DB의 character_code와 매핑되는 이미지 URL 목록
const CHARACTER_URLS: { [key: number]: string } = {
    0: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/normal_spath_lv1.png",
    1: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/normal_spath_lv2.png",
    2: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/normal_spath_lv3.png",
    3: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/sick_spath_lv1.png",
    4: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/sick_spath_lv2.png",
    5: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/sick_spath_lv3.png",
    6: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/fat_spath_lv1.png",
    7: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/fat_spath_lv2.png",
    8: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/fat_spath_lv3.png",
    9: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/hot_spath_lv1.png",
    10: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/hot_spath_lv2.png",
    11: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/hot_spath_lv3.png",
    12: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/cold_spath_lv1.png",
    13: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/cold_spath_lv2.png",
    14: "https://plant-images-prod-a103.s3.ap-northeast-2.amazonaws.com/esset/cold_spath_lv3.png",
};

// ✅ [수정] character_code 추가
type PlantData = {
    plant_id: number;
    species_id: number;
    character_code: number;
    name: string;
    device_id: number;
    is_main: boolean;
    is_connected: boolean;
};

export default function PlantScreen({ navigation }: any) {
    const [plants, setPlants] = useState<PlantData[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchPlants = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);

            const res = await client.get("/plants");
            if (res.data.success) {
                setPlants(res.data.data);
            }
        } catch (error) {
            console.error("식물 목록 로드 실패:", error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }).start();

            fetchPlants(true);
            return () => setActiveMenuId(null);
        }, [fadeAnim])
    );

    // ✅ Root의 Main(Home)으로 “안전하게” 이동
    const goHomeSafely = () => {
        // PlantHome(스택) -> (부모) MainTabs(탭) -> (부모) RootStack
        const tabNav = navigation.getParent(); // 보통 MainTabs
        const rootNav = tabNav?.getParent();   // RootNavigator stack

        if (rootNav) {
            // RootStack에 등록된 이름이 "Main"
            rootNav.navigate("Main", { screen: "Home" });
            return;
        }

        // 혹시 구조 다르면 백업
        if (tabNav) {
            tabNav.navigate("Home");
            return;
        }

        navigation.navigate("Home");
    };

    // ✅ [추가] 화면 전환 페이드아웃 후 Home으로 이동
    const goHomeWithFade = () => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
        }).start(() => {
            goHomeSafely();
        });
    };

    // ✅ 메인 전환 성공 시 -> 페이드아웃 -> Home 이동
    const handleSelectMain = async (id: number) => {
        // (A) UI 즉시 반영
        setPlants((prev) =>
            prev.map((p) => ({
                ...p,
                is_main: p.plant_id === id,
            }))
        );
        setActiveMenuId(null);

        try {
            // (B) 서버에 메인 변경 요청
            const res = await client.patch(`/plants/${id}/main`, {});
            if (!res.data.success) {
                throw new Error(res.data.message || "서버 내부 오류");
            }

            // (C) PlantScreen도 동기화는 한 번 해주고(선택)
            fetchPlants(false);

            // (D) ✅ 페이드아웃 전환 후 Home 탭으로 이동
            goHomeWithFade();
        } catch (error: any) {
            console.error("메인 전환 에러:", error);
            fetchPlants(false);
            Alert.alert("오류", "메인 식물 전환에 실패했습니다.");
        }
    };

    const handleDelete = (id: number) => {
        setActiveMenuId(null);
        Alert.alert("삭제", "정말로 삭제하시겠습니까?", [
            { text: "취소" },
            {
                text: "삭제",
                style: "destructive",
                onPress: async () => {
                    try {
                        await client.delete(`/plants/${id}`);
                        setPlants((prev) => prev.filter((p) => p.plant_id !== id));
                    } catch (error) {
                        console.error("삭제 실패:", error);
                        Alert.alert("오류", "삭제하지 못했습니다.");
                    }
                },
            },
        ]);
    };

    const handleEdit = (plant: PlantData) => {
        setActiveMenuId(null);
        navigation.navigate("PlantAddEdit", { mode: "edit", plantData: plant });
    };

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <SafeAreaView style={styles.screen}>
                {/* ✅ HistoryScreen과 “완전 동일”한 고정 헤더 + 그림자 */}
                <View style={styles.stickyHeader}>
                    <Text style={styles.headerTitle}>나의 식물</Text>
                </View>

                <Pressable style={{ flex: 1 }} onPress={() => setActiveMenuId(null)}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={{ marginTop: 50 }}>
                                <ActivityIndicator size="large" color="#75A743" />
                            </View>
                        ) : (
                            <>
                                <View style={styles.gridContainer}>
                                    {plants.map((plant) => {
                                        const displayName = plant.name || "이름 없음";

                                        const serverImgUrl = CHARACTER_URLS[plant.character_code];
                                        const imageSource = serverImgUrl ? { uri: serverImgUrl } : TOMATO_IMG;

                                        return (
                                            <View key={plant.plant_id} style={styles.cardWrapper}>
                                                <PixelBox>
                                                    <View style={styles.cardHeader}>
                                                        <View style={styles.nameRow}>
                                                            <View
                                                                style={[
                                                                    styles.statusDot,
                                                                    { backgroundColor: plant.is_connected ? "#75A743" : "#CCC" },
                                                                ]}
                                                            />
                                                            <Text style={styles.plantNickname} numberOfLines={1}>
                                                                {displayName}
                                                            </Text>
                                                        </View>

                                                        <Pressable
                                                            onPress={() =>
                                                                setActiveMenuId((cur) =>
                                                                    cur === plant.plant_id ? null : plant.plant_id
                                                                )
                                                            }
                                                            hitSlop={10}
                                                        >
                                                            <Text style={styles.menuDots}>•••</Text>
                                                        </Pressable>
                                                    </View>

                                                    <View style={styles.imageContainer}>
                                                        <Image source={imageSource} style={styles.plantImage} resizeMode="contain" />
                                                    </View>

                                                    <PixelButton
                                                        text={plant.is_main ? "선택됨" : "선택하기"}
                                                        disabled={plant.is_main}
                                                        onPress={() => handleSelectMain(plant.plant_id)}
                                                        style={{ marginTop: 10, width: "100%" }}
                                                    />

                                                    {activeMenuId === plant.plant_id && (
                                                        <View style={styles.popupMenu}>
                                                            <Pressable onPress={() => handleEdit(plant)} style={styles.menuItem}>
                                                                <Text style={styles.menuText}>수정하기</Text>
                                                            </Pressable>
                                                            <View style={styles.menuDivider} />
                                                            <Pressable onPress={() => handleDelete(plant.plant_id)} style={styles.menuItem}>
                                                                <Text style={[styles.menuText, styles.deleteText]}>삭제하기</Text>
                                                            </Pressable>
                                                        </View>
                                                    )}
                                                </PixelBox>
                                            </View>
                                        );
                                    })}
                                </View>

                                <PixelWideButton
                                    text="+ 식물 추가"
                                    onPress={() => navigation.navigate("PlantAddEdit", { mode: "add" })}
                                    style={{ marginTop: 18 }}
                                />
                                <View style={{ height: 40 }} />
                            </>
                        )}
                    </ScrollView>
                </Pressable>
            </SafeAreaView>
        </Animated.View>
    );
}

// ---------------------------
// 픽셀 UI 컴포넌트들 (기존 스타일 유지)
// ---------------------------

function PixelBox({ children, style }: any) {
    return (
        <View style={[styles.pixelBoxContainer, style]}>
            <View style={styles.pixelBgUnderlay} />
            <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
            <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
            <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.015, width: PIXEL * 3 - 1 }]} />
            <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]} />
            <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
            <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
            <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.015, width: PIXEL * 3 - 1 }]} />
            <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]} />

            <View style={styles.pixelTop} />
            <View style={styles.pixelBottom} />
            <View style={styles.pixelLeft} />
            <View style={styles.pixelRight} />
            <View style={styles.pixelCornerTL1} />
            <View style={styles.pixelCornerTL2} />
            <View style={styles.pixelCornerTL3} />
            <View style={styles.pixelCornerTR1} />
            <View style={styles.pixelCornerTR2} />
            <View style={styles.pixelCornerTR3} />
            <View style={styles.pixelCornerBL1} />
            <View style={styles.pixelCornerBL2} />
            <View style={styles.pixelCornerBL3} />
            <View style={styles.pixelCornerBR1} />
            <View style={styles.pixelCornerBR2} />
            <View style={styles.pixelCornerBR3} />
            <View style={styles.cardInner}>{children}</View>
        </View>
    );
}

function PixelButton({ text, onPress, disabled, style }: any) {
    const v = useRef(new Animated.Value(0)).current;
    const pressIn = () =>
        !disabled && Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
    const pressOut = () =>
        Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

    return (
        <Pressable onPress={onPress} disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} style={style}>
            <Animated.View
                style={[
                    styles.pixelBtn,
                    disabled && styles.pixelBtnDisabled,
                    {
                        borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                        borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                        marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
                    },
                ]}
            >
                <Text style={[styles.pixelBtnText, disabled && styles.pixelBtnTextDisabled]}>{text}</Text>
            </Animated.View>
        </Pressable>
    );
}

function PixelWideButton({ text, onPress, style }: any) {
    const v = useRef(new Animated.Value(0)).current;
    const pressIn = () => Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
    const pressOut = () => Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

    return (
        <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={style}>
            <Animated.View
                style={[
                    styles.pixelWideBtn,
                    {
                        borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                        borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                        marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
                    },
                ]}
            >
                <Text style={styles.pixelWideBtnText}>{text}</Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG_COLOR },

    stickyHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: STICKY_HEADER_H,
        backgroundColor: BG_COLOR,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 14,
        zIndex: 999,

        shadowColor: "#000",
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
    },

    scrollContent: { paddingHorizontal: 22, paddingBottom: 40, paddingTop: STICKY_HEADER_H + 10 },

    headerTitle: {
        fontSize: 30,
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: "rgba(36,46,19,0.9)",
    },

    gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    cardWrapper: { width: "48%", marginBottom: 20 },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        alignItems: "center",
        marginBottom: 10,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingRight: 6 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },

    plantNickname: {
        fontSize: 18,
        fontFamily: "NeoDunggeunmoPro-Regular",
        color: "rgba(36,46,19,0.9)",
        flexShrink: 1,
    },
    menuDots: { fontSize: 14, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER_COLOR },

    imageContainer: { width: 80, height: 80, justifyContent: "center", alignItems: "center", marginBottom: 6 },
    plantImage: { width: "100%", height: "100%" },

    popupMenu: {
        position: "absolute",
        top: 30,
        right: 10,
        width: 90,
        backgroundColor: "#FFF",
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        zIndex: 99,
        elevation: 5,
    },
    menuItem: { paddingVertical: 8, alignItems: "center" },
    menuText: { fontSize: 12, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER_COLOR },
    deleteText: { color: "#E04B4B" },
    menuDivider: { height: 1, backgroundColor: "#EEE", width: "100%" },

    pixelBoxContainer: { position: "relative", marginHorizontal: PIXEL * 2, marginVertical: PIXEL },
    pixelBgUnderlay: { position: "absolute", top: 0, bottom: 0, left: -PIXEL, right: -PIXEL, backgroundColor: CARD_BG, zIndex: 0 },
    cardInner: { padding: 12, alignItems: "center", minHeight: 160, position: "relative", zIndex: 10 },

    shadeLeft: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#000", zIndex: 1 },
    shadeRight: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#000", zIndex: 1 },

    pixelTop: { position: "absolute", top: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
    pixelBottom: { position: "absolute", bottom: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
    pixelLeft: { position: "absolute", top: PIXEL, bottom: PIXEL, left: -PIXEL * 2, width: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
    pixelRight: { position: "absolute", top: PIXEL, bottom: PIXEL, right: -PIXEL * 2, width: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },

    pixelCornerTL1: { position: "absolute", top: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerTL2: { position: "absolute", top: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerTL3: { position: "absolute", top: PIXEL, left: -PIXEL * 2, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },

    pixelCornerTR1: { position: "absolute", top: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerTR2: { position: "absolute", top: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerTR3: { position: "absolute", top: PIXEL, right: -PIXEL * 2, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },

    pixelCornerBL1: { position: "absolute", bottom: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerBL2: { position: "absolute", bottom: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerBL3: { position: "absolute", bottom: PIXEL, left: -PIXEL * 2, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },

    pixelCornerBR1: { position: "absolute", bottom: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerBR2: { position: "absolute", bottom: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
    pixelCornerBR3: { position: "absolute", bottom: PIXEL, right: -PIXEL * 2, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },

    pixelBtn: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 10, backgroundColor: CARD_BG, borderWidth: 2, borderColor: BORDER_COLOR, borderBottomWidth: 4, borderRightWidth: 4 },
    pixelBtnDisabled: { borderColor: "#AAA" },
    pixelBtnText: { fontSize: 14, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER_COLOR },
    pixelBtnTextDisabled: { color: "#AAA" },

    pixelWideBtn: { width: "100%", alignItems: "center", justifyContent: "center", paddingVertical: 12, backgroundColor: CARD_BG, borderWidth: 2, borderColor: BORDER_COLOR, borderBottomWidth: 4, borderRightWidth: 4 },
    pixelWideBtnText: { fontSize: 22, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER_COLOR },
});
