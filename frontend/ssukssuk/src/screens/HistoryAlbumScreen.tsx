import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import client from '../api';

const { height: SCREEN_H } = Dimensions.get('window');

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
  rawCapturedAt: string;
  tapeStyle: {
    rotate: string;
    translateX: number;
    width: string;
  };
};

function formatDotDate(dateStr: string) {
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

  // ✅ Viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const currentPhoto = photoData[viewerIndex];

  const clampIndex = (idx: number) => {
    if (idx < 0) return 0;
    if (idx > photoData.length - 1) return photoData.length - 1;
    return idx;
  };

  const goPrev = () => setViewerIndex(prev => clampIndex(prev - 1));
  const goNext = () => setViewerIndex(prev => clampIndex(prev + 1));

  // ✅ 모달 좌우 스와이프
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => {
        const dx = Math.abs(g.dx);
        const dy = Math.abs(g.dy);
        return dx > 12 && dx > dy;
      },
      onPanResponderRelease: (_, g) => {
        const TH = 60;
        if (g.dx > TH) goPrev();
        else if (g.dx < -TH) goNext();
      },
    });
  }, [photoData.length]);

  useEffect(() => {
    const fetchMainPlantImages = async () => {
      try {
        const plantsRes = await client.get('/plants');
        const plants = plantsRes.data?.data || [];
        const mainPlant = plants.find((p: any) => p.is_main);

        if (!mainPlant) {
          setLoading(false);
          return;
        }

        const targetId = mainPlant.plant_id;
        const res = await client.get(`/history/plants/${targetId}/images`);

        if (res.data.success && res.data.data.images) {
          const images: PlantImage[] = res.data.data.images;

          images.sort(
              (a, b) =>
                  new Date(b.capturedAt).getTime() -
                  new Date(a.capturedAt).getTime(),
          );

          if (images.length > 0) {
            const start = formatDotDate(images[images.length - 1].capturedAt);
            const end = formatDotDate(images[0].capturedAt);
            setPeriodText(`${start} - ${end}`);
          }

          const displayList: DisplayPhoto[] = images.flatMap(item => {
            const dateLabel = formatDotDate(item.capturedAt);

            const getTapeStyle = () => ({
              rotate: `${(Math.random() * 14 - 9).toFixed(1)}deg`,
              translateX: Math.random() * 20 - 10,
              width: `${50 + Math.random() * 8}%`,
            });

            const result: DisplayPhoto[] = [];

            if (item.imageUrlTop) {
              result.push({
                id: `${item.imageId}_top`,
                imgUri: item.imageUrlTop,
                dateLabel: `${dateLabel} (Top)`,
                rawCapturedAt: item.capturedAt,
                tapeStyle: getTapeStyle(),
              });
            }

            if (item.imageUrlSide) {
              result.push({
                id: `${item.imageId}_side`,
                imgUri: item.imageUrlSide,
                dateLabel: `${dateLabel} (Side)`,
                rawCapturedAt: item.capturedAt,
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
        {/* ✅ 헤더: 풀폭 + 아래로만 그림자 */}
        {/* ✅ 헤더(그림자 없음) + 아래만 그림자 바 */}
        <View style={styles.headerWrap}>
          <View style={styles.headerRow}>
            <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={10}
                style={styles.backBtn}
            >
              <Text style={styles.backChevron}>‹</Text>
            </Pressable>
            <Text style={styles.title}>생장 앨범</Text>
          </View>

          {/* ✅ 아래만 ‘그림자 느낌’ (2줄) */}
          <View style={styles.headerBottomShadow}>
            <View style={styles.headerShadowDark} />
            <View style={styles.headerShadowLight} />
          </View>
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
                    photoData.map((item, index) => (
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
                              <Pressable
                                  onPress={() => {
                                    setViewerIndex(index);
                                    setViewerOpen(true);
                                  }}
                              >
                                <Image
                                    source={{ uri: item.imgUri }}
                                    style={styles.photo}
                                    resizeMode="cover"
                                />
                              </Pressable>
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
                      <Text style={styles.emptyText}>저장된 사진이 없습니다.</Text>
                    </View>
                )}
              </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* ✅ 심플 모달: 검은 반투명 + 사진 + X + 날짜 */}
        <Modal
            visible={viewerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setViewerOpen(false)}
        >
          <Pressable
              style={styles.viewerBackdrop}
              onPress={() => setViewerOpen(false)}
          >
            <Pressable style={styles.viewerInner} onPress={() => {}}>
              <Pressable
                  onPress={() => setViewerOpen(false)}
                  hitSlop={12}
                  style={styles.viewerCloseBtn}
              >
                <Text style={styles.viewerCloseText}>✕</Text>
              </Pressable>

              <View style={styles.viewerImageWrap} {...panResponder.panHandlers}>
                {currentPhoto ? (
                    <Image
                        source={{ uri: currentPhoto.imgUri }}
                        style={styles.viewerImage}
                        resizeMode="contain"
                    />
                ) : null}
              </View>

              {!!currentPhoto?.dateLabel && (
                  <View style={styles.viewerDatePill}>
                    <Text style={styles.viewerDateText}>{currentPhoto.dateLabel}</Text>
                  </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: 45,
  },

  headerWrap: {
    backgroundColor: BG_COLOR,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: BG_COLOR,

    // ❌ 여기서 shadow/elevation 전부 제거
    // shadowColor: ...
    // elevation: ...
  },

  headerBottomShadow: {
    height: 8,
    backgroundColor: BG_COLOR,
  },

  headerShadowDark: {
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.18)',  // 아래 어두운 선
  },

  headerShadowLight: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.55)', // 그 밑에 밝은 선
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

  // ✅ content에만 좌우 패딩 적용
  content: {
    paddingTop: 8,
    paddingHorizontal: 20,
  },

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
    overflow: 'hidden',
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

  emptyText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#888',
    fontSize: 16,
  },

  // =========================
  // ✅ Viewer Modal (심플)
  // =========================
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  viewerInner: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewerCloseBtn: {
    position: 'absolute',
    top: 6,
    right: 8,
    zIndex: 30,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  viewerCloseText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 22,
    color: '#fff',
  },

  viewerImageWrap: {
    width: '100%',
    height: SCREEN_H * 0.72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },

  viewerDatePill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  viewerDateText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 16,
    color: '#fff',
    opacity: 0.92,
  },
});
