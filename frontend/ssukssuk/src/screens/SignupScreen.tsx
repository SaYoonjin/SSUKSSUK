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
  Alert,
} from 'react-native';

// [변경] Axios 클라이언트 임포트 (파일 경로에 맞춰 수정하세요)
import client from '../api';

const LOGO = require('../assets/logo.png');

// 응답 타입 정의
type SignupResponse =
  | { success: true; message: string }
  | { code: string; message: string; details?: { field?: string } };

// [변경] 상수는 client에 설정되어 있으므로 경로만 남김
const SIGNUP_PATH = '/auth/signup';

export default function SignupScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. 유효성 검사 로직 (기존과 동일)

  // 이메일 유효성 검사
  const isEmailValid = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  // [조건 1] 길이: 8자 ~ 20자
  const isPwLenValid = useMemo(() => {
    return password.length >= 8 && password.length <= 20;
  }, [password]);

  // [조건 2] 숫자 포함
  const isPwHasNumber = useMemo(() => {
    return /\d/.test(password);
  }, [password]);

  // [조건 3] 특수문자 포함
  const isPwHasSpecial = useMemo(() => {
    return /[!@#$%^&*?_~-]/.test(password);
  }, [password]);

  // 비밀번호 최종 유효성
  const isPasswordValid = isPwLenValid && isPwHasNumber && isPwHasSpecial;

  // 닉네임 유효성
  const isNicknameValid = useMemo(() => nickname.trim().length > 0, [nickname]);

  // 2. 가입하기 버튼 핸들러
  const handleSignup = async () => {
    if (!isEmailValid) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return;
    }

    if (!isPasswordValid) {
      if (!isPwLenValid) {
        Alert.alert('알림', '비밀번호는 8~20자 사이여야 합니다.');
      } else if (!isPwHasNumber) {
        Alert.alert('알림', '비밀번호에 숫자가 최소 1개 포함되어야 합니다.');
      } else if (!isPwHasSpecial) {
        Alert.alert(
          '알림',
          '비밀번호에 특수문자(!@#$%^&*?_~-)가 포함되어야 합니다.',
        );
      }
      return;
    }

    if (!isNicknameValid) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // [변경] Axios 사용
      // Content-Type 헤더나 JSON.stringify 불필요 (자동 처리됨)
      const res = await client.post<SignupResponse>(SIGNUP_PATH, {
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      });

      const json = res.data;

      // Axios는 200대 상태코드면 여기로 옴.
      // 서버 로직상 success 필드를 체크
      if ('success' in json && json.success) {
        Alert.alert('환영합니다!', '회원가입이 완료되었습니다.', [
          {
            text: '로그인하러 가기',
            onPress: () => navigation.navigate('Login'), // 혹은 navigation.goBack()
          },
        ]);
        return;
      }

      // 200 OK지만 success가 false인 경우 (비즈니스 로직 에러)
      // 타입 가드 등을 통해 message 접근
      const msg = (json as any).message || '회원가입 중 오류가 발생했습니다.';
      setErrorMsg(msg);
    } catch (error: any) {
      console.error(error);

      // [변경] Axios 에러 핸들링
      if (error.response && error.response.data) {
        // 서버에서 400, 409 등을 리턴하며 에러 메시지를 보낸 경우
        const serverMsg = error.response.data.message;
        setErrorMsg(serverMsg || '회원가입 실패');
      } else {
        setErrorMsg('서버와의 통신에 실패했습니다.');
      }
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
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>쑥쑥</Text>
        </View>

        <View style={styles.alertSlot}>
          {errorMsg ? <PixelAlert text={errorMsg} /> : null}
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
        <Text style={[styles.label, styles.marginTop18]}>비밀번호</Text>
        <PixelInput
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호"
          secureTextEntry
          maxLength={20}
        />

        {/* 비밀번호 조건 체크리스트 */}
        <View style={styles.criteriaContainer}>
          <CriteriaItem satisfied={isPwLenValid} text="8~20자 이내" />
          <CriteriaItem satisfied={isPwHasNumber} text="숫자 포함" />
          <CriteriaItem satisfied={isPwHasSpecial} text="특수문자 포함" />
        </View>

        {/* 닉네임 */}
        <Text style={[styles.label, styles.marginTop18]}>닉네임</Text>
        <PixelInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="닉네임"
          maxLength={50}
        />

        {/* 가입하기 버튼 */}
        <Pressable
          onPress={handleSignup}
          style={[styles.signupBtn, loading && styles.btnDisabled]}
          disabled={loading}
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

// ---------------- 컴포넌트 및 스타일 정의 (기존과 동일) ----------------

function CriteriaItem({
  satisfied,
  text,
}: {
  satisfied: boolean;
  text: string;
}) {
  return (
    <View style={styles.criteriaItem}>
      <Text
        style={[
          styles.criteriaIcon,
          satisfied ? styles.textSuccess : styles.textFail,
        ]}
      >
        {satisfied ? 'v' : 'x'}
      </Text>
      <Text
        style={[
          styles.criteriaText,
          satisfied ? styles.textSuccess : styles.textFail,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function PixelAlert({ text }: { text: string }) {
  return (
    <View style={styles.pixelAlertContainer}>
      <View style={styles.alertBgUnderlay} />
      <BorderPixels color={ERROR_RED} />
      <Text style={styles.alertText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function PixelInput(props: any) {
  return (
    <View style={styles.pixelInputContainer}>
      <BorderPixels color={GREEN} />
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#A6B79D"
      />
    </View>
  );
}

const BorderPixels = ({ color }: { color: string }) => (
  <>
    <View style={[styles.pixelTop, { backgroundColor: color }]} />
    <View style={[styles.pixelBottom, { backgroundColor: color }]} />
    <View style={[styles.pixelLeft, { backgroundColor: color }]} />
    <View style={[styles.pixelRight, { backgroundColor: color }]} />
    <View style={[styles.cornerTL, { backgroundColor: color }]} />
    <View style={[styles.cornerTR, { backgroundColor: color }]} />
    <View style={[styles.cornerBL, { backgroundColor: color }]} />
    <View style={[styles.cornerBR, { backgroundColor: color }]} />
  </>
);

const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const ERROR_RED = '#E04B4B';
const SUCCESS_GREEN = '#2E5A35';
const ERROR_BG = '#FFE9E9';
const PIXEL_SIZE = 4;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDE9' },
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

  marginTop18: { marginTop: 18 },

  criteriaContainer: {
    flexDirection: 'column',
    marginTop: 10,
    marginLeft: 4,
    gap: 6,
  },
  criteriaItem: { flexDirection: 'row', alignItems: 'center' },

  criteriaIcon: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    marginRight: 6,
  },
  criteriaText: { fontSize: 16, fontFamily: 'NeoDunggeunmoPro-Regular' },

  textSuccess: { color: SUCCESS_GREEN },
  textFail: { color: ERROR_RED },

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

  pixelInputContainer: {
    position: 'relative',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 20,
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
  },
  pixelBottom: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
  pixelLeft: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
  },
});
