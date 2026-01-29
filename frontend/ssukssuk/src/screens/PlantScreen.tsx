import React, { useRef, useState } from "react";
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
  Platform,
  StatusBar,
} from "react-native";

const TOMATO_IMG = require("../assets/tomato_normal.png");

// 상수는 스타일 시트 외부에서 공통 관리
const BG_COLOR = "#EDEDE9";
const PIXEL = 4;
const BORDER_COLOR = "#300e08";
const CARD_BG = "#f6f6f6";

type Plant = {
  id: string;
  type: string;
  nickname: string;
  isSelected: boolean;
  image: any;
};

export default function PlantScreen({ navigation }: any) {
  const [plants, setPlants] = useState<Plant[]>([
    { id: "1", type: "토마토", nickname: "토토", isSelected: false, image: TOMATO_IMG },
    { id: "2", type: "상추", nickname: "츄츄", isSelected: false, image: null },
    { id: "3", type: "토마토", nickname: "투투", isSelected: true, image: TOMATO_IMG },
  ]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleSelectPlant = (id: string) => {
    setPlants((prev) => prev.map((p) => ({ ...p, isSelected: p.id === id })));
    setActiveMenuId(null);
  };

  const handleDelete = (id: string) => {
    setActiveMenuId(null);
    Alert.alert("삭제", "정말로 삭제하시겠습니까?", [
      { text: "취소" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => setPlants((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  };

  const handleEdit = (plant: Plant) => {
    setActiveMenuId(null);
    navigation.navigate("PlantAddEdit", { mode: "edit", plantData: plant });
  };

  return (
      <SafeAreaView style={styles.screen}>
        {/* 헤더 고정: ScrollView 밖으로 배치 */}
        <View style={styles.fixedHeader}>
          <Text style={styles.headerTitle}>나의 식물</Text>
        </View>

        <Pressable style={{ flex: 1 }} onPress={() => setActiveMenuId(null)}>
          <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridContainer}>
              {plants.map((plant) => (
                  <View key={plant.id} style={styles.cardWrapper}>
                    <PixelBox>
                      <View style={styles.cardHeader}>
                        <View style={styles.nameRow}>
                          <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: plant.isSelected ? "#75A743" : "#CCC" },
                              ]}
                          />
                          <Text style={styles.plantNickname} numberOfLines={1}>
                            {plant.nickname}
                          </Text>
                        </View>

                        <Pressable
                            onPress={() => setActiveMenuId((cur) => (cur === plant.id ? null : plant.id))}
                            hitSlop={10}
                        >
                          <Text style={styles.menuDots}>•••</Text>
                        </Pressable>
                      </View>

                      <View style={styles.imageContainer}>
                        {plant.image ? (
                            <Image source={plant.image} style={styles.plantImage} resizeMode="contain" />
                        ) : (
                            <Text style={styles.emojiText}>🌱</Text>
                        )}
                      </View>

                      <PixelButton
                          text={plant.isSelected ? "선택됨" : "선택하기"}
                          disabled={plant.isSelected}
                          onPress={() => handleSelectPlant(plant.id)}
                          style={{ marginTop: 10, width: "100%" }}
                      />

                      {activeMenuId === plant.id && (
                          <View style={styles.popupMenu}>
                            <Pressable onPress={() => handleEdit(plant)} style={styles.menuItem}>
                              <Text style={styles.menuText}>수정하기</Text>
                            </Pressable>
                            <View style={styles.menuDivider} />
                            <Pressable onPress={() => handleDelete(plant.id)} style={styles.menuItem}>
                              <Text style={[styles.menuText, styles.deleteText]}>삭제하기</Text>
                            </Pressable>
                          </View>
                      )}
                    </PixelBox>
                  </View>
              ))}
            </View>

            <PixelWideButton
                text="+ 식물 추가"
                onPress={() => navigation.navigate("PlantAddEdit", { mode: "add" })}
                style={{ marginTop: 18 }}
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </SafeAreaView>
  );
}

// ---------------------------
// 픽셀 UI 컴포넌트들
// ---------------------------

function PixelBox({ children, style }: any) {
  return (
      <View style={[styles.pixelBoxContainer, style]}>
        <View style={styles.pixelBgUnderlay} />

        {/* 음영: 양 끝 기둥 공백 해결 버전 */}
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.015, width: PIXEL * 3 - 1 }]} />
        <View
            pointerEvents="none"
            style={[styles.shadeLeft, { left: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]}
        />

        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.015, width: PIXEL * 3 - 1 }]} />
        <View
            pointerEvents="none"
            style={[styles.shadeRight, { right: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]}
        />

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
  const pressIn = () => !disabled && Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
  const pressOut = () => Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

  return (
      <Pressable onPress={onPress} disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} style={style}>
        <Animated.View style={[
          styles.pixelBtn,
          disabled && styles.pixelBtnDisabled,
          {
            borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
          }
        ]}>
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
        <Animated.View style={[
          styles.pixelWideBtn,
          {
            borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
          }
        ]}>
          <Text style={styles.pixelWideBtnText}>{text}</Text>
        </Animated.View>
      </Pressable>
  );
}

// ---------------------------
// 스타일 시트
// ---------------------------

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_COLOR },

  fixedHeader: {
    marginTop: Platform.OS === "android" ? 60 : 20,
    marginBottom: 20,
    alignItems: "center"
  },
  headerTitle: {
    fontSize: 30,
    fontFamily: "NeoDunggeunmoPro-Regular",
    color: "rgba(36,46,19,0.9)",
  },

  scrollContent: { paddingHorizontal: 22, paddingBottom: 40 ,paddingTop: 35,},
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
  emojiText: { fontSize: 40 },

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