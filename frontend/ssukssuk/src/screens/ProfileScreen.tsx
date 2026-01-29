import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
// 1. AsyncStorage 임포트 추가 (토큰 관리용)
import AsyncStorage from '@react-native-async-storage/async-storage';

// 상수 및 타입 정의
const API_BASE_URL = 'https://i14a103.p.ssafy.io/api';
const GREEN = '#2E5A35';
const LIGHT_GREEN = '#75A743';
const BG = '#EDEDE9';
const RED = '#D25353';

// 서버 응답 공통 타입
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

  // [수정] 실제 저장소에서 액세스 토큰을 가져오는 함수
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.log('저장된 토큰이 없습니다.');
        return '';
      }
      return token;
    } catch (e) {
      console.error('토큰 불러오기 실패:', e);
      return '';
    }
  };

  // --- 로그아웃 로직 (POST) ---
  const onLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하겠습니까?', [
      { text: '아니오', style: 'cancel' },
      {
        text: '예',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            // 1. 토큰 가져오기
            const token = await getToken();

            // 토큰이 없으면 이미 로그아웃된 상태로 간주하고 로그인 화면으로 이동
            if (!token) {
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
              return;
            }

            // 2. 서버에 로그아웃 요청
            const res = await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`, // 실제 토큰 전송
              },
            });

            const json: CommonResponse = await res.json();

            // 3. 결과 처리
            if (json.success) {
              // [수정] 로그아웃 성공 시 로컬 토큰 삭제
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken'); // 리프레시 토큰도 있다면 삭제

              Alert.alert('완료', '로그아웃 되었습니다.', [
                {
                  text: '확인',
                  onPress: () => {
                    navigation.reset({
                      index: 0,
                      routes: [{ name: 'Login' }],
                    });
                  },
                },
              ]);
            } else {
              // 실패 시에도 토큰 문제일 수 있으므로 상황에 따라 처리가 필요하지만, 우선 에러 메시지 출력
              Alert.alert(
                '실패',
                json.error?.message || '로그아웃 처리에 실패했습니다.',
              );
            }
          } catch (err) {
            console.error(err);
            Alert.alert('에러', '서버와 통신 중 오류가 발생했습니다.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // --- 회원 탈퇴 로직 (DELETE) ---
  const onWithdraw = () => {
    Alert.alert(
      '탈퇴하기',
      '정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const token = await getToken();
              if (!token) {
                navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                return;
              }

              const res = await fetch(`${API_BASE_URL}/auth/withdraw`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });

              const json: CommonResponse = await res.json();

              if (json.success) {
                // [수정] 탈퇴 성공 시 로컬 토큰 삭제
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('refreshToken');

                Alert.alert('탈퇴 처리', '탈퇴가 완료되었습니다.', [
                  {
                    text: '확인',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                      });
                    },
                  },
                ]);
              } else {
                Alert.alert(
                  '실패',
                  json.error?.message || '탈퇴 처리에 실패했습니다.',
                );
              }
            } catch (err) {
              console.error(err);
              Alert.alert('에러', '서버와 통신 중 오류가 발생했습니다.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* 로딩 인디케이터 오버레이 */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      {/* 메뉴 영역 */}
      <View style={styles.menu}>
        <Line />
        <MenuRow
          label="닉네임 변경하기"
          onPress={() => navigation.navigate('NicknameChange')}
        />
        <MenuRow
          label="비밀번호 변경하기"
          onPress={() => navigation.navigate('PasswordChange')}
        />
        <Line />

        <MenuRow label="설정" onPress={() => navigation.navigate('Settings')} />
        <Line />

        <MenuRow label="로그아웃" onPress={onLogout} danger />
        <MenuRow label="탈퇴하기" onPress={onWithdraw} danger />
      </View>
    </SafeAreaView>
  );
}

// --- 하위 컴포넌트 ---

function Line() {
  return <View style={styles.line} />;
}

function MenuRow({
  label,
  onPress,
  danger = false,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Text style={[styles.rowText, danger && styles.rowTextDanger]}>
        {label}
      </Text>
      <Text style={[styles.chevron, danger && styles.chevronDanger]}>›</Text>
    </Pressable>
  );
}

// --- 스타일 정의 ---

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 26,
    paddingTop: 40,
  },

  /* 로딩 오버레이 */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },

  /* 메뉴 */
  menu: {
    backgroundColor: BG,
    marginTop: 80,
  },

  line: {
    height: 2,
    backgroundColor: GREEN,
    marginVertical: 10,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 6,
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

  rowTextDanger: {
    color: RED,
  },
  chevronDanger: {
    color: RED,
    opacity: 1,
  },
});
