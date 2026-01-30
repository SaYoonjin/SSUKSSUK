import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import client from '../api'; // Axios 클라이언트 임포트

// 1. 서버 응답 데이터 타입 정의 (기존 동일)
type DeviceData = {
  deviceId: number;
  serial: string;
  paired: boolean;
  plantConnected: boolean;
  connectedPlantId: number | null;
  connectedPlantName: string | null;
};

type DeviceListResponse = {
  success: boolean;
  data: DeviceData[];
  error: any;
};

export default function DeviceManagementScreen({ navigation }: any) {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [loading, setLoading] = useState(false);
  // const [loading, setLoading] = useState(true); // 테스트용 로딩 상태
  // const devices: DeviceData[] = []; // 테스트용 빈 데이터

  // 화면 포커스 시 목록 새로고침 (기존 동일)
  useFocusEffect(
    useCallback(() => {
      fetchDevices();
    }, []),
  );

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await client.get<DeviceListResponse>('/devices');
      if (res.data.success) {
        setDevices(res.data.data);
      } else {
        console.log('디바이스 목록 조회 실패:', res.data.error);
      }
    } catch (error) {
      console.error('디바이스 목록 로드 에러:', error);
      // Alert.alert('오류', '디바이스 목록을 불러오지 못했습니다.'); // 필요 시 주석 해제
    } finally {
      setLoading(false);
    }
  };

  // 연결 해제 핸들러 (기존 동일)
  const handleDisconnect = (id: number) => {
    Alert.alert('연결 해제', '디바이스와의 연결을 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        onPress: async () => {
          try {
            const res = await client.delete(`/devices/${id}/claim`);
            if (res.data.success) {
              Alert.alert('완료', '연결이 해제되었습니다.');
              fetchDevices();
            } else {
              Alert.alert('실패', res.data.error?.message || '해제 실패');
            }
          } catch (e) {
            console.error(e);
            Alert.alert('오류', '서버 통신 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  // 디바이스 삭제 핸들러 (기존 동일)
  const handleDelete = (id: number) => {
    Alert.alert(
      '디바이스 삭제',
      '정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await client.delete(`/devices/${id}`);
              if (res.data.success) {
                Alert.alert('완료', '디바이스가 삭제되었습니다.');
                fetchDevices();
              } else {
                Alert.alert('실패', res.data.error?.message || '삭제 실패');
              }
            } catch (e) {
              console.error(e);
              Alert.alert('오류', '서버 통신 중 오류가 발생했습니다.');
            }
          },
        },
      ],
    );
  };

  // --- 메인 렌더링 ---
  return (
    <View style={styles.screen}>
      {/* 1. 상단 헤더 (고정) */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>디바이스 관리</Text>
      </View>

      {/* 2. 중앙 콘텐츠 영역 (남은 공간 모두 차지) */}
      <View style={styles.contentArea}>
        {loading ? (
          // 로딩 중일 때 중앙 정렬
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={GREEN} />
          </View>
        ) : devices.length === 0 ? (
          // [수정] 등록된 디바이스가 없을 때 (중앙 정렬, 진한 회색)
          <View style={styles.centerContainer}>
            <Text style={styles.emptyTextDark}>
              등록된 디바이스가 없습니다.
            </Text>
          </View>
        ) : (
          // 디바이스가 있을 때 (스크롤 가능 목록)
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {devices.map(device => (
              <PixelCard key={device.deviceId}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{device.serial}</Text>
                  <Text
                    style={[
                      styles.plantName,
                      !device.plantConnected && styles.noConnection,
                    ]}
                  >
                    {device.plantConnected
                      ? device.connectedPlantName || '이름 없는 식물'
                      : '연결 없음'}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <PixelMiniButton
                    label="해제"
                    color={GREEN}
                    onPress={() => handleDisconnect(device.deviceId)}
                    disabled={!device.plantConnected}
                  />
                  <View style={{ width: 8 }} />
                  <PixelMiniButton
                    label="삭제"
                    color={ERROR_RED}
                    onPress={() => handleDelete(device.deviceId)}
                  />
                </View>
              </PixelCard>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 3. 하단 디바이스 추가 버튼 (고정) */}
      <View style={styles.bottomButtonContainer}>
        <Pressable onPress={() => navigation.navigate('DeviceAdd')}>
          <PixelCard centerContent compact>
            <Text style={styles.addText}>+ 디바이스 추가</Text>
          </PixelCard>
        </Pressable>
      </View>
    </View>
  );
}

/** ---------------- 픽셀 UI 컴포넌트 (기존과 동일) ---------------- */

function PixelCard({
  children,
  centerContent,
  compact,
}: {
  children: React.ReactNode;
  centerContent?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={styles.cardContainer}>
      <View
        style={[
          styles.cardInner,
          centerContent && styles.cardCenter,
          compact && styles.cardCompact,
        ]}
      >
        {children}
      </View>
      {/* 테두리 요소들 생략 (기존 코드와 동일하게 유지) */}
      <View style={styles.borderTop} />
      <View style={styles.borderBottom} />
      <View style={styles.borderLeft} />
      <View style={styles.borderRight} />
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
    </View>
  );
}

function PixelMiniButton({
  label,
  color,
  onPress,
  disabled,
}: {
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const btnColor = disabled ? '#AAAAAA' : color;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={styles.miniBtnContainer}
    >
      {/* 테두리 요소들 생략 (기존 코드와 동일하게 유지) */}
      <View style={[styles.borderTop, { backgroundColor: btnColor }]} />
      <View style={[styles.borderBottom, { backgroundColor: btnColor }]} />
      <View style={[styles.borderLeft, { backgroundColor: btnColor }]} />
      <View style={[styles.borderRight, { backgroundColor: btnColor }]} />
      <View style={[styles.cornerTL, { backgroundColor: btnColor }]} />
      <View style={[styles.cornerTR, { backgroundColor: btnColor }]} />
      <View style={[styles.cornerBL, { backgroundColor: btnColor }]} />
      <View style={[styles.cornerBR, { backgroundColor: btnColor }]} />
      <View style={styles.miniBtnInner}>
        <Text style={[styles.miniBtnText, { color: btnColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const BORDER = '#300e08';
const LIGHT_GREEN = '#75A743';
const GREEN = '#2E5A35';
const ERROR_RED = '#E04B4B';
const PIXEL = 4;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EDEDE9',
    paddingHorizontal: 26,
    paddingTop: 45,
    paddingBottom: 20, // 하단 버튼과의 간격
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
    flexShrink: 0, // 헤더는 줄어들지 않음
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
  headerTitle: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },

  // [신규] 중앙 콘텐츠 영역 (flex: 1로 남은 공간 차지)
  contentArea: {
    flex: 1,
    marginBottom: 20, // 하단 버튼과 간격
  },
  // [신규] 로딩 및 빈 상태 중앙 정렬 컨테이너
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // [신규] 스크롤뷰 내부 스타일
  scrollContent: {
    paddingBottom: 10,
  },
  // [수정] 빈 상태 텍스트 스타일 (진한 회색)
  emptyTextDark: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#555555', // 더 진한 회색
    fontSize: 18,
  },
  // [신규] 하단 고정 버튼 컨테이너
  bottomButtonContainer: {
    flexShrink: 0, // 버튼 영역은 줄어들지 않음
  },

  // --- 기존 카드 및 버튼 스타일 유지 ---
  cardContainer: { position: 'relative', marginBottom: 16, padding: 4 },
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafaf6',
    minHeight: 80,
  },
  cardCompact: {
    minHeight: 0,
    paddingVertical: 14,
  },
  cardCenter: { justifyContent: 'center' },
  deviceInfo: { flexDirection: 'column', gap: 4 },
  deviceName: {
    fontSize: 20,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },
  plantName: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: LIGHT_GREEN,
  },
  noConnection: { color: '#AAA' },
  addText: {
    fontSize: 20,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },
  actionButtons: { flexDirection: 'row' },
  miniBtnContainer: {
    position: 'relative',
    width: 54,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBtnInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fafaf6',
  },
  miniBtnText: { fontSize: 16, fontFamily: 'NeoDunggeunmoPro-Regular' },

  // 픽셀 테두리 스타일 (기존 유지)
  borderTop: {
    position: 'absolute',
    top: 0,
    left: PIXEL * 2,
    right: PIXEL * 2,
    height: PIXEL,
    backgroundColor: BORDER,
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: PIXEL * 2,
    right: PIXEL * 2,
    height: PIXEL,
    backgroundColor: BORDER,
  },
  borderLeft: {
    position: 'absolute',
    top: PIXEL * 2,
    bottom: PIXEL * 2,
    left: 0,
    width: PIXEL,
    backgroundColor: BORDER,
  },
  borderRight: {
    position: 'absolute',
    top: PIXEL * 2,
    bottom: PIXEL * 2,
    right: 0,
    width: PIXEL,
    backgroundColor: BORDER,
  },
  cornerTL: {
    position: 'absolute',
    top: PIXEL,
    left: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER,
  },
  cornerTR: {
    position: 'absolute',
    top: PIXEL,
    right: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER,
  },
  cornerBL: {
    position: 'absolute',
    bottom: PIXEL,
    left: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER,
  },
  cornerBR: {
    position: 'absolute',
    bottom: PIXEL,
    right: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER,
  },
});
