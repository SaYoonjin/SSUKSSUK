/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import "react-native-gesture-handler";
import messaging from '@react-native-firebase/messaging';

// 백그라운드/종료 상태 알림 핸들러 등록
// 주의: 이 함수는 리액트 컴포넌트 밖(맨 위)에 있어야 합니다.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('백그라운드 메시지 수신:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);

AppRegistry.registerComponent(appName, () => App);
