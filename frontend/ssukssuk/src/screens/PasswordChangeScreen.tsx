import React, { useState, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';

// [변경] Axios 클라이언트 임포트
import client from '../api';

// 상수 설정 (API_BASE_URL 제거됨)
const PIXEL_SIZE = 4;
const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const CARD_BG = '#fafaf6';

// 응답 타입 정의
type PasswordChangeResponse = {
  success: boolean;
  error?: {
    message: string;
  };
};

export default function PasswordEditScreen({ navigation }: any) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPwConfirm, setNewPwConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // [삭제] getToken 함수 불필요 (Axios 인터셉터가 처리)

  const handleSubmit = async () => {
    // 1. 클라이언트 유효성 검사
    if (!currentPw.trim() || !newPw.trim() || !newPwConfirm.trim()) {
      Alert.alert('알림', '모든 항목을 입력해 주세요.');
      return;
    }
    if (newPw !== newPwConfirm) {
      Alert.alert('알림', '새로운 비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    if (currentPw === newPw) {
      Alert.alert(
        '알림',
        '새 비밀번호는 기존 비밀번호와 다르게 설정해 주세요.',
      );
      return;
    }

    // 2. 서버 통신 시작
    setLoading(true);
    try {
      // [변경] Axios 사용: PATCH 메서드
      // 헤더 설정, JSON 변환 자동 처리
      const res = await client.patch<PasswordChangeResponse>('/auth/password', {
        currentPassword: currentPw,
        newPassword: newPw,
        confirmPassword: newPwConfirm,
      });

      const json = res.data;

      if (json.success) {
        Alert.alert('완료', '비밀번호가 성공적으로 변경되었습니다.', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // 200 OK지만 성공하지 못한 경우 (비즈니스 로직 에러)
        Alert.alert(
          '변경 실패',
          json.error?.message || '비밀번호 변경에 실패했습니다.',
        );
      }
    } catch (error: any) {
      console.error(error);
      // [변경] Axios 에러 핸들링
      if (error.response && error.response.data) {
        // 서버에서 보낸 에러 메시지가 있는 경우
        const msg =
          error.response.data.error?.message ||
          error.response.data.message ||
          '비밀번호 변경에 실패했습니다.';
        Alert.alert('변경 실패', msg);
      } else {
        Alert.alert('통신 오류', '서버와 연결할 수 없습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* 로딩 인디케이터 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          showsVerticalScrollIndicator={false}
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

          <View style={{ height: 140 }} />
        </ScrollView>

        {/* 하단 고정 버튼 */}
        <View style={styles.bottomBar}>
          <PixelButton
            text="변경하기"
            onPress={handleSubmit}
            disabled={loading} // 로딩 중 버튼 비활성화
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------- 픽셀 UI 컴포넌트 (기존과 동일) ----------------

function PixelBox({ children, style }: any) {
  return (
    <View style={[styles.pixelBoxContainer, style]}>
      <View style={styles.pixelBgUnderlay} />
      <View
        pointerEvents="none"
        style={[
          styles.shadeLeft,
          { left: -PIXEL_SIZE, width: PIXEL_SIZE, top: 0, bottom: 0 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.shadeRight,
          { right: -PIXEL_SIZE, width: PIXEL_SIZE, top: 0, bottom: 0 },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.shadeLeft,
          {
            left: -PIXEL_SIZE,
            top: PIXEL_SIZE,
            bottom: PIXEL_SIZE,
            opacity: 0.03,
            width: PIXEL_SIZE * 3,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.shadeRight,
          {
            right: -PIXEL_SIZE,
            top: PIXEL_SIZE,
            bottom: PIXEL_SIZE,
            opacity: 0.03,
            width: PIXEL_SIZE * 3,
          },
        ]}
      />
      <View style={styles.pixelTop} />
      <View style={styles.pixelBottom} />
      <View style={styles.pixelLeft} />
      <View style={styles.pixelRight} />
      <View style={styles.pixelCornerTL1} />
      <View style={styles.pixelCornerTL2} />
      <View style={styles.pixelCornerTR1} />
      <View style={styles.pixelCornerTR2} />
      <View style={styles.pixelCornerBL1} />
      <View style={styles.pixelCornerBL2} />
      <View style={styles.pixelCornerBR1} />
      <View style={styles.pixelCornerBR2} />
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

function PixelButton({ text, onPress, disabled }: any) {
  const v = useRef(new Animated.Value(0)).current;

  // disabled 상태일 때는 애니메이션 실행 안 함
  const pressIn = () =>
    !disabled &&
    Animated.timing(v, {
      toValue: 1,
      duration: 60,
      useNativeDriver: false,
    }).start();
  const pressOut = () =>
    !disabled &&
    Animated.timing(v, {
      toValue: 0,
      duration: 80,
      useNativeDriver: false,
    }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.changeBtn,
          disabled && { opacity: 0.6 }, // 비활성화 스타일
          {
            borderBottomWidth: v.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 2],
            }) as any,
            borderRightWidth: v.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 2],
            }) as any,
            marginTop: v.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 2],
            }) as any,
          },
        ]}
      >
        {/* 로딩 중일 때 텍스트 대신 작은 인디케이터를 띄울 수도 있음 */}
        <Text style={styles.changeBtnText}>{text}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ---------------- 스타일 시트 (기존과 동일) ----------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDEDE9' },
  screen: { flex: 1, paddingHorizontal: 26, paddingTop: 45 },

  // [추가] 로딩 오버레이
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  backBtn: { paddingRight: 10, paddingVertical: 4 },
  backChevron: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
    lineHeight: 34,
  },
  headerTitle: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },

  content: { paddingBottom: 20, marginTop: 40 },
  label: {
    fontSize: 18,
    color: LIGHT_GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    marginBottom: 8,
    marginLeft: 4,
  },

  pixelBoxContainer: {
    position: 'relative',
    marginHorizontal: PIXEL_SIZE * 2,
    marginVertical: PIXEL_SIZE,
  },
  pixelBgUnderlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: -PIXEL_SIZE,
    right: -PIXEL_SIZE,
    backgroundColor: CARD_BG,
    zIndex: 0,
  },
  cardInner: {
    paddingHorizontal: 15,
    height: 54,
    justifyContent: 'center',
    zIndex: 10,
  },

  shadeLeft: {
    position: 'absolute',
    backgroundColor: '#000',
    opacity: 0.05,
    zIndex: 1,
  },
  shadeRight: {
    position: 'absolute',
    backgroundColor: '#000',
    opacity: 0.05,
    zIndex: 1,
  },

  pixelTop: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 5,
  },
  pixelBottom: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 5,
  },
  pixelLeft: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 5,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 5,
  },

  pixelCornerTL1: {
    position: 'absolute',
    top: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerTL2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerTR1: {
    position: 'absolute',
    top: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerTR2: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerBL1: {
    position: 'absolute',
    bottom: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerBL2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerBR1: {
    position: 'absolute',
    bottom: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },
  pixelCornerBR2: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: GREEN,
    zIndex: 6,
  },

  input: {
    fontSize: 20,
    color: GREEN,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    padding: 0,
  },

  bottomBar: {
    paddingHorizontal: 26,
    paddingBottom: 44,
    backgroundColor: '#EDEDE9',
  },
  changeBtn: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GREEN,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  changeBtnText: {
    fontSize: 20,
    color: '#EDEDE9',
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },
});
