import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  SafeAreaView,
  Animated,
} from 'react-native';

const LIGHT_GREEN = '#75A743';
const BG = '#EDEDE9';
const ERROR_RED = '#D97B7B';

export default function SettingsScreen({ navigation }: any) {
  const [pushEnabled, setPushEnabled] = useState(true);

  // 0 = Off (왼쪽), 1 = On (오른쪽)
  const anim = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    const next = !pushEnabled;
    setPushEnabled(next);

    Animated.spring(anim, {
      toValue: next ? 1 : 0,
      useNativeDriver: false, // 배경색과 레이아웃 이동을 위해 false
      friction: 8,
      tension: 40,
    }).start();
  };

  // 배경색 애니메이션
  const backgroundColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [ERROR_RED, LIGHT_GREEN],
  });

  // 흰색 박스 이동 (전체 너비 110 - 박스 너비 55 = 55 이동)
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 55],
  });

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>설정</Text>
      </View>

      <Pressable
        onPress={() => navigation.navigate('DeviceManagement')}
        style={styles.row}
      >
        <Text style={styles.rowText}>디바이스 관리</Text>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <View style={styles.row}>
        <Text style={styles.rowText}>푸시 알림 설정</Text>

        {/* 토글 스위치 */}
        <Pressable onPress={toggle}>
          <Animated.View style={[styles.toggleContainer, { backgroundColor }]}>
            <Animated.View
              style={[styles.sliderThumb, { transform: [{ translateX }] }]}
            >
              <Text style={styles.activeText}>
                {pushEnabled ? 'On' : 'Off'}
              </Text>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const TOGGLE_W = 110;
const TOGGLE_H = 36;
const THUMB_W = 55; // 토글 너비의 딱 절반

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 26,
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 26,
  },
  backBtn: {
    paddingRight: 10,
    paddingVertical: 4,
  },
  backChevron: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
    lineHeight: 34,
  },
  title: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
  },
  rowText: {
    flex: 1,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 18,
    color: 'rgba(36,46,19,0.9)',
  },
  chevron: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 22,
    color: 'rgba(36,46,19,0.9)',
    opacity: 0.75,
    marginLeft: 10,
  },

  // --- 토글 스타일 핵심 ---
  toggleContainer: {
    width: TOGGLE_W,
    height: TOGGLE_H,
    borderRadius: 4,
    justifyContent: 'center',
    overflow: 'hidden', // 슬라이더가 삐져나가지 않게
  },
  sliderThumb: {
    width: THUMB_W,
    height: TOGGLE_H,
    backgroundColor: '#d7d7d7',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    // 그림자 (iOS/Android)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  activeText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 18,
    color: '#000000',
    // 폰트 수직 중앙 정렬 보정
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 22,
  },
});