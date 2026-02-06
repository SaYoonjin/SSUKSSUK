import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client from '../api';
import { initFCM } from '../utils/fcm';

const DESIGN_W = 360;
const DESIGN_H = 780;
const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';

export default function SplashScreen({ navigation }: any) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  // 디자인 기준 해상도(360x780) 대비 현재 화면의 비율 계산
  const scale = useMemo(() => {
    const ratioW = screenW / DESIGN_W;
    const ratioH = screenH / DESIGN_H;
    // 너무 작아지거나 커지지 않도록 최소 1, 최대 1.5배 정도로 제한 (필요시 조절)
    return Math.max(1, Math.min(ratioW, ratioH, 1.5));
  }, [screenW, screenH]);

  // 깜빡임 애니메이션을 위한 값
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // 1. 애니메이션 실행 (깜빡임 효과)
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  // 2. 자동 로그인 체크 로직 (기존 코드 유지)
  useEffect(() => {
    // 의존성 문제 해결을 위해 함수를 useEffect 안으로 이동
    const handleSuccess = async (userData: any) => {
      try {
        await initFCM();
      } catch (fcmError) {
        console.error('FCM 연결 실패 (무시하고 진행)', fcmError);
      }

      if (userData.isInitialized) {
        navigation.replace('Main');
      } else {
        navigation.replace('InitialSetup');
      }
    };

    const checkLoginStatus = async () => {
      // 로딩 화면을 최소 1.5초 정도 보여주기 위한 딜레이 (선택사항)
      await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));

      try {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!accessToken) {
          console.log('🔒 토큰 없음');
          navigation.replace('Login');
          return;
        }

        try {
          // 내 정보 조회
          const res = await client.get('/auth/me');

          if (res.data.success) {
            console.log('✅ 기존 토큰 유효함');
            await handleSuccess(res.data.data);
            return;
          }
        } catch (error: any) {
          console.log('⚠️ 액세스 토큰 만료됨, 갱신 시도...', error.message);

          if (refreshToken) {
            try {
              const refreshRes = await client.post('/auth/refresh', {
                refreshToken: refreshToken,
              });

              if (refreshRes.data.success) {
                const newAccessToken = refreshRes.data.data.accessToken;
                const newRefreshToken = refreshRes.data.data.refreshToken;

                await AsyncStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                  await AsyncStorage.setItem('refreshToken', newRefreshToken);
                }

                console.log('🔄 토큰 갱신 성공!');

                const retryRes = await client.get('/auth/me');
                if (retryRes.data.success) {
                  await handleSuccess(retryRes.data.data);
                  return;
                }
              }
            } catch (refreshErr) {
              console.error('❌ 토큰 갱신 실패:', refreshErr);
            }
          }
        }

        throw new Error('Login Required');
      } catch (e) {
        console.log('🔒 로그인 필요 (세션 만료):', e);
        await AsyncStorage.clear();
        navigation.replace('Login');
      }
    };

    checkLoginStatus();
  }, [navigation]);

  // 3. UI 렌더링 (LaunchScreen 디자인 적용)
  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Image
          source={require('../assets/logo.png')}
          style={[styles.logo, { width: 160 * scale, height: 160 * scale }]}
          resizeMode="contain"
        />
        <Text style={[styles.brand, { fontSize: 40 * scale }]}>쑥쑥</Text>
      </View>

      <View style={[styles.bottomContainer, { paddingBottom: 60 * scale }]}>
        <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
          {/* "Touch to Start" 대신 "로딩 중..."으로 변경 */}
          <Text
            style={[
              styles.touchText,
              { fontSize: 18 * scale, marginBottom: 10 * scale },
            ]}
          >
            로딩 중...
          </Text>
          <ActivityIndicator size="small" color={GREEN} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDEDE9',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 160,
  },
  logo: {
    marginBottom: 20,
  },
  brand: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: LIGHT_GREEN,
    textAlign: 'center',
  },
  bottomContainer: {
    alignItems: 'center',
  },
  touchText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: GREEN,
    textAlign: 'center',
  },
});
