import React, { useMemo, useState } from 'react';
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
} from 'react-native';

type SignupResponse =
  | { success: true; message: string }
  | { code: string; message: string; details?: { field?: string } };

const API_BASE_URL = 'http://YOUR_SERVER_URL';
const SIGNUP_PATH = '/auth/signup';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 입력값 유효성 검사
  const isEmailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email],
  );
  const isPasswordValid = useMemo(
    () => /^(?=.*[!@#$%^&*])(?=.{8,})/.test(password),
    [password],
  );
  const isNicknameValid = useMemo(() => nickname.trim().length > 0, [nickname]);

  const canSubmit = useMemo(() => {
    return isEmailValid && isPasswordValid && isNicknameValid && !loading;
  }, [isEmailValid, isPasswordValid, isNicknameValid, loading]);

  // const handleSignup = async () => {
  //   if (!canSubmit) return;
  //
  //   setLoading(true);
  //   setErrorMsg('');
  //
  //   try {
  //     const res = await fetch(`${API_BASE_URL}${SIGNUP_PATH}`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         email: email.trim(),
  //         password,
  //         nickname: nickname.trim(),
  //       }),
  //     });
  //     const json: SignupResponse = await res.json();
  //
  //     if ('success' in json && json.success) {
  //       navigation.navigate('Login');
  //       return;
  //     }
  //     setErrorMsg(json.message || '회원가입 중 오류가 발생했습니다.');
  //   } catch (err) {
  //     console.error(err);
  //     setErrorMsg('서버와의 통신에 실패했습니다.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };
      const handleSignup = async () => {
        if (!canSubmit) return;

        setLoading(true);
        setErrorMsg('');

        try {
          const res = await fetch(`${API_BASE_URL}${SIGNUP_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password,
              nickname: nickname.trim(),
            }),
          });

          const json: SignupResponse = await res.json();

          // 지금은 테스트/플로우 연결용: 성공 여부 상관없이 InitialSetup으로 이동
          navigation.replace('InitialSetup');
          return;

          /**
           * 원래 로직 (나중에 다시 되돌릴 때 쓰라고 주석으로 남김)
           *
           * if ('success' in json && json.success) {
           *   navigation.replace('InitialSetup'); // 또는 Login으로 보내고 싶으면 'Login'
           *   return;
           * }
           * setErrorMsg(json.message || '회원가입 중 오류가 발생했습니다.');
           */
        } catch (err) {
          console.error(err);

          // 통신 실패여도 지금은 플로우 확인이 목적이라 그냥 넘어가게 처리
          navigation.replace('InitialSetup');
          return;

          /**
           * 원래 로직 (주석 유지)
           *
           * setErrorMsg('서버와의 통신에 실패했습니다.');
           */
        } finally {
          setLoading(false);
        }
      };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>쑥쑥</Text>
        </View>

        {/* 알림 메시지 영역 */}
        <View style={styles.alertSlot}>
          {errorMsg ? <PixelAlert text={errorMsg} /> : null}
        </View>

        <Text style={styles.label}>이메일</Text>
        <PixelInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[styles.label, { marginTop: 18 }]}>비밀번호</Text>
        <PixelInput
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
        />
        <Text style={styles.helperText}>8자 이상 입력, 특수기호 포함</Text>

        <Text style={[styles.label, { marginTop: 18 }]}>닉네임</Text>
        <PixelInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임"
        />

        <Pressable
          onPress={handleSignup}
          disabled={!canSubmit}
          style={[styles.signupBtn, !canSubmit && styles.btnDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.signupBtnText}>가입하기</Text>
          )}
        </Pressable>

        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>뒤로 가기</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** 픽셀 아트 스타일 컴포넌트 **/

function PixelAlert({ text }: { text: string }) {
  return (
    <View style={styles.pixelAlertContainer}>
      <View style={styles.alertBgUnderlay} />
      <View style={styles.alertPixelTop} />
      <View style={styles.alertPixelBottom} />
      <View style={styles.alertPixelLeft} />
      <View style={styles.alertPixelRight} />
      <View style={styles.alertCornerTL1} />
      <View style={styles.alertCornerTL2} />
      <View style={styles.alertCornerTL3} />
      <View style={styles.alertCornerTR1} />
      <View style={styles.alertCornerTR2} />
      <View style={styles.alertCornerTR3} />
      <View style={styles.alertCornerBL1} />
      <View style={styles.alertCornerBL2} />
      <View style={styles.alertCornerBL3} />
      <View style={styles.alertCornerBR1} />
      <View style={styles.alertCornerBR2} />
      <View style={styles.alertCornerBR3} />
      <Text style={styles.alertText} numberOfLines={1}>
        {text}
      </Text>
    </View>
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

const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const ERROR_RED = '#E04B4B';
const ERROR_BG = '#FFE9E9';
const PIXEL_SIZE = 4;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { paddingHorizontal: 22, paddingTop: 60, paddingBottom: 30 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 100, height: 100, marginBottom: 10 },
  brand: {
    fontSize: 34,
    color: LIGHT_GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },
  label: {
    fontSize: 18,
    color: LIGHT_GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    marginBottom: 8,
    marginLeft: 4,
  },
  alertSlot: { height: 34, marginBottom: 10, justifyContent: 'center' },

  // Pixel Alert 스타일
  pixelAlertContainer: {
    position: 'relative',
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 14,
    marginHorizontal: PIXEL_SIZE * 2,
  },
  alertBgUnderlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -PIXEL_SIZE,
    right: -PIXEL_SIZE,
    backgroundColor: ERROR_BG,
    zIndex: 0,
  },
  alertText: {
    fontSize: 14,
    color: ERROR_RED,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    zIndex: 10,
  },
  alertPixelTop: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 5,
  },
  alertPixelBottom: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 5,
  },
  alertPixelLeft: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 5,
  },
  alertPixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 5,
  },
  alertCornerTL1: {
    position: 'absolute',
    top: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerTL2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerTL3: {
    position: 'absolute',
    top: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerTR1: {
    position: 'absolute',
    top: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerTR2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerTR3: {
    position: 'absolute',
    top: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBL1: {
    position: 'absolute',
    bottom: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBL2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBL3: {
    position: 'absolute',
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBR1: {
    position: 'absolute',
    bottom: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBR2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },
  alertCornerBR3: {
    position: 'absolute',
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: ERROR_RED,
    zIndex: 6,
  },

  // Pixel Input 스타일
  pixelInputContainer: {
    position: 'relative',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    marginHorizontal: PIXEL_SIZE * 2,
  },
  input: {
    fontSize: 20,
    color: GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    paddingVertical: 0,
    zIndex: 10,
  },
  pixelTop: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelBottom: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelLeft: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTL1: {
    position: 'absolute',
    top: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTL2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTL3: {
    position: 'absolute',
    top: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTR1: {
    position: 'absolute',
    top: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTR2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerTR3: {
    position: 'absolute',
    top: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBL1: {
    position: 'absolute',
    bottom: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBL2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBL3: {
    position: 'absolute',
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBR1: {
    position: 'absolute',
    bottom: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBR2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },
  pixelCornerBR3: {
    position: 'absolute',
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
  },

  helperText: {
    fontSize: 13,
    color: GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    marginTop: 8,
    marginLeft: 4,
  },
  signupBtn: {
    marginTop: 30,
    backgroundColor: GREEN,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  signupBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },
  backBtn: { marginTop: 20, alignItems: 'center' },
  backBtnText: {
    fontSize: 14,
    color: GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    textDecorationLine: 'underline',
  },
});
