import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import client from '../api';

// 서버 응답 타입 정의
type DeviceAddResponse = {
  success: boolean;
  message: string;
  data?: {
    deviceId: string;
    serial: string;
    paired: boolean;
    claimedAt: string;
  };
};

export default function DeviceAddScreen({ navigation }: any) {
  const [serialNum, setSerialNum] = useState('');
  const [loading, setLoading] = useState(false);

  // 입력값을 항상 대문자로 변환
  const handleChange = (text: string) => {
    setSerialNum(text.toUpperCase());
  };

  const handleAdd = async () => {
    if (!serialNum.trim()) return;

    setLoading(true);
    try {
      // API 호출 (POST /devices/claim)
      const res = await client.post<DeviceAddResponse>('/devices/claim', {
        serial: serialNum,
      });

      const json = res.data;

      if (json.success) {
        Alert.alert('등록 성공', '디바이스가 성공적으로 등록되었습니다.', [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        // 200 OK지만 success가 false인 경우
        Alert.alert(
          '등록 실패',
          json.message || '디바이스 등록에 실패했습니다.',
        );
      }
    } catch (error: any) {
      console.error('디바이스 등록 에러:', error);

      if (error.response) {
        const status = error.response.status;
        let alertMsg = '알 수 없는 오류가 발생했습니다.';

        // [핵심 수정] 상태 코드별 에러 메시지 분기 처리
        switch (status) {
          case 404:
            alertMsg =
              '존재하지 않는 디바이스 번호입니다.\n시리얼 넘버를 다시 확인해주세요.';
            break;
          case 409:
            alertMsg = '이미 다른 사용자에게 등록된 디바이스입니다.';
            break;
          case 400:
            alertMsg = '잘못된 요청입니다.\n입력 형식을 확인해주세요.';
            break;
          case 401:
            alertMsg = '인증 정보가 만료되었습니다.\n다시 로그인해주세요.';
            break;
          case 500:
            alertMsg =
              '서버 내부 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.';
            break;
          case 504:
            alertMsg =
              '서버 응답 시간이 초과되었습니다.\n디바이스가 켜져 있는지 확인하거나\n잠시 후 다시 시도해주세요.';
            break;
          default:
            // 그 외의 경우 서버에서 보낸 메시지가 있다면 사용
            if (error.response.data && error.response.data.message) {
              alertMsg = error.response.data.message;
            }
            break;
        }

        Alert.alert('등록 실패', alertMsg);
      } else {
        Alert.alert(
          '통신 오류',
          '서버와 연결할 수 없습니다.\n네트워크 상태를 확인해주세요.',
        );
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
      {/* 로딩 인디케이터 오버레이 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2E5A35" />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>디바이스 추가</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            추가하실 디바이스 넘버를{'\n'}입력해주세요.
          </Text>

          {/* width: 260으로 너비 고정 */}
          <PixelInput
            value={serialNum}
            onChangeText={handleChange}
            placeholder="SSUKSSUK-001"
            width={260}
          />
        </View>

        {/* 추가하기 버튼 */}
        <Pressable
          style={[styles.addBtn, (!serialNum || loading) && styles.disabledBtn]}
          onPress={handleAdd}
          disabled={!serialNum || loading}
        >
          <Text style={styles.addBtnText}>추가하기</Text>
        </Pressable>

        {/* 취소(뒤로가기) 버튼 */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
          disabled={loading}
        >
          <Text style={styles.cancelBtnText}>취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * 픽셀 스타일 입력창 컴포넌트
 */
function PixelInput({ width, ...props }: any) {
  const containerStyle = width
    ? [styles.pixelInputContainer, { width, marginHorizontal: 0 }]
    : styles.pixelInputContainer;

  return (
    <View style={containerStyle}>
      <View style={styles.pixelTop} />
      <View style={styles.pixelBottom} />
      <View style={styles.pixelLeft} />
      <View style={styles.pixelRight} />
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />

      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#AAA"
        autoCapitalize="characters"
        selectionColor="#2E5A35"
      />
    </View>
  );
}

const GREEN = '#2E5A35';
const PIXEL_SIZE = 4;
const BORDER_COLOR = 'rgba(36,46,19,0.9)';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDE9' },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },

  header: { alignItems: 'center', marginBottom: 40, width: '100%' },
  title: {
    fontSize: 34,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },

  content: { marginBottom: 50, alignItems: 'center', width: '100%' },
  description: {
    textAlign: 'center',
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
    lineHeight: 26,
    marginBottom: 30,
  },

  addBtn: {
    backgroundColor: GREEN,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 'auto',
    width: 260,
  },
  disabledBtn: { backgroundColor: '#AAA' },
  addBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },

  cancelBtn: { marginTop: 20, padding: 10 },
  cancelBtnText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'NeoDunggeunmoPro-Regular',
    textDecorationLine: 'underline',
  },

  pixelInputContainer: {
    position: 'relative',
    height: 54,
    justifyContent: 'center',
    backgroundColor: '#EDEDE9',
  },
  input: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'NeoDunggeunmoPro-Regular',
    paddingVertical: 0,
    zIndex: 10,
    width: '100%',
    textAlign: 'center',
  },

  pixelTop: {
    position: 'absolute',
    top: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  pixelBottom: {
    position: 'absolute',
    bottom: -PIXEL_SIZE,
    left: PIXEL_SIZE,
    right: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  pixelLeft: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
});
