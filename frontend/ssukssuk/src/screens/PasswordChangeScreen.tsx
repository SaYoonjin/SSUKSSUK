import React, { useState } from "react";
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
} from "react-native";

export default function PasswordEditScreen({ navigation }: any) {
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [newPwConfirm, setNewPwConfirm] = useState("");

    const handleSubmit = () => {
        if (!currentPw.trim() || !newPw.trim() || !newPwConfirm.trim()) {
            Alert.alert("알림", "모든 항목을 입력해 주세요.");
            return;
        }
        if (newPw !== newPwConfirm) {
            Alert.alert("알림", "새로운 비밀번호 확인이 일치하지 않습니다.");
            return;
        }
        if (currentPw === newPw) {
            Alert.alert("알림", "새 비밀번호는 기존 비밀번호와 다르게 설정해 주세요.");
            return;
        }

        // TODO: 비밀번호 변경 API 연결
        Alert.alert("완료", "비밀번호가 변경되었습니다.");
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
                {/* 상단 고정 헤더 */}
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        hitSlop={10}
                        style={styles.backBtn}
                    >
                        <Text style={styles.backChevron}>‹</Text>
                    </Pressable>

                    <Text style={styles.headerTitle}>비밀번호 변경하기</Text>
                </View>

                {/* 본문 스크롤 */}
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.label}>이전 비밀번호</Text>
                    <PixelInput
                        value={currentPw}
                        onChangeText={setCurrentPw}
                        placeholder="이전 비밀번호"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                    />

                    <Text style={[styles.label, { marginTop: 18 }]}>새로운 비밀번호</Text>
                    <PixelInput
                        value={newPw}
                        onChangeText={setNewPw}
                        placeholder="새로운 비밀번호"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="next"
                    />

                    <Text style={[styles.label, { marginTop: 18 }]}>
                        새로운 비밀번호 확인
                    </Text>
                    <PixelInput
                        value={newPwConfirm}
                        onChangeText={setNewPwConfirm}
                        placeholder="새로운 비밀번호 확인"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                    />

                    {/* 버튼이 하단 고정이라 여기는 공간만 확보 */}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* 하단 고정 버튼: 키보드 뜨면 같이 올라옴 */}
                <View style={styles.bottomBar}>
                    <Pressable onPress={handleSubmit} style={styles.changeBtn}>
                        <Text style={styles.changeBtnText}>변경하기</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function PixelInput(props: any) {
    return (
        <View style={styles.pixelInputContainer}>
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

            <TextInput
                {...props}
                style={styles.input}
                placeholderTextColor="#A6B79D"
            />
        </View>
    );
}

const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";
const PIXEL_SIZE = 4;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#FFFFFF" },
    screen: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 26,
        paddingTop: 45,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 6,
        marginBottom: 26,
    },
    backBtn: { paddingRight: 10, paddingVertical: 4 },
    backChevron: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: "#000000",
        lineHeight: 34,
    },
    headerTitle: {
        fontFamily: "NeoDunggeunmoPro-Regular",
        fontSize: 34,
        color: "#000000",
    },

    content: { paddingBottom: 20, marginTop: 40 },

    label: {
        fontSize: 18,
        color: LIGHT_GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        marginBottom: 8,
        marginLeft: 4,
    },

    pixelInputContainer: {
        position: "relative",
        height: 54,
        justifyContent: "center",
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        marginHorizontal: PIXEL_SIZE * 2,
        marginTop: 18,
    },
    input: {
        fontSize: 20,
        color: GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        paddingVertical: 0,
        zIndex: 10,
    },

    pixelTop: {
        position: "absolute",
        top: -PIXEL_SIZE,
        left: PIXEL_SIZE,
        right: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelBottom: {
        position: "absolute",
        bottom: -PIXEL_SIZE,
        left: PIXEL_SIZE,
        right: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelLeft: {
        position: "absolute",
        top: PIXEL_SIZE,
        bottom: PIXEL_SIZE,
        left: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelRight: {
        position: "absolute",
        top: PIXEL_SIZE,
        bottom: PIXEL_SIZE,
        right: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        backgroundColor: GREEN,
    },

    pixelCornerTL1: {
        position: "absolute",
        top: 0,
        left: -PIXEL_SIZE,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerTL2: {
        position: "absolute",
        top: -PIXEL_SIZE,
        left: 0,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerTL3: {
        position: "absolute",
        top: PIXEL_SIZE,
        left: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },

    pixelCornerTR1: {
        position: "absolute",
        top: 0,
        right: -PIXEL_SIZE,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerTR2: {
        position: "absolute",
        top: -PIXEL_SIZE,
        right: 0,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerTR3: {
        position: "absolute",
        top: PIXEL_SIZE,
        right: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },

    pixelCornerBL1: {
        position: "absolute",
        bottom: 0,
        left: -PIXEL_SIZE,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerBL2: {
        position: "absolute",
        bottom: -PIXEL_SIZE,
        left: 0,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerBL3: {
        position: "absolute",
        bottom: PIXEL_SIZE,
        left: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },

    pixelCornerBR1: {
        position: "absolute",
        bottom: 0,
        right: -PIXEL_SIZE,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerBR2: {
        position: "absolute",
        bottom: -PIXEL_SIZE,
        right: 0,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },
    pixelCornerBR3: {
        position: "absolute",
        bottom: PIXEL_SIZE,
        right: -PIXEL_SIZE * 2,
        width: PIXEL_SIZE,
        height: PIXEL_SIZE,
        backgroundColor: GREEN,
    },

    bottomBar: {
        paddingHorizontal: 26,
        paddingBottom: 44,
        backgroundColor: "#FFFFFF",
    },

    changeBtn: {
        backgroundColor: GREEN,
        paddingVertical: 14,
        alignItems: "center",
    },
    changeBtnText: {
        fontSize: 20,
        color: "#FFFFFF",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },
});
