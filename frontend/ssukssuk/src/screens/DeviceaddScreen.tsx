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
} from 'react-native';

export default function DeviceAddScreen({ navigation }: any) {
  const [serialNum, setSerialNum] = useState('');

  // 입력값을 항상 대문자로 변환
  const handleChange = (text: string) => {
    setSerialNum(text.toUpperCase());
  };

  const handleAdd = () => {
    // 여기에 API 통신 로직 추가 (예: 서버로 serialNum 전송)
    console.log('Add Device:', serialNum);
    navigation.goBack(); // 완료 후 이전 화면으로 이동
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            placeholder="DEV-00001234"
            width={260}
          />
        </View>

        {/* 추가하기 버튼 */}
        <Pressable
          style={[styles.addBtn, !serialNum && styles.disabledBtn]}
          onPress={handleAdd}
          disabled={!serialNum}
        >
          <Text style={styles.addBtnText}>추가하기</Text>
        </Pressable>

        {/* 취소(뒤로가기) 버튼 */}
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>취소</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * 픽셀 스타일 입력창 컴포넌트
 * - width props를 통해 너비 조절 가능
 */
function PixelInput({ width, ...props }: any) {
  const containerStyle = width
    ? [styles.pixelInputContainer, { width, marginHorizontal: 0 }]
    : styles.pixelInputContainer;

  return (
    <View style={containerStyle}>
      {/* 픽셀 테두리 */}
      <View style={styles.pixelTop} />
      <View style={styles.pixelBottom} />
      <View style={styles.pixelLeft} />
      <View style={styles.pixelRight} />

      {/* 픽셀 모서리 */}
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />

      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#AAA"
        autoCapitalize="characters"
        selectionColor="#2E5A35" // 커서 색상 (진한 녹색)
      />
    </View>
  );
}

const GREEN = '#2E5A35';
const PIXEL_SIZE = 4;
const BORDER_COLOR = 'rgba(36,46,19,0.9)';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDEDE9' },
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

  // 버튼 스타일
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

  // PixelInput 스타일
  pixelInputContainer: {
    position: 'relative',
    height: 54,
    justifyContent: 'center',
    backgroundColor: '#EDEDE9',
    // marginHorizontal은 width prop이 없을 때만 사용되거나 상위에서 제어
  },
  input: {
    fontSize: 20,
    color: '#000',
    fontFamily: 'NeoDunggeunmoPro-Regular',
    paddingVertical: 0,
    zIndex: 10,

    // [수정됨] 입력창 내부 정렬 강제
    width: '100%',
    textAlign: 'center',
  },

  // 테두리 조각들
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
    left: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL_SIZE,
    bottom: PIXEL_SIZE,
    right: -PIXEL_SIZE * 2,
    width: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },

  cornerTL: {
    position: 'absolute',
    top: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: -PIXEL_SIZE,
    width: PIXEL_SIZE,
    height: PIXEL_SIZE,
    backgroundColor: BORDER_COLOR,
  },
});
