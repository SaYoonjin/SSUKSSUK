import { Platform, PermissionsAndroid, Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import client from '../api';

// 1. [API 연동] 백엔드 서버에 토큰 전송
const updateTokenToServer = async (token: string) => {
  try {
    // 기기 고유 ID 가져오기 (비회원/중복방지 식별용)
    const deviceId = await DeviceInfo.getUniqueId();

    // API 명세서(Step 2-1)에 맞춰 데이터 전송
    await client.post('/fcm/token', {
      token: token,
      platform: 'ANDROID',
      mobileDeviceId: deviceId,
    });
    console.log('FCM 토큰 서버 전송 성공:', token);
  } catch (error) {
    console.error('FCM 토큰 서버 전송 실패:', error);
  }
};

// 2. [권한] 알림 권한 요청 (Android 13+ 대응)
const requestUserPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS 또는 Android 12 이하
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

// 3. [초기화] 앱 실행/로그인 시 호출될 메인 함수
export const initFCM = async () => {
  // (1) 권한 확인
  const hasPermission = await requestUserPermission();
  if (!hasPermission) {
    console.log('알림 권한이 거부되었습니다.');
    return;
  }

  // (2) 현재 토큰 가져오기 & 서버 전송
  try {
    // 이미 등록된 토큰이 있는지 확인
    const token = await messaging().getToken();
    if (token) {
      await updateTokenToServer(token);
    }
  } catch (e) {
    console.error('토큰 가져오기 실패', e);
  }

  // (3) 토큰 갱신 감지 (앱 사용 중 토큰이 바뀌면 자동으로 다시 전송)
  // 이걸 안 하면 앱을 지웠다 깔았을 때 알림이 안 올 수 있음
  messaging().onTokenRefresh(async newToken => {
    console.log('토큰이 갱신되었습니다.');
    await updateTokenToServer(newToken);
  });

  // (4) [수신] 포그라운드(앱 켜져있을 때) 알림 처리
  // 알림이 오면 Alert를 띄우거나 배지를 업데이트 할 수 있음
  const unsubscribe = messaging().onMessage(async remoteMessage => {
    console.log('포그라운드 메시지 도착:', remoteMessage);

    // 예시: 앱 켜져있을 때 상단에 알림 띄우기 (선택 사항)
    if (remoteMessage.notification) {
      Alert.alert(
        remoteMessage.notification.title || '알림',
        remoteMessage.notification.body,
      );
    }
  });

  return unsubscribe;
};
