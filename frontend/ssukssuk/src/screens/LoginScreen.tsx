import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    Pressable,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from "react-native";

// 로그인 유지(토큰 저장) 붙일 때 사용
// 설치: npm i react-native-keychain
// import * as Keychain from "react-native-keychain";

type LoginResponse =
    | {
    success: true;
    message: string;
    data: { accessToken: string; refreshToken: string; expiresIn: number };
}
    | {
    code: string;
    message: string;
    details?: { field?: string };
};

const API_BASE_URL = "http://YOUR_SERVER_URL"; // TODO: 백엔드 URL로 교체 (예: http://10.0.2.2:8080)
const LOGIN_PATH = "/auth/login";

export default function LoginScreen({ navigation }: any) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const canSubmit = useMemo(() => {
        return email.trim().length > 0 && password.length > 0 && !loading;
    }, [email, password, loading]);

    const validateEmail = (value: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(value.trim());
    };

    const handleLogin = async () => {
        const e = email.trim();
        if (!validateEmail(e)) {
            Alert.alert("로그인 실패", "이메일 형식이 올바르지 않습니다.");
            return;
        }
        if (password.length < 1) {
            Alert.alert("로그인 실패", "비밀번호를 입력해 주세요.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: e,
                    password,
                    rememberMe,
                }),
            });

            const json: LoginResponse = await res.json();

            if ("success" in json && json.success) {
                const { accessToken, refreshToken } = json.data;

                // 로그인 유지 저장(나중에 Keychain 설치 후 주석 해제)
                // if (rememberMe) {
                //   await Keychain.setGenericPassword("refreshToken", refreshToken, {
                //     service: "ssukssuk.refreshToken",
                //   });
                // }

                // TODO: accessToken을 전역 상태로 저장하고, Main으로 이동
                Alert.alert("성공", "로그인 성공");
                navigation.replace("Main");
                return;
            }

            Alert.alert("로그인 실패", json.message || "로그인에 실패했습니다.");
        } catch (err) {
            Alert.alert("오류", "로그인 처리 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                {/* 로고/타이틀 */}
                <View style={styles.header}>
                    <Image
                        source={require("../assets/logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.brand}>쑥쑥</Text>
                </View>

                {/* 이메일 */}
                <Text style={styles.label}>이메일</Text>
                <PixelInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                {/* 비밀번호 */}
                <Text style={[styles.label, { marginTop: 18 }]}>비밀번호</Text>
                <PixelInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="비밀번호"
                    secureTextEntry
                />

                {/* 하단 옵션 */}
                <View style={styles.row}>
                    <Pressable
                        style={styles.checkRow}
                        onPress={() => setRememberMe((v) => !v)}
                    >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
                            {rememberMe ? <View style={styles.checkboxDot} /> : null}
                        </View>
                        <Text style={styles.smallText}>아이디 저장</Text>
                    </Pressable>

                    <Pressable onPress={() => navigation.navigate("FindPassword")}>
                        <Text style={styles.smallLink}>비밀번호 찾기</Text>
                    </Pressable>
                </View>

                {/* 로그인 버튼 */}
                <Pressable
                    onPress={handleLogin}
                    disabled={!canSubmit}
                    style={[styles.loginBtn, !canSubmit && styles.btnDisabled]}
                >
                    {loading ? (
                        <ActivityIndicator />
                    ) : (
                        <Text style={styles.loginBtnText}>로그인</Text>
                    )}
                </Pressable>

                {/* 구분선 */}
                <View style={styles.divider} />

                <Text style={styles.helper}>
                    아직 쑥쑥에{`\n`}가입하지 않으셨나요?
                </Text>

                {/* 회원가입 */}
                <Pressable
                    onPress={() => navigation.navigate("Signup")}
                    style={styles.signupBtn}
                >
                    <Text style={styles.signupBtnText}>회원가입</Text>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

function PixelInput(props: any) {
    return (
        <View style={styles.pixelFrame}>
            {/* 바깥 모서리 픽셀 */}
            <View style={[styles.pixelCorner, styles.tl]} />
            <View style={[styles.pixelCorner, styles.tr]} />
            <View style={[styles.pixelCorner, styles.bl]} />
            <View style={[styles.pixelCorner, styles.br]} />

            <View style={styles.pixelInnerBox}>
                {/* 안쪽 모서리 픽셀 */}
                <View style={[styles.pixelCorner2, styles.tl2]} />
                <View style={[styles.pixelCorner2, styles.tr2]} />
                <View style={[styles.pixelCorner2, styles.bl2]} />
                <View style={[styles.pixelCorner2, styles.br2]} />

                <TextInput
                    {...props}
                    style={styles.input}
                    placeholderTextColor="#A6B79D"
                />
            </View>
        </View>
    );
}

const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#FFFFFF" },

    container: {
        paddingHorizontal: 22,
        paddingTop: 100,
        paddingBottom: 30,
    },

    header: {
        alignItems: "center",
        marginBottom: 26,
    },
    logo: { width: 120, height: 120, marginBottom: 10 },

    brand: {
        fontSize: 34,
        color: LIGHT_GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
    },

    label: {
        fontSize: 18,
        color: LIGHT_GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        marginBottom: 10,
    },

    // ✅ 픽셀 테두리(계단 모서리)
    pixelFrame: {
        position: "relative",
        borderWidth: 4,
        borderColor: GREEN,
        padding: 6,
        borderRadius: 0,
        backgroundColor: "#fff",
    },
    pixelInnerBox: {
        position: "relative",
        borderWidth: 2,
        borderColor: GREEN,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 0,
        backgroundColor: "#fff",
    },

    // 바깥 모서리 픽셀(큰 블럭)
    pixelCorner: {
        position: "absolute",
        width: 10,
        height: 10,
        backgroundColor: GREEN,
    },
    tl: { top: -4, left: -4 },
    tr: { top: -4, right: -4 },
    bl: { bottom: -4, left: -4 },
    br: { bottom: -4, right: -4 },

    // 안쪽 모서리 픽셀(작은 블럭)
    pixelCorner2: {
        position: "absolute",
        width: 6,
        height: 6,
        backgroundColor: GREEN,
    },
    tl2: { top: -2, left: -2 },
    tr2: { top: -2, right: -2 },
    bl2: { bottom: -2, left: -2 },
    br2: { bottom: -2, right: -2 },

    input: {
        fontSize: 18,
        color: GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        paddingVertical: 0,
    },

    row: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },

    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: LIGHT_GREEN,
        alignItems: "center",
        justifyContent: "center",
    },
    checkboxOn: {
        backgroundColor: "#EAF4E2",
    },
    checkboxDot: {
        width: 8,
        height: 8,
        backgroundColor: LIGHT_GREEN,
    },

    smallText: {
        fontSize: 14,
        color: LIGHT_GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
    },
    smallLink: {
        fontSize: 14,
        color: GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        textDecorationLine: "underline",
    },

    loginBtn: {
        marginTop: 18,
        backgroundColor: LIGHT_GREEN,
        paddingVertical: 14,
        alignItems: "center",
    },
    btnDisabled: { opacity: 0.6 },

    loginBtnText: {
        fontSize: 20,
        color: "#FFFFFF",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },

    divider: {
        height: 2,
        backgroundColor: GREEN,
        marginVertical: 20,
        opacity: 0.7,
    },

    helper: {
        textAlign: "center",
        fontSize: 16,
        color: GREEN,
        fontFamily: "NeoDunggeunmoPro-Regular",
        marginBottom: 14,
        lineHeight: 22,
    },

    signupBtn: {
        backgroundColor: GREEN,
        paddingVertical: 14,
        alignItems: "center",
    },
    signupBtnText: {
        fontSize: 20,
        color: "#FFFFFF",
        fontFamily: "NeoDunggeunmoPro-Regular",
    },
});
