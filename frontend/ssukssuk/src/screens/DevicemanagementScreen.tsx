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
import client from '../api';

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
    } finally {
      setLoading(false);
    }
  };

  // 식물 연결 해제 (plantId로 unbind)
  const handleDisconnect = (plantId: number | null) => {
    if (!plantId) {
      Alert.alert('오류', '연결된 식물 정보를 찾을 수 없습니다.');
      return;
    }

    Alert.alert('연결 해제', '식물과 기기의 연결을 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        onPress: async () => {
          try {
            const res = await client.post(`/plants/${plantId}/unbind`);

            if (res.data.success) {
              Alert.alert('완료', '연결이 해제되었습니다.');
              fetchDevices();
            } else {
              Alert.alert(
                  '실패',
                  res.data.error?.message || res.data.message || '해제 실패',
              );
            }
          } catch (e: any) {
            console.error('연결 해제 에러:', e);
            const errorMsg =
                e.response?.data?.message || '서버 통신 중 오류가 발생했습니다.';
            Alert.alert('오류', errorMsg);
          }
        },
      },
    ]);
  };

  // 디바이스 삭제
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

  return (
      <View style={styles.screen}>
        {/* ✅ 헤더: 풀폭 + 아래만 그림자 (통일 버전) */}
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={styles.backBtn}
            >
              <Text style={styles.backChevron}>‹</Text>
            </Pressable>
            <Text style={styles.headerTitle}>디바이스 관리</Text>
          </View>

          <View style={styles.headerBottomShadow}>
            <View style={styles.headerShadowDark} />
            <View style={styles.headerShadowLight} />
          </View>
        </View>

        {/* ✅ 콘텐츠만 패딩 */}
        <View style={styles.contentArea}>
          {loading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={GREEN} />
              </View>
          ) : devices.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={styles.emptyTextDark}>등록된 디바이스가 없습니다.</Text>
              </View>
          ) : (
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
                            onPress={() => handleDisconnect(device.connectedPlantId)}
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

        {/* ✅ 하단 버튼도 콘텐츠 패딩 유지 */}
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

// ---------------- 픽셀 UI 컴포넌트 ----------------

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

const CONTENT_PAD_H = 26;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EDEDE9',
    paddingTop: 45,
    paddingBottom: 20,
  },

  // ✅ 헤더는 풀폭
  headerWrap: {
    marginTop: 6,
    marginBottom: 18,
    backgroundColor: '#EDEDE9',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CONTENT_PAD_H, // ✅ 헤더 글자만 패딩
    paddingBottom: 8,
  },

  // ✅ 아래만 그림자 느낌 (안드에서도 카드처럼 안 뜸)
  headerBottomShadow: {
    height: 8,
    backgroundColor: '#EDEDE9',
  },
  headerShadowDark: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  headerShadowLight: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.55)',
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

  // ✅ 콘텐츠만 패딩
  contentArea: {
    flex: 1,
    marginBottom: 20,
    paddingHorizontal: CONTENT_PAD_H,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 10,
  },
  emptyTextDark: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#555555',
    fontSize: 18,
  },

  // ✅ 하단 버튼도 동일 패딩
  bottomButtonContainer: {
    flexShrink: 0,
    paddingHorizontal: CONTENT_PAD_H,
  },

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
