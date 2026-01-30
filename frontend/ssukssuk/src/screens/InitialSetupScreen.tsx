import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import client from '../api'; // Axios 클라이언트

const DESIGN_W = 360;
const DESIGN_H = 780;
const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const BG = '#EDEDE9';
const PIXEL_SIZE = 4;
const BTN_DISABLED_FILL = '#BFD6B0';
const BTN_DISABLED_FRAME = '#6E8B72';

export default function InitialSetupScreen({ navigation }: any) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const scale = useMemo(
    () =>
      Math.max(1, Math.floor(Math.min(screenW / DESIGN_W, screenH / DESIGN_H))),
    [screenW, screenH],
  );

  const [deviceId, setDeviceId] = useState('');
  const [loading, setLoading] = useState(false);

  // 디바이스 ID 입력 여부 확인
  const canSubmit = useMemo(() => deviceId.trim().length > 0, [deviceId]);

  // 1. 등록 완료 버튼 핸들러
  // (디바이스 등록 API 내부에서 초기설정 완료 로직도 처리된다고 가정)
  const onSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await client.post('/devices/claim', { serial: deviceId });

      if (res.data.success) {
        Alert.alert('등록 완료', '기기가 성공적으로 등록되었습니다 🌱', [
          {
            text: '시작하기',
            onPress: () => {
              navigation.replace('Main');
            },
          },
        ]);
      } else {
        Alert.alert(
          '등록 실패',
          res.data.message || '디바이스 등록에 실패했습니다.',
        );
      }
    } catch (e: any) {
      console.error(e);
      if (e.response && e.response.status === 504) {
        Alert.alert(
          '시간 초과',
          '서버 응답이 지연되고 있습니다.\n잠시 후 다시 시도해주세요.',
        );
      } else {
        const msg = e.response?.data?.message || '서버 통신 오류';
        Alert.alert('오류', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ [추가] 초기 설정 완료(건너뛰기) API 호출 함수
  const handleSkip = async () => {
    try {
      setLoading(true);
      // 명세서에 있는 초기 설정 완료 API 호출
      const res = await client.patch('/auth/initialize');

      if (res.data.success) {
        // 성공 시 메인으로 이동
        navigation.replace('Main');
      } else {
        Alert.alert(
          '알림',
          res.data.message || '설정 완료 처리에 실패했습니다.',
        );
      }
    } catch (e: any) {
      console.error('Skip Error:', e);
      // 에러가 나더라도 '건너뛰기'의 의도상 메인으로 보내줄지, 에러를 띄울지 결정
      // 여기서는 안전하게 에러를 알리고 메인으로 이동하지 않음 (DB 불일치 방지)
      Alert.alert('오류', '서버와 통신하는 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2. 나중에 하기 버튼 핸들러
  const onSkip = () => {
    Alert.alert(
      '알림',
      '기기 등록은 [설정 > 디바이스 관리]에서\n언제든지 할 수 있어요!',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: () => {
            // ✅ 확인 클릭 시 API 호출 함수 실행
            handleSkip();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: 18 * scale, paddingBottom: 40 * scale },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ marginTop: 70 * scale, marginBottom: 50 * scale }}>
          <Text style={[styles.title, { fontSize: 30 * scale }]}>
            초기 설정
          </Text>
          <Text
            style={[
              styles.subtitle,
              { fontSize: 16 * scale, marginTop: 10 * scale },
            ]}
          >
            서비스 이용을 위해{'\n'}스마트 화분을 등록해주세요.
          </Text>
        </View>

        <PixelCard title="디바이스 등록" scale={scale}>
          <Text style={[styles.label, { fontSize: 15 * scale }]}>
            디바이스 시리얼 넘버
          </Text>
          <PixelInput
            scale={scale}
            value={deviceId}
            onChangeText={(t: string) => setDeviceId(t.toUpperCase())}
            placeholder="예: SSUK-1234"
            returnKeyType="done"
          />
        </PixelCard>

        <View style={{ height: 40 * scale }} />

        {/* 등록 버튼 */}
        <PixelButton
          label="등록하고 시작하기"
          onPress={onSubmit}
          scale={scale}
          enabled={canSubmit}
        />

        {/* 나중에 하기 버튼 */}
        <Pressable
          onPress={onSkip}
          style={{ marginTop: 20 * scale, padding: 10, alignItems: 'center' }}
        >
          <Text style={[styles.skipText, { fontSize: 16 * scale }]}>
            나중에 등록할게요
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ---------------- 스타일 및 픽셀 컴포넌트 (기존과 동일) ---------------- */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  scrollContent: { paddingTop: 0 },
  title: {
    textAlign: 'center',
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#000000',
    letterSpacing: 1,
  },
  subtitle: {
    textAlign: 'center',
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#666',
    lineHeight: 24,
  },
  label: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: GREEN,
    marginBottom: 8,
    marginLeft: 4,
  },
  cardTitle: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: GREEN,
    marginBottom: 12,
    marginLeft: 2,
  },
  pixelCardWrap: { position: 'relative', backgroundColor: '#FFFFFF' },
  pixelCardInner: { backgroundColor: '#FFFFFF' },
  pixelInputWrap: {
    position: 'relative',
    height: 44,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
  },
  input: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: GREEN,
    paddingVertical: 0,
    zIndex: 10,
  },
  pixelBtnWrap: { position: 'relative', height: 50, justifyContent: 'center' },
  pixelBtnFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  skipText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#888',
    textDecorationLine: 'underline',
  },
  pTop: { position: 'absolute', zIndex: 5 },
  pBottom: { position: 'absolute', zIndex: 5 },
  pLeft: { position: 'absolute', zIndex: 5 },
  pRight: { position: 'absolute', zIndex: 5 },
  pCorner: { position: 'absolute', zIndex: 6 },
});

