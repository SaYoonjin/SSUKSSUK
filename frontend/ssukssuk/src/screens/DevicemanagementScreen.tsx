import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';

// 디바이스 데이터 타입 정의
type Device = {
  id: string;
  name: string;
  plantName: string | null;
};

export default function DeviceManagementScreen({ navigation }: any) {
  // 임시 더미 데이터
  const [devices, setDevices] = useState<Device[]>([
    { id: '1', name: '디바이스 1', plantName: '토마토' },
    { id: '2', name: '디바이스 2', plantName: null },
  ]);

  // 연결 해제 핸들러
  const handleDisconnect = (id: string) => {
    Alert.alert('연결 해제', '식물과의 연결을 해제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '해제', onPress: () => console.log(`${id} 해제됨`) },
    ]);
  };

  // 디바이스 삭제 핸들러
  const handleDelete = (id: string) => {
    Alert.alert(
      '디바이스 삭제',
      '정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => {
            setDevices(prev => prev.filter(d => d.id !== id));
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

      {/* 스크롤 영역 */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. 기기 목록 (기본 높이 유지) */}
        {devices.map(device => (
          <PixelCard key={device.id}>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>{device.name}</Text>
              <Text
                style={[
                  styles.plantName,
                  !device.plantName && styles.noConnection,
                ]}
              >
                {device.plantName ? device.plantName : '연결 없음'}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <PixelMiniButton
                label="해제"
                color={GREEN}
                onPress={() => handleDisconnect(device.id)}
                disabled={!device.plantName}
              />
              <View style={{ width: 8 }} />
              <PixelMiniButton
                label="삭제"
                color={ERROR_RED}
                onPress={() => handleDelete(device.id)}
              />
            </View>
          </PixelCard>
        ))}

        {/* 2. [+ 디바이스 추가] 버튼 (높이 줄임 - compact 적용) */}
        <View style={styles.addButtonContainer}>
          <Pressable onPress={() => navigation.navigate('DeviceAdd')}>
            <PixelCard centerContent compact>
              <Text style={styles.addText}>+ 디바이스 추가</Text>
            </PixelCard>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/** * 픽셀 아트 스타일 카드
 * - compact: true일 경우 높이를 줄임
 */
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
      {/* 1. 배경이 되는 내부 콘텐츠를 먼저 그립니다 (가장 밑바닥) */}
      <View
        style={[
          styles.cardInner,
          centerContent && styles.cardCenter,
          compact && styles.cardCompact,
        ]}
      >
        {children}
      </View>

      {/* 2. 테두리와 코너를 그 위에 덧그립니다 (상단 레이어) */}
      <View style={styles.borderTop} />
      <View style={styles.borderBottom} />
      <View style={styles.borderLeft} />
      <View style={styles.borderRight} />

      {/* 이제 코너 픽셀이 흰 배경 위에 나타납니다 */}
      <View style={styles.cornerTL} />
      <View style={styles.cornerTR} />
      <View style={styles.cornerBL} />
      <View style={styles.cornerBR} />
    </View>
  );
}

/** 작은 픽셀 버튼 (해제/삭제) */
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

      {/* [수정] 버튼에도 계단형 코너 추가 */}
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

  addButtonContainer: { marginTop: 30 },

  // 카드 스타일
  cardContainer: { position: 'relative', marginBottom: 16, padding: 4 },

  // 기본 카드 내부 (높이 80)
  cardInner: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafaf6',
    minHeight: 80,
  },

  // 높이를 줄인 컴팩트 스타일 (추가 버튼용)
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

  // [수정됨] 픽셀 테두리 스타일 - 계단형(Beveled) 적용
  // 기본 색상을 #000에서 GREEN으로 변경하여 카드 기본 테두리 색상 적용
  borderTop: {
    position: 'absolute',
    top: 0,
    left: PIXEL * 2, // 양 끝을 2칸 띄움
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
    top: PIXEL * 2, // 상하를 2칸 띄움
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
  // 코너: 테두리와 테두리 사이 징검다리 위치 (1칸 띄움)
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
