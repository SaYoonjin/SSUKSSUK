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

// 1. 서버 응답 데이터 타입 정의
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

  // 2. 화면이 포커스될 때마다 목록 새로고침 (추가 화면에서 돌아올 때 등)
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
        // success가 false인 경우 처리
        console.log('디바이스 목록 조회 실패:', res.data.error);
      }
    } catch (error) {
      console.error('디바이스 목록 로드 에러:', error);
      Alert.alert('오류', '디바이스 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 연결 해제 핸들러 (DELETE /devices/{id}/claim)
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
              fetchDevices(); // 목록 갱신
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

  // 디바이스 삭제 핸들러 (DELETE /devices/{id})
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
                fetchDevices(); // 목록 갱신
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

  return (
    <View style={styles.screen}>
      {/* 상단 고정: ScrollView 밖 */}
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

      {/* 로딩 인디케이터 */}
      {loading && devices.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* 1. 기기 목록 (서버 데이터 매핑) */}
          {devices.map(device => (
            <PixelCard key={device.deviceId}>
              <View style={styles.deviceInfo}>
                {/* 시리얼 넘버를 이름으로 표시 */}
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
                {/* 식물 연결 해제 버튼 */}
                <PixelMiniButton
                  label="해제"
                  color={GREEN}
                  onPress={() => handleDisconnect(device.deviceId)}
                  disabled={!device.plantConnected} // 식물 연결 안 되어 있으면 비활성화
                />
                <View style={{ width: 8 }} />
                {/* 기기 삭제 버튼 */}
                <PixelMiniButton
                  label="삭제"
                  color={ERROR_RED}
                  onPress={() => handleDelete(device.deviceId)}
                />
              </View>
            </PixelCard>
          ))}

          {/* 목록이 없을 때 안내 문구 */}
          {!loading && devices.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 디바이스가 없습니다.</Text>
            </View>
          )}

          {/* 2. [+ 디바이스 추가] 버튼 */}
          <View style={styles.addButtonContainer}>
            <Pressable onPress={() => navigation.navigate('DeviceAdd')}>
              <PixelCard centerContent compact>
                <Text style={styles.addText}>+ 디바이스 추가</Text>
              </PixelCard>
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  headerTitle: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },
  content: { paddingBottom: 40 },
  centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addButtonContainer: { marginTop: 30 },
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#888',
    fontSize: 16,
  },

  // 픽셀 테두리 스타일
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