function PixelCard({ title, children, scale }: any) {
  const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));
  return (
    <View style={[styles.pixelCardWrap, { marginHorizontal: ps * 2 }]}>
      <PixelFrame color={GREEN} pixel={ps} />
      <View style={[styles.pixelCardInner, { padding: 14 * scale }]}>
        <Text style={[styles.cardTitle, { fontSize: 20 * scale }]}>
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}

function PixelInput({ scale, ...props }: any) {
  const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));
  return (
    <View style={[styles.pixelInputWrap, { marginHorizontal: ps * 2 }]}>
      <PixelFrame color={GREEN} pixel={ps} />
      <TextInput
        {...props}
        style={[styles.input, { fontSize: 18 * scale }]}
        placeholderTextColor="#A6B79D"
      />
    </View>
  );
}

function PixelButton({ label, onPress, scale, enabled }: any) {
  const ps = Math.max(3, Math.round(PIXEL_SIZE * (scale >= 2 ? 1 : 1)));
  const frameColor = enabled ? GREEN : BTN_DISABLED_FRAME;
  const fillColor = enabled ? LIGHT_GREEN : BTN_DISABLED_FILL;
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      style={({ pressed }) => [
        { opacity: !enabled ? 0.6 : pressed ? 0.92 : 1 },
      ]}
    >
      <View style={[styles.pixelBtnWrap, { marginHorizontal: ps * 2 }]}>
        <PixelFrame color={frameColor} pixel={ps} />
        <View
          style={[
            styles.pixelBtnFill,
            { backgroundColor: fillColor, marginHorizontal: -ps },
          ]}
        >
          <Text style={[styles.btnText, { fontSize: 18 * scale }]}>
            {label}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function PixelFrame({ color, pixel }: any) {
  const p = pixel;
  return (
    <>
      <View
        style={[
          styles.pTop,
          { height: p, left: p, right: p, top: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pBottom,
          { height: p, left: p, right: p, bottom: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pLeft,
          { width: p, top: p, bottom: p, left: -p * 2, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pRight,
          {
            width: p,
            top: p,
            bottom: p,
            right: -p * 2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, top: 0, left: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, top: -p, left: 0, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, top: p, left: -p * 2, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, top: 0, right: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, top: -p, right: 0, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          {
            width: p,
            height: p,
            top: p,
            right: -p * 2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, bottom: 0, left: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, bottom: -p, left: 0, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          {
            width: p,
            height: p,
            bottom: p,
            left: -p * 2,
            backgroundColor: color,
          },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, bottom: 0, right: -p, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          { width: p, height: p, bottom: -p, right: 0, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.pCorner,
          {
            width: p,
            height: p,
            bottom: p,
            right: -p * 2,
            backgroundColor: color,
          },
        ]}
      />
    </>
  );
}
