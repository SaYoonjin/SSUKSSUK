import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

// 1. 서버의 실제 응답 구조에 맞게 타입 정의 수정
type LoginResponse = {
  success: boolean;
  data: {
    userId: number;
    email: string;
    isAdmin: boolean;
    accessToken: string;
    refreshToken: string;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
};

const API_BASE_URL = "https://i14a103.p.ssafy.io/api";
const LOGIN_PATH = "/auth/login";
const COMMON_ERROR_TEXT = "이메일이나 비밀번호를 확인해주세요";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !loading;
  }, [email, password, loading]);

  const validateEmail = (value: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value.trim());
  };

  const onChangeEmail = (v: string) => {
    setEmail(v);
    if (errorMsg) setErrorMsg("");
  };

  const onChangePassword = (v: string) => {
    setPassword(v);
    if (errorMsg) setErrorMsg("");
  };

  const handleLogin = async () => {
    const e = email.trim();

    if (!validateEmail(e) || password.length < 1) {
      setErrorMsg(COMMON_ERROR_TEXT);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      // 2. EC2 서버로 POST 요청 전송
      const res = await fetch(`${API_BASE_URL}${LOGIN_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: e,
          password: password,
        }),
      });

      const json: LoginResponse = await res.json();

      // 3. 서버 응답 결과에 따른 분기 처리
      if (json.success && json.data) {
        // 로그인 성공 시 토큰 및 유저 정보 확인
        console.log("로그인 성공! 유저 ID:", json.data.userId);
        console.log("액세스 토큰:", json.data.accessToken);

        // 메인 화면으로 이동
        navigation.replace("Main");
      } else {
        // 서버에서 전달한 에러 메시지가 있으면 사용, 없으면 기본 에러 출력
        setErrorMsg(json.error?.message || COMMON_ERROR_TEXT);
      }
    } catch (err) {
      console.error("네트워크 에러:", err);
      setErrorMsg("서버와 통신할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>쑥쑥</Text>
        </View>

        <View style={styles.alertSlot}>
          {errorMsg ? <PixelAlert text={errorMsg} /> : null}
        </View>

        <Text style={styles.label}>이메일</Text>
        <PixelInput value={email} onChangeText={onChangeEmail} placeholder="email@example.com" keyboardType="email-address" autoCapitalize="none" />

        <Text style={[styles.label, { marginTop: 18 }]}>비밀번호</Text>
        <PixelInput value={password} onChangeText={onChangePassword} placeholder="비밀번호" secureTextEntry />

        <View style={styles.row}>
          <Pressable style={styles.checkRow} onPress={() => setRememberMe((v) => !v)}>
            <View style={[styles.checkbox, rememberMe && styles.checkboxOn]}>
              {rememberMe ? <View style={styles.checkboxDot} /> : null}
            </View>
            <Text style={styles.smallText}>아이디 저장</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("FindPassword")}>
            <Text style={styles.smallLink}>비밀번호 찾기</Text>
          </Pressable>
        </View>

        <Pressable onPress={handleLogin} disabled={!canSubmit} style={[styles.loginBtn, !canSubmit && styles.btnDisabled]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.loginBtnText}>로그인</Text>}
        </Pressable>

        <View style={styles.divider} />
        <Text style={styles.helper}>아직 쑥쑥에{"\n"}가입하지 않으셨나요?</Text>
        <Pressable onPress={() => navigation.navigate("Signup")} style={styles.signupBtn}>
          <Text style={styles.signupBtnText}>회원가입</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- 하단 디자인 컴포넌트 및 스타일 (기존과 동일) ---

function PixelAlert({ text }: { text: string }) {
  return (
    <View style={styles.pixelAlertContainer}>
      <View style={styles.alertBgUnderlay} />
      <View style={styles.alertPixelTop} />
      <View style={styles.alertPixelBottom} />
      <View style={styles.alertPixelLeft} />
      <View style={styles.alertPixelRight} />
      <View style={styles.alertCornerTL1} /><View style={styles.alertCornerTL2} /><View style={styles.alertCornerTL3} />
      <View style={styles.alertCornerTR1} /><View style={styles.alertCornerTR2} /><View style={styles.alertCornerTR3} />
      <View style={styles.alertCornerBL1} /><View style={styles.alertCornerBL2} /><View style={styles.alertCornerBL3} />
      <View style={styles.alertCornerBR1} /><View style={styles.alertCornerBR2} /><View style={styles.alertCornerBR3} />
      <Text style={styles.alertText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function PixelInput(props: any) {
  return (
    <View style={styles.pixelInputContainer}>
      <View style={styles.pixelTop} /><View style={styles.pixelBottom} />
      <View style={styles.pixelLeft} /><View style={styles.pixelRight} />
      <View style={styles.pixelCornerTL1} /><View style={styles.pixelCornerTL2} /><View style={styles.pixelCornerTL3} />
      <View style={styles.pixelCornerTR1} /><View style={styles.pixelCornerTR2} /><View style={styles.pixelCornerTR3} />
      <View style={styles.pixelCornerBL1} /><View style={styles.pixelCornerBL2} /><View style={styles.pixelCornerBL3} />
      <View style={styles.pixelCornerBR1} /><View style={styles.pixelCornerBR2} /><View style={styles.pixelCornerBR3} />
      <TextInput {...props} style={styles.input} placeholderTextColor="#A6B79D" />
    </View>
  );
}

const GREEN = "#2E5A35";
const LIGHT_GREEN = "#75A743";
const ERROR_RED = "#D25353";
const ERROR_BG = "#FFE9E9";
const PIXEL_SIZE = 4;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#EDEDE9" },
  container: { paddingHorizontal: 22, paddingTop: 100, paddingBottom: 30 },
  header: { alignItems: "center", marginBottom: 26 },
  logo: { width: 120, height: 120, marginBottom: 10 },
  brand: { fontSize: 34, color: LIGHT_GREEN, fontFamily: "NeoDunggeunmoPro-Regular" },
  label: { fontSize: 18, color: LIGHT_GREEN, fontFamily: "NeoDunggeunmoPro-Regular", marginBottom: 8, marginLeft: 4 },
  alertSlot: { height: 34, marginBottom: 10, justifyContent: "center" },
  pixelAlertContainer: { position: "relative", height: 34, justifyContent: "center", paddingHorizontal: 14, marginHorizontal: PIXEL_SIZE * 2 },
  alertBgUnderlay: { position: "absolute", top: 0, bottom: 0, left: -PIXEL_SIZE, right: -PIXEL_SIZE, backgroundColor: ERROR_BG, zIndex: 0 },
  alertText: { fontSize: 14, color: ERROR_RED, fontFamily: "NeoDunggeunmoPro-Regular", zIndex: 10 },
  alertPixelTop: { position: "absolute", top: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 5 },
  alertPixelBottom: { position: "absolute", bottom: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 5 },
  alertPixelLeft: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 5 },
  alertPixelRight: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 5 },
  alertCornerTL1: { position: "absolute", top: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerTL2: { position: "absolute", top: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerTL3: { position: "absolute", top: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerTR1: { position: "absolute", top: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerTR2: { position: "absolute", top: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerTR3: { position: "absolute", top: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBL1: { position: "absolute", bottom: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBL2: { position: "absolute", bottom: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBL3: { position: "absolute", bottom: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBR1: { position: "absolute", bottom: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBR2: { position: "absolute", bottom: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  alertCornerBR3: { position: "absolute", bottom: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: ERROR_RED, zIndex: 6 },
  pixelInputContainer: { position: "relative", height: 54, justifyContent: "center", paddingHorizontal: 20, backgroundColor: "#edede9", marginHorizontal: PIXEL_SIZE * 2 },
  input: { fontSize: 20, color: GREEN, fontFamily: "NeoDunggeunmoPro-Regular", paddingVertical: 0, zIndex: 10 },
  pixelTop: { position: "absolute", top: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelBottom: { position: "absolute", bottom: -PIXEL_SIZE, left: PIXEL_SIZE, right: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelLeft: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: GREEN },
  pixelRight: { position: "absolute", top: PIXEL_SIZE, bottom: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTL1: { position: "absolute", top: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTL2: { position: "absolute", top: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTL3: { position: "absolute", top: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTR1: { position: "absolute", top: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTR2: { position: "absolute", top: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerTR3: { position: "absolute", top: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBL1: { position: "absolute", bottom: 0, left: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBL2: { position: "absolute", bottom: -PIXEL_SIZE, left: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBL3: { position: "absolute", bottom: PIXEL_SIZE, left: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBR1: { position: "absolute", bottom: 0, right: -PIXEL_SIZE, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBR2: { position: "absolute", bottom: -PIXEL_SIZE, right: 0, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  pixelCornerBR3: { position: "absolute", bottom: PIXEL_SIZE, right: -PIXEL_SIZE * 2, width: PIXEL_SIZE, height: PIXEL_SIZE, backgroundColor: GREEN },
  row: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 18, height: 18, borderWidth: 2, borderColor: LIGHT_GREEN, alignItems: "center", justifyContent: "center" },
  checkboxOn: { backgroundColor: "#EAF4E2" },
  checkboxDot: { width: 8, height: 8, backgroundColor: LIGHT_GREEN },
  smallText: { fontSize: 14, color: LIGHT_GREEN, fontFamily: "NeoDunggeunmoPro-Regular" },
  smallLink: { fontSize: 14, color: GREEN, fontFamily: "NeoDunggeunmoPro-Regular", textDecorationLine: "underline" },
  loginBtn: { marginTop: 18, backgroundColor: LIGHT_GREEN, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 20, color: "#edede9", fontFamily: "NeoDunggeunmoPro-Regular" },
  divider: { height: 2, backgroundColor: GREEN, marginVertical: 20, opacity: 0.7 },
  helper: { textAlign: "center", fontSize: 16, color: GREEN, fontFamily: "NeoDunggeunmoPro-Regular", marginBottom: 14, lineHeight: 22 },
  signupBtn: { backgroundColor: GREEN, paddingVertical: 14, alignItems: "center" },
  signupBtnText: { fontSize: 20, color: "#edede9", fontFamily: "NeoDunggeunmoPro-Regular" },
});