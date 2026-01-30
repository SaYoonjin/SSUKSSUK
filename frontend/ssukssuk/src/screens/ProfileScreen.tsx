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
// 로컬 스토리지 관리 (토큰 삭제용)
import AsyncStorage from '@react-native-async-storage/async-storage';

// [변경] Axios 인스턴스 가져오기
import client from '../api';

// 상수 및 타입 정의
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
            // [변경] Axios 사용: 토큰 헤더 설정 불필요 (자동 처리)
            const res = await client.post<CommonResponse>('/auth/logout');
            const json = res.data;

            if (json.success) {
              // [유지] 로그아웃 성공 시 로컬 토큰 삭제
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');

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
              Alert.alert(
                '실패',
                json.error?.message || '로그아웃 처리에 실패했습니다.',
              );
            }
          } catch (err: any) {
            console.error(err);
            // [변경] Axios 에러 핸들링
            if (err.response && err.response.data) {
              const msg = err.response.data.error?.message;
              Alert.alert('실패', msg || '로그아웃 처리에 실패했습니다.');
            } else {
              Alert.alert('에러', '서버와 통신 중 오류가 발생했습니다.');
            }
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
              // [변경] Axios 사용: DELETE 메서드
              const res = await client.delete<CommonResponse>('/auth/withdraw');
              const json = res.data;

              if (json.success) {
                // [유지] 탈퇴 성공 시 로컬 토큰 삭제
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
            } catch (err: any) {
              console.error(err);
              // [변경] Axios 에러 핸들링
              if (err.response && err.response.data) {
                const msg = err.response.data.error?.message;
                Alert.alert('실패', msg || '탈퇴 처리에 실패했습니다.');
              } else {
                Alert.alert('에러', '서버와 통신 중 오류가 발생했습니다.');
              }
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

        {/*/!* 👇 [추가] UI 확인용 임시 버튼 *!/*/}
        {/*<Line />*/}
        {/*<MenuRow*/}
        {/*  label="[테스트] 초기 설정 화면"*/}
        {/*  onPress={() => navigation.navigate('InitialSetup')}*/}
        {/*/>*/}

      </View>
    </SafeAreaView>
  );
}

// --- 하위 컴포넌트 (기존과 동일) ---

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

// --- 스타일 정의 (기존과 동일) ---

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
