import React, { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    TextInput,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Animated,
} from "react-native";

// 상수 설정
const PIXEL_SIZE = 4;
const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";
const BORDER_COLOR = GREEN;
const CARD_BG = "#fafaf6";

export default function NicknameEditScreen({ navigation }: any) {
    const [nickname, setNickname] = useState("");

    const handleSubmit = () => {
        const trimmed = nickname.trim();
        if (!trimmed) {
            Alert.alert("알림", "변경할 닉네임을 입력해 주세요.");
            return;
        }
        Alert.alert("완료", "닉네임이 변경되었습니다.");
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={10}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backChevron}>‹</Text>
                    </Pressable>
                    <Text style={styles.headerTitle}>닉네임 변경하기</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.label}>변경할 닉네임</Text>

                    <PixelInput
                        value={nickname}
                        onChangeText={setNickname}
                        placeholder="닉네임을 입력하세요"
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={20}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                    />

                    <View style={{ height: 120 }} />
                </ScrollView>

                <View style={styles.bottomBar}>
                    <PixelButton text="변경하기" onPress={handleSubmit} />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ---------------- 컴포넌트 분리 ----------------

function PixelBox({ children, style }: any) {
    return (
        <View style={[styles.pixelBoxContainer, style]}>
            {/* 1) 배경색 레이어 */}
            <View style={styles.pixelBgUnderlay} />

            {/* 2) 개선된 내부 음영: top, bottom을 0으로 주어 높이를 꽉 채움 */}
            <View
                pointerEvents="none"
                style={[styles.shadeLeft, { left: -PIXEL_SIZE, width: PIXEL_SIZE, top: 0, bottom: 0 }]}
            />
            <View
                pointerEvents="none"
                style={[styles.shadeRight, { right: -PIXEL_SIZE, width: PIXEL_SIZE, top: 0, bottom: 0 }]}
            />

            {/* 입체감을 위한 2중 음영: 상하 테두리 라인을 피해서 배치 */}
            <View
                pointerEvents="none"
                style={[styles.shadeLeft, {
                    left: -PIXEL_SIZE,
                    top: PIXEL_SIZE,
                    bottom: PIXEL_SIZE,
                    opacity: 0.03,
                    width: PIXEL_SIZE * 3
                }]}
            />
            <View
                pointerEvents="none"
                style={[styles.shadeRight, {
                    right: -PIXEL_SIZE,
                    top: PIXEL_SIZE,
                    bottom: PIXEL_SIZE,
                    opacity: 0.03,
                    width: PIXEL_SIZE * 3
                }]}
            />

            {/* 3) 테두리 조각들 */}
            <View style={styles.pixelTop} />
            <View style={styles.pixelBottom} />
            <View style={styles.pixelLeft} />
            <View style={styles.pixelRight} />
            <View style={styles.pixelCornerTL1} /><View style={styles.pixelCornerTL2} />
            <View style={styles.pixelCornerTR1} /><View style={styles.pixelCornerTR2} />
            <View style={styles.pixelCornerBL1} /><View style={styles.pixelCornerBL2} />
            <View style={styles.pixelCornerBR1} /><View style={styles.pixelCornerBR2} />

            <View style={styles.cardInner}>{children}</View>
        </View>
    );
}

function PixelInput(props: any) {
    return (
        <PixelBox style={{ marginTop: 10 }}>
            <TextInput
                {...props}
                style={styles.input}
                placeholderTextColor="#A6B79D"
            />
        </PixelBox>
    );
}

function PixelButton({ text, onPress }: any) {
    const v = useRef(new Animated.Value(0)).current;
    const pressIn = () => Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
    const pressOut = () => Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

    return (
        <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
            <Animated.View style={[
                styles.changeBtn,
                {
                    borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                    borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                    marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
                }
            ]}>
                <Text style={styles.changeBtnText}>{text}</Text>
            </Animated.View>
        </Pressable>
    );
}

// ---------------- 스타일 시트 ----------------

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#EDEDE9" },
    screen: { flex: 1, paddingHorizontal: 26, paddingTop: 45 },

    header: { flexDirection: "row", alignItems: "center", marginTop: 6, marginBottom: 26 },
    backBtn: { paddingRight: 10, paddingVertical: 4 },
    backChevron: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 34, color: "rgba(36,46,19,0.9)", lineHeight: 34 },
    headerTitle: { fontFamily: "NeoDunggeunmoPro-Regular", fontSize: 34, color: "rgba(36,46,19,0.9)" },

    content: { paddingBottom: 20, marginTop: 40 },
    label: { fontSize: 18, color: LIGHT_GREEN, fontFamily: "NeoDunggeunmoPro-Regular", marginBottom: 8, marginLeft: 4 },

    pixelBoxContainer: { position: "relative", marginHorizontal: PIXEL_SIZE * 2, marginVertical: PIXEL_SIZE },

    // 중복 선언 제거 및 통합
    pixelBgUnderlay: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: -PIXEL_SIZE,
        right: -PIXEL_SIZE,
        backgroundColor: CARD_BG,
        zIndex: 0
    },

    cardInner: { paddingHorizontal: 15, height: 54, justifyContent: 'center', zIndex: 10 },

    shadeLeft: {
        position: "absolute",
        backgroundColor: "#000",
        opacity: 0.05,
        zIndex: 1
    },
    shadeRight: {
        position: "absolute",
        backgroundColor: "#000",
        opacity: 0.05,
        zIndex: 1
    },

    pixelTop: { position: "absolute", top: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 5 },
    pixelBottom: { position: "absolute", bottom: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 5 },
    pixelLeft: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 5 },
    pixelRight: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 5 },

    pixelCornerTL1: { position: "absolute", top: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerTL2: { position: "absolute", top: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerTR1: { position: "absolute", top: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerTR2: { position: "absolute", top: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerBL1: { position: "absolute", bottom: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerBL2: { position: "absolute", bottom: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerBR1: { position: "absolute", bottom: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },
    pixelCornerBR2: { position: "absolute", bottom: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN, zIndex: 6 },

    input: { fontSize: 20, color: GREEN, fontFamily: "NeoDunggeunmoPro-Regular", padding: 0 },

    bottomBar: { paddingHorizontal: 26, paddingBottom: 50, backgroundColor: "#EDEDE9" },
    changeBtn: { backgroundColor: GREEN, paddingVertical: 14, alignItems: "center", borderWidth: 2, borderColor: GREEN, borderBottomWidth: 4, borderRightWidth: 4 },
    changeBtnText: { fontSize: 20, color: "#EDEDE9", fontFamily: "NeoDunggeunmoPro-Regular" },
});