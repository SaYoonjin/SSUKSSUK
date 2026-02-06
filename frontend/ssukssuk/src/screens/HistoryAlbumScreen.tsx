import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import client from '../api';

const BG_COLOR = '#EDEDE9';
const BORDER = '#300e08';
const CARD_BG = '#FFFEF6';
const SHADOW = '#4A4A4A';
const ACCENT = 'rgba(243,253,224,0.9)';

// API 데이터 타입 정의
type PlantImage = {
  imageId: number;
  imageUrlTop: string;
  imageUrlSide: string;
  capturedAt: string;
};

// UI 표시용 데이터 타입
type DisplayPhoto = {
  id: string;
  imgUri: string;
  dateLabel: string;
  tapeStyle: {
    rotate: string;
    translateX: number;
    width: string;
  };
};

function formatDotDate(dateStr: string) {
  // 2026-01-30T14:08:41 -> 2026.01.30
  if (!dateStr) return '';
  return dateStr.split('T')[0].replace(/-/g, '.');
}

const PixelTape = ({ style, width }: any) => (
  <View style={[styles.tapeContainer, { width: width || '65%' }, style]}>
    <View style={styles.tapeBody}>
      <View style={styles.endCapLeft} />
      <View style={styles.endCapRight} />

      <View style={[styles.zigzagCut, { left: -6 }]}>
        {[...Array(3)].map((_, i) => (
          <View key={`l-${i}`} style={styles.cutPiece} />
        ))}
      </View>

      <View style={styles.tapeHighlight} />

      <View style={[styles.zigzagCut, { right: -6 }]}>
        {[...Array(3)].map((_, i) => (
          <View key={`r-${i}`} style={styles.cutPiece} />
        ))}
      </View>
    </View>
  </View>
);

export default function HistoryAlbumScreen({ navigation }: any) {
  const [photoData, setPhotoData] = useState<DisplayPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodText, setPeriodText] = useState('');

  useEffect(() => {
    const fetchMainPlantImages = async () => {
      try {
        // 1. 전체 식물 목록 조회 및 메인 식물 탐색
        const plantsRes = await client.get('/plants');
        const plants = plantsRes.data?.data || [];
        const mainPlant = plants.find((p: any) => p.is_main);

        if (!mainPlant) {
          // 메인 식물이 없는 경우 로딩 종료
          setLoading(false);
          return;
        }

        // 2. 메인 식물 ID로 이미지 조회
        const targetId = mainPlant.plant_id;
        const res = await client.get(`/history/plants/${targetId}/images`);

        if (res.data.success && res.data.data.images) {
          const images: PlantImage[] = res.data.data.images;

          // 최신순 정렬
          images.sort(
            (a, b) =>
              new Date(b.capturedAt).getTime() -
              new Date(a.capturedAt).getTime(),
          );

          // 전체 기간 텍스트 설정
          if (images.length > 0) {
            const start = formatDotDate(images[images.length - 1].capturedAt);
            const end = formatDotDate(images[0].capturedAt);
            setPeriodText(`${start} - ${end}`);
          }

          // UI 데이터로 변환
          const displayList: DisplayPhoto[] = images.flatMap(item => {
            const dateLabel = formatDotDate(item.capturedAt);

            const getTapeStyle = () => ({
              rotate: `${(Math.random() * 14 - 9).toFixed(1)}deg`,
              translateX: Math.random() * 20 - 10,
              width: `${50 + Math.random() * 8}%`,
            });

            const result = [];

            if (item.imageUrlTop) {
              result.push({
                id: `${item.imageId}_top`,
                imgUri: item.imageUrlTop,
                dateLabel: `${dateLabel} (Top)`,
                tapeStyle: getTapeStyle(),
              });
            }

            if (item.imageUrlSide) {
              result.push({
                id: `${item.imageId}_side`,
                imgUri: item.imageUrlSide,
                dateLabel: `${dateLabel} (Side)`,
                tapeStyle: getTapeStyle(),
              });
            }

            return result;
          });

          setPhotoData(displayList);
        }
      } catch (error) {
        console.error('Album fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMainPlantImages();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.title}>생장 앨범</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodBar}>
          <Text style={styles.periodText}>{periodText || '기록 없음'}</Text>
        </View>

        {loading ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color="#2E5A35" />
          </View>
        ) : (
          <View style={styles.grid}>
            {photoData.length > 0 ? (
              photoData.map(item => (
                <View key={item.id} style={styles.cardContainer}>
                  <PixelTape
                    width={item.tapeStyle.width}
                    style={{
                      transform: [
                        { rotate: item.tapeStyle.rotate },
                        { translateX: item.tapeStyle.translateX },
                      ],
                      marginBottom: -12,
                      zIndex: 10,
                    }}
                  />

                  <View style={styles.card}>
                    <View style={styles.photoFrame}>
                      <Image
                        source={{ uri: item.imgUri }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.captionWrapper}>
                      <View style={styles.captionLine} />
                      <View style={styles.captionLabel}>
                        <Text style={styles.caption}>{item.dateLabel}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View
                style={{ width: '100%', alignItems: 'center', marginTop: 50 }}
              >
                <Text
                  style={{
                    fontFamily: 'NeoDunggeunmoPro-Regular',
                    color: '#888',
                    fontSize: 16,
                  }}
                >
                  저장된 사진이 없습니다.
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 26,
  },
  backBtn: { paddingRight: 10 },
  backChevron: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },
  title: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 34,
    color: 'rgba(36,46,19,0.9)',
  },
  content: { paddingTop: 8 },

  periodBar: {
    backgroundColor: '#dedfde',
    borderWidth: 2,
    borderColor: BORDER,
    padding: 12,
    marginBottom: 35,
    borderTopColor: SHADOW,
    borderLeftColor: SHADOW,
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
  },
  periodText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 24,
    color: 'rgba(36,46,19,0.9)',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  cardContainer: {
    width: '48%',
    marginBottom: 28,
    alignItems: 'center',
  },

  tapeContainer: {
    height: 18,
    overflow: 'hidden',
  },
  tapeBody: {
    flex: 1,
    backgroundColor: ACCENT,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  endCapLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BG_COLOR,
    zIndex: 20,
  },
  endCapRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: BG_COLOR,
    zIndex: 20,
  },

  zigzagCut: {
    position: 'absolute',
    width: 12,
    height: '140%',
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 5,
  },
  cutPiece: {
    width: 10,
    height: 10,
    backgroundColor: BG_COLOR,
    borderWidth: 2,
    borderColor: BORDER,
    transform: [{ rotate: '45deg' }],
  },
  tapeHighlight: {
    width: '80%',
    height: 2,
    backgroundColor: '#FFF',
    opacity: 0.3,
  },

  card: {
    width: '100%',
    backgroundColor: CARD_BG,
    borderWidth: 2.5,
    borderColor: BORDER,
    padding: 8,
    borderBottomWidth: 6,
    borderRightWidth: 4,
  },
  photoFrame: {
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: 'rgba(36,46,19,0.9)',
    marginBottom: 10,
  },
  photo: {
    width: '100%',
    height: 105,
  },
  captionWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  captionLine: {
    width: '80%',
    height: 2,
    backgroundColor: BORDER,
    opacity: 0.1,
    position: 'absolute',
    bottom: 4,
  },
  captionLabel: {
    paddingHorizontal: 10,
    backgroundColor: CARD_BG,
  },
  caption: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 16,
    color: 'rgba(36,46,19,0.9)',
    letterSpacing: 0.5,
  },
});
