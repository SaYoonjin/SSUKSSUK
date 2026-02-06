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
import client from '../api';

const PIXEL_SIZE = 4;
const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const CARD_BG = '#fafaf6';

const CONTENT_PAD_H = 26;

// 응답 타입 정의
type NicknameChangeResponse = {
  success: boolean;
  error?: {
    message: string;
  };
};

export default function NicknameEditScreen({ navigation }: any) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = nickname.trim();

    if (!trimmed) {
      Alert.alert('알림', '변경할 닉네임을 입력해 주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await client.patch<NicknameChangeResponse>('/auth/nickname', {
        newNickname: trimmed,
      });

      const json = res.data;

      if (json.success) {
        Alert.alert('완료', '닉네임이 성공적으로 변경되었습니다.', [
          { text: '확인', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert(
            '변경 실패',
            json.error?.message || '닉네임 변경에 실패했습니다.',
        );
      }
    } catch (error: any) {
      console.error(error);
      if (error.response && error.response.data) {
        const msg =
            error.response.data.error?.message ||
            error.response.data.message ||
            '닉네임 변경에 실패했습니다.';
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
          {/* ✅ 헤더: 풀폭 + 아래만 그림자 (통일) */}
          <View style={styles.headerWrap}>
            <View style={styles.headerRow}>
              <Pressable
                  onPress={() => navigation.goBack()}
                  hitSlop={10}
                  style={styles.backBtn}
              >
                <Text style={styles.backChevron}>‹</Text>
              </Pressable>
              <Text style={styles.headerTitle}>닉네임 변경하기</Text>
            </View>

            <View style={styles.headerBottomShadow}>
              <View style={styles.headerShadowDark} />
              <View style={styles.headerShadowLight} />
            </View>
          </View>

          {/* ✅ 콘텐츠만 패딩 */}
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

          {/* ✅ 하단바도 콘텐츠 패딩만 */}
          <View style={styles.bottomBar}>
            <PixelButton text="변경하기" onPress={handleSubmit} disabled={loading} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

// ---------------- 컴포넌트 ----------------

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
        <TextInput {...props} style={styles.input} placeholderTextColor="#A6B79D" />
      </PixelBox>
  );
}

function PixelButton({ text, onPress, disabled }: any) {
  const v = useRef(new Animated.Value(0)).current;

  const pressIn = () =>
      !disabled &&
      Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
  const pressOut = () =>
      !disabled &&
      Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

  return (
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} disabled={disabled}>
        <Animated.View
            style={[
              styles.changeBtn,
              disabled && { opacity: 0.6 },
              {
                borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
                marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [0, 2] }) as any,
              },
            ]}
        >
          <Text style={styles.changeBtnText}>{text}</Text>
        </Animated.View>
      </Pressable>
  );
}

// ---------------- 스타일 ----------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EDEDE9' },

  // ✅ screen에서 paddingHorizontal 제거 (헤더 풀폭 유지)
  screen: { flex: 1, paddingTop: 45, backgroundColor: '#EDEDE9' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  // ✅ 헤더: 풀폭 + 아래만 그림자
  headerWrap: {
    marginTop: 6,
    marginBottom: 26,
    backgroundColor: '#EDEDE9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CONTENT_PAD_H,
    paddingBottom: 8,
  },
  headerBottomShadow: {
    height: 8,
    backgroundColor: '#EDEDE9',
  },
  headerShadowDark: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  headerShadowLight: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
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

  // ✅ 콘텐츠만 패딩
  content: { paddingHorizontal: CONTENT_PAD_H, paddingBottom: 20, marginTop: 40 },
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

  // ✅ 하단바도 패딩만
  bottomBar: {
    paddingHorizontal: CONTENT_PAD_H,
    paddingBottom: 50,
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
