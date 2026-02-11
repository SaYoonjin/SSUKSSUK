import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const API_BASE_URL = 'https://i14a103.p.ssafy.io/api';

// 1. Axios 인스턴스 생성
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. [요청 인터셉터] 헤더에 AccessToken 자동 주입
client.interceptors.request.use(
  async config => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// 3. [응답 인터셉터] 토큰 만료(401) 처리 및 재발급 로직
client.interceptors.response.use(
  response => response, // 성공 시 그대로 반환
  async error => {
    const originalRequest = error.config;

    // 401 에러가 발생했고, 아직 재시도를 하지 않은 요청이라면?
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // 무한 루프 방지 플래그 설정

      try {
        console.log('AccessToken 만료됨. 재발급 시도 중');

        // (1) 로컬에 저장된 RefreshToken 가져오기
        const refreshToken = await AsyncStorage.getItem('refreshToken');

        if (!refreshToken) {
          // 리프레시 토큰도 없으면 아예 로그아웃 처리
          throw new Error('No Refresh Token');
        }

        // (2) 토큰 재발급 요청 (주의: client가 아닌 axios를 직접 사용)
        // client를 쓰면 또 인터셉터가 걸려서 무한루프 돌 수 있음
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        // (3) 서버가 준 새로운 토큰들 받기 (서버 응답 구조에 따라 수정 필요)
        // 보통 accessToken과 refreshToken을 둘 다 새로 줍니다.
        const { accessToken, refreshToken: newRefreshToken } =
          response.data.data;

        // (4) 새 토큰 저장
        await AsyncStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('refreshToken', newRefreshToken);
        }

        console.log('토큰 재발급 성공');

        // (5) 실패했던 원래 요청의 헤더를 새 토큰으로 교체
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // (6) 원래 요청 다시 실행 (재시도)
        return client(originalRequest);
      } catch (refreshError) {
        console.error('토큰 재발급 실패 (완전 만료):', refreshError);

        // (7) 재발급 실패 시 로그아웃 처리 (토큰 삭제)
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('savedEmail'); // 필요 시

        // 여기서 바로 로그인 화면으로 보낼 수는 없지만(네비게이션 객체가 없으므로),
        // 보통 앱의 최상위(Root)에서 토큰 유무를 감지하거나, 에러를 전파시켜 UI가 반응하게 합니다.
        // 임시 알림
        // Alert.alert("세션 만료", "로그인 정보가 만료되었습니다. 다시 로그인해주세요.");

        return Promise.reject(refreshError);
      }
    }

    // 401 이외의 에러는 그대로 반환
    return Promise.reject(error);
  },
);

export default client;
