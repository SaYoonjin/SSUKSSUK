import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import messaging from '@react-native-firebase/messaging';
import client from '../api';
import { useFocusEffect } from '@react-navigation/native';

const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const BG = '#EDEDE9';
const CARD_BG = '#FFFFFF';
const RED = '#D25353';
const ERROR_RED = '#D97B7B';

type UserInfoResponse = {
  success: boolean;
  message: string;
  data: {
    userId: number;
    nickname: string;
    isinitialized: boolean;
  } | null;
};

type CommonResponse = {
  success: boolean;
  data: any | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export default function ProfileScreen({ navigation }: any) {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);

  const anim = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // 1. 내 정보 조회
  const fetchUserInfo = async () => {
    try {
      const res = await client.get<UserInfoResponse>('/auth/me');
      if (res.data.success && res.data.data) {
        setNickname(res.data.data.nickname);
      }
    } catch (err: any) {
      console.error('내 정보 조회 실패:', err);
      if (err.response?.status === 401) {
        navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      }
    }
  };

  // 2. 초기 설정값 로드
  const fetchPushSetting = async () => {
    try {
      const savedSetting = await AsyncStorage.getItem('pushEnabled');
      if (savedSetting !== null) {
        const isEnabled = JSON.parse(savedSetting);
        setPushEnabled(isEnabled);
        anim.setValue(isEnabled ? 1 : 0);
      }
    } catch (error) {
      console.error('설정 조회 실패:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      overlayOpacity.setValue(1);
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();

      setLoading(true);
      Promise.all([fetchUserInfo(), fetchPushSetting()]).finally(() =>
        setLoading(false),
      );
    }, []),
  );

  const togglePush = async () => {
    const next = !pushEnabled;

    if (!next) {
      updatePushStatus(false);
      return;
    }

    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        Alert.alert(
          '알림 권한 필요',
          '알림을 받으려면 설정에서 권한을 허용해야 합니다.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정으로 이동', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const token = await messaging().getToken();
      const deviceId = await DeviceInfo.getUniqueId();

      await client.post('/fcm/token', {
        token: token,
        platform: 'ANDROID',
        mobileDeviceId: deviceId,
      });

      updatePushStatus(true);
    } catch (error) {
      console.error('권한 확인 또는 토큰 등록 실패:', error);
      Alert.alert('오류', '알림 설정을 켤 수 없습니다.');
    }
  };

  const updatePushStatus = async (nextState: boolean) => {
    setPushEnabled(nextState);
    Animated.spring(anim, {
      toValue: nextState ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 50,
    }).start();

    try {
      await AsyncStorage.setItem('pushEnabled', JSON.stringify(nextState));
      const deviceId = await DeviceInfo.getUniqueId();

      const res = await client.patch('/fcm/setting', {
        notiSetting: nextState,
        mobileDeviceId: deviceId,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || '서버 응답 실패');
      }
      console.log(`알림 설정 ${nextState ? 'ON' : 'OFF'} 완료`);
    } catch (error) {
      console.error('설정 변경 API 실패:', error);
      setPushEnabled(!nextState);
      Animated.spring(anim, {
        toValue: !nextState ? 1 : 0,
        useNativeDriver: false,
      }).start();
      Alert.alert('오류', '서버에 설정을 저장하지 못했습니다.');
    }
  };

  const toggleBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [ERROR_RED, LIGHT_GREEN],
  });

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  // ✅ [수정됨] 로그아웃 시 mobileDeviceId 전달
  const onLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '예',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const deviceId = await DeviceInfo.getUniqueId();

            // Logout API 호출 시 deviceId 포함
            const res = await client.post<CommonResponse>('/auth/logout', {
              mobileDeviceId: deviceId,
            });

            if (res.data.success) {
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');
              await AsyncStorage.removeItem('pushEnabled'); // 설정 초기화

              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          } catch (err) {
            Alert.alert('에러', '로그아웃 중 오류가 발생했습니다.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const onWithdraw = () => {
    Alert.alert('탈퇴하기', '정말로 탈퇴하시겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '예',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const res = await client.delete<CommonResponse>('/auth/withdraw');
            if (res.data.success) {
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');
              await AsyncStorage.removeItem('pushEnabled');

              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }
          } catch (err) {
            Alert.alert('에러', '탈퇴 처리 중 오류가 발생했습니다.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.profileHeader}>
          <Text style={styles.headerLine}>
            <Text style={styles.nickname}>{nickname || '...'}</Text>
            <Text style={styles.headerSuffix}> 님, 환영합니다!</Text>
          </Text>
        </View>

        <SectionLabel text="내 정보 변경" />
        <MenuRow
          label="닉네임 변경하기"
          onPress={() => navigation.navigate('NicknameChange')}
          useCard
        />
        <MenuRow
          label="비밀번호 변경하기"
          onPress={() => navigation.navigate('PasswordChange')}
          useCard
        />

        <Line />
        <SectionLabel text="디바이스 및 알림 설정" />
        <MenuRow
          label="디바이스 관리"
          onPress={() => navigation.navigate('DeviceManagement')}
          useCard
        />
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowText}>푸시 알림 설정</Text>
            <Pressable onPress={togglePush} hitSlop={10}>
              <Animated.View
                style={[styles.toggleContainer, { backgroundColor: toggleBg }]}
              >
                <Animated.View
                  style={[styles.sliderThumb, { transform: [{ translateX }] }]}
                />
              </Animated.View>
            </Pressable>
          </View>
        </View>

        <Line />
        <MenuRow label="로그아웃" onPress={onLogout} danger />
        <MenuRow label="탈퇴하기" onPress={onWithdraw} danger />
      </ScrollView>

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: BG,
            opacity: overlayOpacity,
            zIndex: 50,
          },
        ]}
      />
    </SafeAreaView>
  );
}

// ... (하단 컴포넌트 및 스타일은 기존과 동일)
function Line() {
  return <View style={styles.line} />;
}
function SectionLabel({ text }: { text: string }) {
  return (
    <View style={styles.sectionLabelWrap}>
      <Text style={styles.sectionLabel}>{text}</Text>
    </View>
  );
}
function MenuRow({ label, onPress, danger = false, useCard = false }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={useCard ? styles.card : styles.noCardRow}
    >
      <View style={styles.row}>
        <Text style={[styles.rowText, danger && styles.rowTextDanger]}>
          {label}
        </Text>
        <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingHorizontal: 26, paddingTop: 80, paddingBottom: 40 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  profileHeader: { paddingHorizontal: 6, paddingBottom: 30 },
  headerLine: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.85)',
    marginTop: 20,
  },
  nickname: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 32,
    color: 'rgba(36,46,19,0.95)',
  },
  headerSuffix: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 20,
    color: 'rgba(36,46,19,0.7)',
  },
  line: { height: 2, backgroundColor: GREEN, marginVertical: 10 },
  sectionLabelWrap: { paddingHorizontal: 6, paddingBottom: 12 },
  sectionLabel: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 16,
    color: 'rgba(36,46,19,0.55)',
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  noCardRow: { paddingHorizontal: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  rowText: {
    flex: 1,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 18,
    color: 'rgba(36,46,19,0.9)',
  },
  chevron: { fontSize: 22, color: 'rgba(36,46,19,0.3)', marginLeft: 10 },
  rowTextDanger: { color: RED },
  chevronDanger: { color: RED, opacity: 0.6 },
  toggleContainer: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
});
