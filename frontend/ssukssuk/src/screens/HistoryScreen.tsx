import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Pressable,
  Dimensions,
  Animated,
  PixelRatio,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import Svg, {
  Line,
  Polyline,
  Rect,
  Text as SvgText,
  Circle,
  Path,
  G,
} from 'react-native-svg';
import client from '../api'; // API client (경로 확인 필요)

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CONTENT_PAD_H = 22;
const PIXELBOX_BORDER = 3;
const PHOTO_WIDTH = PixelRatio.roundToNearestPixel(
  SCREEN_WIDTH - CONTENT_PAD_H * 2 - PIXELBOX_BORDER * 2,
);

const BG_COLOR = '#EDEDE9';
const BORDER = '#300e08';
const CARD_BG = '#f6f6f6';
const ACCENT = '#2E5A35';

const HEIGHT_COLOR = '#2E5A35';
const WIDTH_COLOR = '#2F6FED';

// API 데이터 타입 정의
type PlantImage = {
  imageId: number;
  imageUrlTop: string;
  imageUrlSide: string;
  capturedAt: string;
};

export default function HistoryScreen({ navigation }: any) {
  const periodLabel = '2026.01.17 - 2026.01.23';

  // 사진 관련 상태
  const [photoIndex, setPhotoIndex] = useState(0);
  const [recentPhotos, setRecentPhotos] = useState<string[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);

  const scrollX = useRef(new Animated.Value(0)).current;

  // ✅ API 연동: 최신 이미지 가져오기
  useEffect(() => {
    const fetchLatestImages = async () => {
      try {
        // [주의] 실제 사용 시엔 user의 plantId를 동적으로 받아와야 합니다. (현재 1로 고정)
        const plantId = 1;
        const res = await client.get(`/history/plants/${plantId}/images`);

        if (res.data.success && res.data.data.images.length > 0) {
          // 최신순 정렬 (capturedAt 내림차순)
          const sortedImages = res.data.data.images.sort(
            (a: PlantImage, b: PlantImage) =>
              new Date(b.capturedAt).getTime() -
              new Date(a.capturedAt).getTime(),
          );

          // 가장 최신 데이터 하나 선택
          const latest = sortedImages[0];

          // Top, Side 순서로 배열 구성 (null 체크)
          const photos = [latest.imageUrlTop, latest.imageUrlSide].filter(
            (url: string) => url,
          );
          setRecentPhotos(photos);
        }
      } catch (error) {
        console.error('Failed to fetch history images:', error);
      } finally {
        setLoadingPhotos(false);
      }
    };

    fetchLatestImages();
  }, []);

  const runSlide = (newIndex: number) => {
    setPhotoIndex(newIndex);
    Animated.spring(scrollX, {
      toValue: PixelRatio.roundToNearestPixel(-newIndex * PHOTO_WIDTH),
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const goPrev = () => {
    if (photoIndex > 0) runSlide(photoIndex - 1);
  };
  const goNext = () => {
    if (photoIndex < recentPhotos.length - 1) runSlide(photoIndex + 1);
  };

  // --- 더미 데이터 영역 ---
  const dummyDays = [
    '01.17',
    '01.18',
    '01.19',
    '01.20',
    '01.21',
    '01.22',
    '01.23',
  ];
  const dummyGrowth = [4.2, 4.7, 5.3, 5.3, 5.6, 6.1, 6.8];
  const dummyWidth = [2.1, 2.25, 2.35, 2.45, 2.55, 2.7, 2.85];
  const dummyAnomaly = [
    { water: 1, nutrient: 1, tempHum: 2 },
    { water: 3, nutrient: 2, tempHum: 1 },
    { water: 0, nutrient: 1, tempHum: 1 },
    { water: 1, nutrient: 0, tempHum: 0 },
    { water: 1, nutrient: 1, tempHum: 0 },
    { water: 0, nutrient: 1, tempHum: 1 },
    { water: 0, nutrient: 0, tempHum: 1 },
  ];

  const anomalyTotal = dummyAnomaly.map(d => d.water + d.nutrient + d.tempHum);
  const anomalyTempHum = dummyAnomaly.map(d => d.tempHum);
  const anomalyWater = dummyAnomaly.map(d => d.water);
  const anomalyNutrient = dummyAnomaly.map(d => d.nutrient);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>식물 히스토리</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="현재 모습" />
        <PixelBox hasShadow style={{ padding: 0 }}>
          <View style={styles.photoWrap}>
            {loadingPhotos ? (
              <View
                style={[
                  styles.photoContainer,
                  { justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <ActivityIndicator size="large" color={ACCENT} />
              </View>
            ) : recentPhotos.length > 0 ? (
              <>
                <Animated.View
                  style={[
                    styles.slideContainer,
                    {
                      width: PHOTO_WIDTH * recentPhotos.length,
                      transform: [{ translateX: scrollX }],
                    },
                  ]}
                >
                  {recentPhotos.map((url, i) => (
                    <View key={i} style={styles.photoContainer}>
                      <Image
                        source={{ uri: url }}
                        style={styles.photo}
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </Animated.View>

                <View style={styles.statusBadge}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>RECENT FEED</Text>
                </View>

                {photoIndex > 0 && (
                  <Pressable
                    onPress={goPrev}
                    style={[styles.photoNavBtn, { left: 10 }]}
                    hitSlop={10}
                  >
                    <Text style={styles.photoNavText}>◀</Text>
                  </Pressable>
                )}
                {photoIndex < recentPhotos.length - 1 && (
                  <Pressable
                    onPress={goNext}
                    style={[styles.photoNavBtn, { right: 10 }]}
                    hitSlop={10}
                  >
                    <Text style={styles.photoNavText}>▶</Text>
                  </Pressable>
                )}
                <View style={styles.photoIndicatorRow}>
                  {recentPhotos.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.photoDot,
                        i === photoIndex
                          ? { backgroundColor: '#FFD700' }
                          : { backgroundColor: '#FFF' },
                      ]}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View
                style={[
                  styles.photoContainer,
                  { justifyContent: 'center', alignItems: 'center' },
                ]}
              >
                <Text
                  style={{
                    fontFamily: 'NeoDunggeunmoPro-Regular',
                    color: '#666',
                  }}
                >
                  등록된 사진이 없습니다.
                </Text>
              </View>
            )}
          </View>
        </PixelBox>

        <SectionHeader title="기록 보관소" />
        <Pressable
          onPress={() => navigation.navigate('HistoryAlbum', { plantId: 1 })}
        >
          <PixelBox hasShadow style={styles.archiveBar}>
            <View style={styles.folderIcon}>
              <View style={styles.folderTab} />
              <View style={styles.folderBody} />
            </View>
            <View style={styles.archiveTextWrap}>
              <Text style={styles.archiveTitle}>생장 앨범 열기</Text>
            </View>
            <Text style={styles.arrow}>≫</Text>
          </PixelBox>
        </Pressable>

        <SectionHeader title="생장 그래프" />
        <PixelBox hasShadow style={styles.chartBox}>
          <ChartPager
            width={SCREEN_WIDTH - 80}
            height={160}
            pages={[
              {
                key: 'height',
                titleRight: (
                  <LegendItem label="Height(cm)" color={HEIGHT_COLOR} />
                ),
                headerLeft: (
                  <Text style={styles.periodText}>{periodLabel}</Text>
                ),
                render: ({ onTouchingChange, chartWidth }) => (
                  <GrowthLineChartInteractive
                    days={dummyDays}
                    values={dummyGrowth}
                    width={chartWidth}
                    height={160}
                    onTouchingChange={onTouchingChange}
                    color={HEIGHT_COLOR}
                    fillOpacity={0.12}
                  />
                ),
              },
              {
                key: 'width',
                titleRight: (
                  <LegendItem label="Width(cm)" color={WIDTH_COLOR} />
                ),
                headerLeft: (
                  <Text style={styles.periodText}>{periodLabel}</Text>
                ),
                render: ({ onTouchingChange, chartWidth }) => (
                  <GrowthLineChartInteractive
                    days={dummyDays}
                    values={dummyWidth}
                    width={chartWidth}
                    height={160}
                    onTouchingChange={onTouchingChange}
                    color={WIDTH_COLOR}
                    fillOpacity={0.1}
                  />
                ),
              },
            ]}
          />
        </PixelBox>

        <SectionHeader title="이상치 알람 그래프" />
        <PixelBox hasShadow style={styles.chartBox}>
          <View style={styles.monitorHeader}>
            <View style={[styles.monitorLed, { backgroundColor: ACCENT }]} />
            <Text style={styles.monitorTitle}>ANOMALY MONITOR</Text>
          </View>

          <AnomalyButtonPager
            width={SCREEN_WIDTH - 80}
            height={180}
            days={dummyDays}
            series={[
              {
                key: 'total',
                label: '전체',
                color: '#FF3131',
                values: anomalyTotal,
              },
              {
                key: 'tempHum',
                label: '온습도',
                color: '#fd7848',
                values: anomalyTempHum,
              },
              {
                key: 'water',
                label: '수위',
                color: '#6495ED',
                values: anomalyWater,
              },
              {
                key: 'nutrient',
                label: '농도',
                color: '#9ACD32',
                values: anomalyNutrient,
              },
            ]}
          />
        </PixelBox>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// --- 하위 컴포넌트들 ---

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.headerSquare} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function PixelBox({ children, style, hasShadow }: any) {
  return (
    <View style={styles.pixelContainer}>
      {hasShadow && <View style={styles.pixelShadow} />}
      <View style={[styles.pixelBox, style]}>{children}</View>
    </View>
  );
}

function LegendItem({ label, color }: any) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function PixelChevron({ dir }: { dir: 'left' | 'right' }) {
  const s = 4;
  const w = 5;
  const h = 7;
  const LEFT = [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [1, 1, 1, 0, 0],
    [0, 1, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  const RIGHT = [
    [0, 0, 1, 0, 0],
    [0, 0, 1, 1, 0],
    [0, 0, 1, 1, 1],
    [0, 0, 1, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0],
  ];
  const map = dir === 'left' ? LEFT : RIGHT;
  return (
    <Svg width={w * s} height={h * s}>
      {map.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <Rect
              key={`${x}-${y}`}
              x={x * s}
              y={y * s}
              width={s}
              height={s}
              fill="#B3B3B3"
            />
          ) : null,
        ),
      )}
    </Svg>
  );
}

type ChartPagerPage = {
  key: string;
  headerLeft: React.ReactNode;
  titleRight: React.ReactNode;
  render: (args: {
    onTouchingChange: (t: boolean) => void;
    chartWidth: number;
  }) => React.ReactNode;
};

function ChartPager({
  pages,
  width,
  height,
}: {
  pages: ChartPagerPage[];
  width: number;
  height: number;
}) {
  const NAV_GUTTER = 22;
  const chartW = width - NAV_GUTTER * 2;
  const [page, setPage] = useState(0);
  const [chartTouching, setChartTouching] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const goTo = (idx: number) => {
    const next = clamp(idx, 0, pages.length - 1);
    setPage(next);
    Animated.spring(translateX, {
      toValue: -next * chartW,
      useNativeDriver: true,
      friction: 10,
      tension: 60,
    }).start();
  };
  useEffect(() => {
    goTo(page);
  }, []);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, g) => {
          if (chartTouching) return false;
          const dx = Math.abs(g.dx);
          return dx > 10 && dx > Math.abs(g.dy);
        },
        onPanResponderGrant: () => {
          translateX.stopAnimation((v: number) => {
            startX.current = v;
          });
        },
        onPanResponderMove: (_, g) => {
          translateX.setValue(startX.current + g.dx);
        },
        onPanResponderRelease: (_, g) => {
          const threshold = chartW * 0.18;
          if (g.dx < -threshold) goTo(page + 1);
          else if (g.dx > threshold) goTo(page - 1);
          else goTo(page);
        },
        onPanResponderTerminate: () => goTo(page),
      }),
    [page, chartW, pages.length, chartTouching, translateX],
  );
  return (
    <View>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }}>{pages[page]?.headerLeft}</View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {pages[page]?.titleRight}
        </View>
      </View>
      <View
        style={[styles.pagerFrame, { width, height }]}
        {...panResponder.panHandlers}
      >
        <View
          style={{
            position: 'absolute',
            left: NAV_GUTTER,
            right: NAV_GUTTER,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              flexDirection: 'row',
              width: chartW * pages.length,
              transform: [{ translateX }],
            }}
          >
            {pages.map(p => (
              <View key={p.key} style={{ width: chartW, height }}>
                {p.render({
                  onTouchingChange: setChartTouching,
                  chartWidth: chartW,
                })}
              </View>
            ))}
          </Animated.View>
        </View>
        {page > 0 && (
          <Pressable
            onPress={() => goTo(page - 1)}
            hitSlop={14}
            style={[styles.pagerIconBtn, { left: 2 }]}
          >
            <PixelChevron dir="left" />
          </Pressable>
        )}
        {page < pages.length - 1 && (
          <Pressable
            onPress={() => goTo(page + 1)}
            hitSlop={14}
            style={[styles.pagerIconBtn, { right: 2 }]}
          >
            <PixelChevron dir="right" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function AnomalyButtonPager({ width, height, days, series }: any) {
  const NAV_GUTTER = 18;
  const chartW = width - NAV_GUTTER * 2;
  const [page, setPage] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const tabAnims = useRef(series.map(() => new Animated.Value(0))).current;

  const goTo = (idx: number) => {
    const next = clamp(idx, 0, series.length - 1);
    setPage(next);
    Animated.spring(translateX, {
      toValue: -next * chartW,
      useNativeDriver: true,
      friction: 10,
      tension: 60,
    }).start();
  };

  const handlePressIn = (i: number) =>
    Animated.timing(tabAnims[i], {
      toValue: 1,
      duration: 60,
      useNativeDriver: false,
    }).start();
  const handlePressOut = (i: number) =>
    Animated.timing(tabAnims[i], {
      toValue: 0,
      duration: 80,
      useNativeDriver: false,
    }).start();

  const current = series[page];

  return (
    <View>
      <View style={styles.chartHeader}>
        <View style={{ flex: 1 }} />
        <LegendItem label={current?.label} color={current?.color} />
      </View>

      <View style={[styles.pagerFrame, { width, height }]}>
        <View
          style={{
            position: 'absolute',
            left: NAV_GUTTER,
            right: NAV_GUTTER,
            top: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              flexDirection: 'row',
              width: chartW * series.length,
              transform: [{ translateX }],
            }}
          >
            {series.map((s: any) => (
              <View key={s.key} style={{ width: chartW, height }}>
                <GrowthLineChartInteractive
                  days={days}
                  values={s.values}
                  width={chartW}
                  height={height}
                  color={s.color}
                  fillOpacity={0.1}
                />
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      <View style={styles.anomTabRowFixed}>
        {series.map((s: any, i: number) => {
          const active = i === page;
          return (
            <View key={s.key} style={styles.tabWrapper}>
              <Pressable
                onPressIn={() => handlePressIn(i)}
                onPressOut={() => handlePressOut(i)}
                onPress={() => goTo(i)}
                style={{ flex: 1 }}
              >
                <Animated.View
                  style={[
                    styles.pixelTabBtn,
                    active && { borderColor: s.color, backgroundColor: '#FFF' },
                    {
                      borderBottomWidth: tabAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 1],
                      }),
                      borderRightWidth: tabAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [4, 1],
                      }),
                      transform: [
                        {
                          translateY: tabAnims[i].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 3],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Text
                    style={[styles.anomTabText, active && { color: BORDER }]}
                  >
                    {s.label}
                  </Text>
                </Animated.View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GrowthLineChartInteractive({
  days,
  values,
  width,
  height,
  onTouchingChange,
  color = ACCENT,
  fillOpacity = 0.1,
}: any) {
  const p = 20;
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [touching, setTouching] = useState(false);
  const [zoomRange, setZoomRange] = useState<{
    start: number;
    end: number;
  } | null>(null);
  const dragStartX = useRef<number | null>(null);
  const dragEndX = useRef<number | null>(null);
  const tapTs = useRef<number>(0);
  const globalLastIdx = values.length - 1;
  const setTouchingSafe = (t: boolean) => {
    setTouching(t);
    if (typeof onTouchingChange === 'function') onTouchingChange(t);
  };
  const domain = useMemo(() => {
    const n = values.length;
    const s = zoomRange
      ? clamp(Math.min(zoomRange.start, zoomRange.end), 0, n - 1)
      : 0;
    const e = zoomRange
      ? clamp(Math.max(zoomRange.start, zoomRange.end), 0, n - 1)
      : n - 1;
    return {
      s,
      e,
      sliceDays: days.slice(s, e + 1),
      sliceValues: values.slice(s, e + 1),
    };
  }, [days, values, zoomRange]);
  const globalLastVisible =
    domain.s <= globalLastIdx && globalLastIdx <= domain.e;
  const globalLastInSlice = globalLastVisible ? globalLastIdx - domain.s : null;
  const min = useMemo(
    () => Math.min(...domain.sliceValues) * 0.9,
    [domain.sliceValues],
  );
  const max = useMemo(
    () => Math.max(...domain.sliceValues) * 1.1,
    [domain.sliceValues],
  );
  const xStep = useMemo(
    () =>
      domain.sliceDays.length <= 1
        ? 0
        : (width - p * 2) / (domain.sliceDays.length - 1),
    [width, domain.sliceDays.length],
  );
  const yPos = (v: number) =>
    p + (height - p * 2) * (1 - (v - min) / (max - min || 1));
  const points = useMemo(
    () =>
      domain.sliceValues
        .map((v: any, i: number) => `${p + i * xStep},${yPos(v)}`)
        .join(' '),
    [domain.sliceValues, xStep, min, max, height],
  );
  const fillPath = useMemo(() => {
    const line = domain.sliceValues
      .map((v: any, i: number) => `L${p + i * xStep},${yPos(v)}`)
      .join(' ');
    return `M${p},${height - p} ${line} L${
      p + (domain.sliceValues.length - 1) * xStep
    },${height - p} Z`;
  }, [domain.sliceValues, xStep, min, max, height]);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          const now = Date.now();
          if (now - tapTs.current < 280) {
            setZoomRange(null);
            setTouchingSafe(false);
            setActiveIdx(null);
            return;
          }
          tapTs.current = now;
          setTouchingSafe(true);
          dragStartX.current = evt.nativeEvent.locationX;
          setActiveIdx(
            domain.s +
              clamp(
                Math.round((evt.nativeEvent.locationX - p) / xStep),
                0,
                domain.sliceValues.length - 1,
              ),
          );
        },
        onPanResponderMove: evt => {
          dragEndX.current = evt.nativeEvent.locationX;
          setActiveIdx(
            domain.s +
              clamp(
                Math.round((evt.nativeEvent.locationX - p) / xStep),
                0,
                domain.sliceValues.length - 1,
              ),
          );
        },
        onPanResponderRelease: () => {
          setTouchingSafe(false);
          setActiveIdx(null);
          if (
            dragStartX.current != null &&
            dragEndX.current != null &&
            Math.abs(dragEndX.current - dragStartX.current) > 28
          ) {
            const sIdx =
              domain.s +
              clamp(
                Math.round(
                  (Math.min(dragStartX.current, dragEndX.current) - p) / xStep,
                ),
                0,
                domain.sliceValues.length - 1,
              );
            const eIdx =
              domain.s +
              clamp(
                Math.round(
                  (Math.max(dragStartX.current, dragEndX.current) - p) / xStep,
                ),
                0,
                domain.sliceValues.length - 1,
              );
            if (eIdx - sIdx >= 1) setZoomRange({ start: sIdx, end: eIdx });
          }
          dragStartX.current = null;
          dragEndX.current = null;
        },
        onPanResponderTerminate: () => {
          setTouchingSafe(false);
          setActiveIdx(null);
        },
      }),
    [domain.s, domain.sliceValues.length, xStep],
  );
  return (
    <View style={{ width, height }} {...panResponder.panHandlers}>
      <Svg width={width} height={height}>
        {[0, 1, 2, 3, 4].map(i => (
          <Line
            key={i}
            x1={p}
            y1={p + (i * (height - p * 2)) / 4}
            x2={width - p}
            y2={p + (i * (height - p * 2)) / 4}
            stroke="#D9D9D9"
            strokeWidth={1}
          />
        ))}
        <Path d={fillPath} fill={color} fillOpacity={fillOpacity} />
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {touching &&
          dragStartX.current != null &&
          dragEndX.current != null &&
          Math.abs(dragEndX.current - dragStartX.current) > 28 && (
            <Rect
              x={Math.min(dragStartX.current, dragEndX.current)}
              y={p}
              width={Math.abs(dragEndX.current - dragStartX.current)}
              height={height - p * 2}
              fill={color}
              fillOpacity={0.08}
            />
          )}
        {domain.sliceValues.map((v: any, i: number) => {
          const cx = p + i * xStep;
          const cy = yPos(v);
          const isActive = (activeIdx ?? -1) - domain.s === i && touching;
          return (
            <G key={i}>
              <Circle
                cx={cx}
                cy={cy}
                r={domain.s + i === globalLastIdx || isActive ? 6 : 4}
                fill={CARD_BG}
                stroke={color}
                strokeWidth={isActive ? 3 : 2}
              />
              {(i === 0 || i === domain.sliceValues.length - 1 || isActive) && (
                <SvgText
                  x={cx}
                  y={height - 5}
                  fontSize="12"
                  textAnchor="middle"
                  fill="#999"
                  fontFamily="NeoDunggeunmoPro-Regular"
                >
                  {domain.sliceDays[i]}
                </SvgText>
              )}
              {isActive && i !== domain.sliceValues.length - 1 && (
                <G>
                  <Line
                    x1={cx}
                    y1={p}
                    x2={cx}
                    y2={height - p}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  <SvgText
                    x={cx}
                    y={p - 8}
                    fontSize="14"
                    textAnchor="middle"
                    fill={BORDER}
                    fontFamily="NeoDunggeunmoPro-Regular"
                  >
                    {v}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}
        {globalLastVisible && globalLastInSlice != null && !touching && (
          <SvgText
            x={p + globalLastInSlice * xStep}
            y={p - 8}
            fontSize="16"
            textAnchor="middle"
            fill={BORDER}
            fontFamily="NeoDunggeunmoPro-Regular"
          >
            {domain.sliceValues[globalLastInSlice]}
          </SvgText>
        )}
        <Line
          x1={p}
          y1={height - p}
          x2={width - p}
          y2={height - p}
          stroke={BORDER}
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_COLOR },
  content: { paddingHorizontal: 22, paddingBottom: 40, paddingTop: 0 },
  header: { marginTop: 60, marginBottom: 20, alignItems: 'center' },
  headerTitle: {
    fontSize: 30,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 12,
  },
  headerSquare: {
    width: 10,
    height: 10,
    backgroundColor: 'rgba(36,46,19,0.9)',
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },
  pixelContainer: { marginBottom: 8, position: 'relative' },
  pixelShadow: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: -4,
    bottom: -4,
    backgroundColor: BORDER,
  },
  pixelBox: {
    backgroundColor: CARD_BG,
    borderWidth: 3,
    borderColor: BORDER,
    padding: 12,
  },
  photoWrap: {
    width: PHOTO_WIDTH,
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: BORDER,
  },
  slideContainer: { flexDirection: 'row', height: '100%' },
  photoContainer: {
    width: PHOTO_WIDTH,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: BORDER,
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    zIndex: 10,
  },
  statusDot: {
    width: 6,
    height: 6,
    backgroundColor: '#FF0000',
    marginRight: 5,
  },
  statusText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },
  photoNavBtn: {
    position: 'absolute',
    top: '45%',
    backgroundColor: 'rgba(26,26,26,0.6)',
    padding: 8,
    borderRadius: 2,
    zIndex: 20,
  },
  photoNavText: { color: '#FFF', fontSize: 16 },
  photoIndicatorRow: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  photoDot: { width: 6, height: 6, borderWidth: 1, borderColor: BORDER },
  archiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  folderIcon: { width: 28, height: 20, marginRight: 15, position: 'relative' },
  folderTab: {
    width: 10,
    height: 4,
    backgroundColor: BORDER,
    position: 'absolute',
    top: -4,
  },
  folderBody: {
    flex: 1,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: '#EEE',
  },
  archiveTextWrap: { flex: 1 },
  archiveTitle: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },

  arrow: { fontSize: 12, color: BORDER, fontWeight: 'bold' },
  chartBox: { padding: 12 },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
    gap: 10,
  },
  periodText: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#666',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 10,
  },
  legendDot: { width: 8, height: 8, borderWidth: 1, borderColor: BORDER },
  legendText: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: BORDER,
  },
  monitorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 5,
  },
  monitorLed: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
  monitorTitle: {
    fontSize: 16,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: BORDER,
  },
  pagerFrame: { position: 'relative' },
  pagerIconBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: 'transparent',
    zIndex: 30,
  },

  /* 이상치 고정 높이 탭 스타일 */
  anomTabRowFixed: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 15,
    height: 50,
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  tabWrapper: {
    flex: 1,
    height: 50,
  },
  pixelTabBtn: {
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: BORDER,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anomTabText: {
    fontFamily: 'NeoDunggeunmoPro-Regular',
    fontSize: 13,
    color: '#888',
  },
});
