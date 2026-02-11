import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import Svg, {
    Line,
    Polyline,
    Rect,
    Text as SvgText,
    Circle,
    Path,
    G,
} from 'react-native-svg';
import client from '../api';

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

// ✅ 고정 헤더 높이
const STICKY_HEADER_H = 100;

// API 응답 타입 정의
type HistoryResponse = {
    success: boolean;
    data: {
        plantId: number;
        plantName: string;
        currentImage: {
            imageUrl_top: string;
            imageUrl_side: string;
            capturedAt: string;
        } | null;
        growthGraph: {
            unit: string;
            period: { start: string; end: string };
            data: Array<{ date: string; height: number | null; width: number | null }>;
        };
        sensorAlertGraph: {
            period: { start: string; end: string };
            data: Array<{ date: string; total: number; water: number; nutrient: number }>;
        };
    };
};

export default function HistoryScreen({ navigation }: any) {
    // 상태 관리
    const [loading, setLoading] = useState(true);
    const [periodLabel, setPeriodLabel] = useState('');

    // 사진
    const [photoIndex, setPhotoIndex] = useState(0);
    const [recentPhotos, setRecentPhotos] = useState<string[]>([]);
    const [recentCapturedAt, setRecentCapturedAt] = useState<string>(''); // ✅ RECENT FEED 시간

    // 그래프 데이터
    const [days, setDays] = useState<string[]>([]);
    const [heightValues, setHeightValues] = useState<number[]>([]);
    const [widthValues, setWidthValues] = useState<number[]>([]);

    const [anomalySeries, setAnomalySeries] = useState<any[]>([]);

    // 애니메이션
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollX = useRef(new Animated.Value(0)).current;

    const formatRecentTime = useCallback((iso: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const mi = String(d.getMinutes()).padStart(2, '0');
        return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
    }, []);

    // 데이터 로드 함수
    const fetchHistoryData = async () => {
        setLoading(true);
        try {
            // 1. 전체 식물 목록 조회 -> 메인 식물 찾기
            const plantsRes = await client.get('/plants');
            const plants = plantsRes.data?.data || [];
            const mainPlant = plants.find((p: any) => p.is_main);

            if (!mainPlant) {
                setLoading(false);
                return;
            }

            // 2. 메인 식물 ID로 히스토리 조회
            const res = await client.get<HistoryResponse>(
                `/history/plants/${mainPlant.plant_id}`,
                { params: { period: 14 } },
            );

            if (res.data.success && res.data.data) {
                const d = res.data.data;

                // (1) 사진 처리 + ✅ RECENT FEED 시간
                const photos: string[] = [];
                if (d.currentImage) {
                    if (d.currentImage.imageUrl_top) photos.push(d.currentImage.imageUrl_top);
                    if (d.currentImage.imageUrl_side) photos.push(d.currentImage.imageUrl_side);

                    // capturedAt 표시용
                    if (d.currentImage.capturedAt) setRecentCapturedAt(d.currentImage.capturedAt);
                    else setRecentCapturedAt('');
                } else {
                    setRecentCapturedAt('');
                }
                setRecentPhotos(photos);

                // (2) 기간 라벨 설정 (YYYY.MM.DD)
                if (d.growthGraph?.period) {
                    const start = d.growthGraph.period.start.replace(/-/g, '.');
                    const end = d.growthGraph.period.end.replace(/-/g, '.');
                    setPeriodLabel(`${start} - ${end}`);
                }

                // (3) 생장 그래프 (키/너비) & 날짜 파싱
                const gData = d.growthGraph?.data || [];
                const parsedDays = gData.map(item => item.date.substring(5).replace('-', '.')); // 01.21
                const parsedHeights = gData.map(item => item.height ?? 0);
                const parsedWidths = gData.map(item => item.width ?? 0);

                setDays(parsedDays);
                setHeightValues(parsedHeights);
                setWidthValues(parsedWidths);

                // (4) 이상치 그래프
                const aData = d.sensorAlertGraph?.data || [];
                const waterArr = aData.map(x => x.water ?? 0);
                const nutriArr = aData.map(x => x.nutrient ?? 0);
                const totalArr = aData.map(x => (x.water ?? 0) + (x.nutrient ?? 0));

                setAnomalySeries([
                    { key: 'total', label: '전체', color: '#FF3131', values: totalArr },
                    { key: 'water', label: '수위', color: '#6495ED', values: waterArr },
                    { key: 'nutrient', label: '농도', color: '#9ACD32', values: nutriArr },
                ]);
            }
        } catch (error) {
            console.error('히스토리 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            // 화면 진입 시 페이드 인 & 데이터 로드
            fadeAnim.setValue(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: true,
            }).start();

            fetchHistoryData();
        }, []),
    );

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

    return (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <SafeAreaView style={styles.screen}>
                {/* ✅ 스크롤해도 남는 헤더 + 그림자 */}
                <View style={styles.stickyHeader}>
                    <Text style={styles.headerTitle}>식물 히스토리</Text>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. 최근 모습 (사진) */}
                    <SectionHeader title="최근 모습" />
                    <PixelBox hasShadow style={{ padding: 0 }}>
                        <View style={styles.photoWrap}>
                            {loading ? (
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
                                                <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" />
                                            </View>
                                        ))}
                                    </Animated.View>

                                    {/* ✅ RECENT FEED 뱃지: 점은 위에 고정 + 날짜/시간은 너비에 맞게 아래 */}
                                    <View style={styles.statusBadge}>
                                        <View style={styles.statusTopRow}>
                                            <View style={styles.statusDot} />
                                            <Text style={styles.statusText}>RECENT FEED</Text>
                                        </View>

                                        {!!recentCapturedAt && (
                                            <Text style={styles.statusTimeText}>{formatRecentTime(recentCapturedAt)}</Text>
                                        )}
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
                                                    i === photoIndex ? { backgroundColor: '#FFD700' } : { backgroundColor: '#FFF' },
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

                    {/* 2. 기록 보관소 */}
                    <SectionHeader title="기록 보관소" />
                    <Pressable onPress={() => navigation.navigate('HistoryAlbum', { plantId: 1 })}>
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

                    {/* 3. 생장 그래프 */}
                    <SectionHeader title="생장 그래프" />
                    <PixelBox hasShadow style={styles.chartBox}>
                        {loading ? (
                            <ActivityIndicator color={ACCENT} style={{ margin: 20 }} />
                        ) : (
                            <ChartPager
                                width={SCREEN_WIDTH - 80}
                                height={160}
                                pages={[
                                    {
                                        key: 'height',
                                        titleRight: <LegendItem label="Height(cm)" color={HEIGHT_COLOR} />,
                                        headerLeft: <Text style={styles.periodText}>{periodLabel}</Text>,
                                        render: ({ onTouchingChange, chartWidth }) => (
                                            <GrowthLineChartInteractive
                                                days={days}
                                                values={heightValues}
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
                                        titleRight: <LegendItem label="Width(cm)" color={WIDTH_COLOR} />,
                                        headerLeft: <Text style={styles.periodText}>{periodLabel}</Text>,
                                        render: ({ onTouchingChange, chartWidth }) => (
                                            <GrowthLineChartInteractive
                                                days={days}
                                                values={widthValues}
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
                        )}
                    </PixelBox>

                    {/* 4. 이상치 알람 그래프 */}
                    <SectionHeader title="이상치 알람 그래프" />
                    <PixelBox hasShadow style={styles.chartBox}>
                        <View style={styles.monitorHeader}>
                            <View style={[styles.monitorLed, { backgroundColor: ACCENT }]} />
                            <Text style={styles.monitorTitle}>ANOMALY MONITOR</Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator color={ACCENT} style={{ margin: 20 }} />
                        ) : (
                            <AnomalyButtonPager
                                width={SCREEN_WIDTH - 80}
                                height={180}
                                days={days}
                                series={anomalySeries}
                            />
                        )}
                    </PixelBox>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </Animated.View>
    );
}

// UI 컴포넌트들

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

            <View style={[styles.pagerFrame, { width, height }]} {...panResponder.panHandlers}>
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
                    <Pressable onPress={() => goTo(page - 1)} hitSlop={14} style={[styles.pagerIconBtn, { left: 2 }]}>
                        <PixelChevron dir="left" />
                    </Pressable>
                )}
                {page < pages.length - 1 && (
                    <Pressable onPress={() => goTo(page + 1)} hitSlop={14} style={[styles.pagerIconBtn, { right: 2 }]}>
                        <PixelChevron dir="right" />
                    </Pressable>
                )}
            </View>
        </View>
    );
}

// 이하 AnomalyButtonPager / GrowthLineChartInteractive 동일 (형님 원본 그대로)
// ---- (형님 코드 그대로 유지) ----

function AnomalyButtonPager({ width, height, days, series }: any) {
    const NAV_GUTTER = 18;
    const chartW = width - NAV_GUTTER * 2;

    const fallbackSeries = useMemo(
        () => [
            { key: 'total', label: '전체', color: '#FF3131', values: [] },
            { key: 'water', label: '수위', color: '#6495ED', values: [] },
            { key: 'nutrient', label: '농도', color: '#9ACD32', values: [] },
        ],
        [],
    );

    const safeSeries = Array.isArray(series) && series.length > 0 ? series : fallbackSeries;
    const safeDays = Array.isArray(days) ? days : [];

    const [page, setPage] = useState(0);
    const translateX = useRef(new Animated.Value(0)).current;
    const tabAnims = useRef(safeSeries.map(() => new Animated.Value(0))).current;

    const goTo = (idx: number) => {
        const next = clamp(idx, 0, safeSeries.length - 1);
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

    const current = safeSeries[page];

    return (
        <View>
            <View style={styles.chartHeader}>
                <View style={{ flex: 1 }} />
                {current && <LegendItem label={current?.label} color={current?.color} />}
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
                            width: chartW * safeSeries.length,
                            transform: [{ translateX }],
                        }}
                    >
                        {safeSeries.map((s: any) => (
                            <View key={s.key} style={{ width: chartW, height }}>
                                <GrowthLineChartInteractive
                                    days={safeDays}
                                    values={Array.isArray(s.values) ? s.values : []}
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
                {safeSeries.map((s: any, i: number) => {
                    const active = i === page;
                    const anim = tabAnims[i] || new Animated.Value(0);
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
                                            borderBottomWidth: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [4, 1],
                                            }),
                                            borderRightWidth: anim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [4, 1],
                                            }),
                                            transform: [
                                                {
                                                    translateY: anim.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: [0, 3],
                                                    }),
                                                },
                                            ],
                                        },
                                    ]}
                                >
                                    <Text style={[styles.anomTabText, active && { color: BORDER }]}>{s.label}</Text>
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
    const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);
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
        const s = zoomRange ? clamp(Math.min(zoomRange.start, zoomRange.end), 0, n - 1) : 0;
        const e = zoomRange ? clamp(Math.max(zoomRange.start, zoomRange.end), 0, n - 1) : n - 1;
        return {
            s,
            e,
            sliceDays: Array.isArray(days) ? days.slice(s, e + 1) : [],
            sliceValues: Array.isArray(values) ? values.slice(s, e + 1) : [],
        };
    }, [days, values, zoomRange]);

    const hasData = domain.sliceValues.length > 0;

    const globalLastVisible = domain.s <= globalLastIdx && globalLastIdx <= domain.e;
    const globalLastInSlice = globalLastVisible ? globalLastIdx - domain.s : null;

    const validValues = domain.sliceValues.filter((v: number) => v !== null && v !== undefined);
    const localMin = validValues.length ? Math.min(...validValues) : 0;
    const localMax = validValues.length ? Math.max(...validValues) : 10;

    const min = useMemo(() => localMin * 0.9, [localMin]);
    const max = useMemo(() => (localMax === 0 ? 10 : localMax * 1.1), [localMax]);

    const xStep = useMemo(
        () => (domain.sliceDays.length <= 1 ? 0 : (width - p * 2) / (domain.sliceDays.length - 1)),
        [width, domain.sliceDays.length],
    );

    const yPos = (v: number) => p + (height - p * 2) * (1 - (v - min) / (max - min || 1));

    const points = useMemo(() => {
        if (!hasData || xStep === 0) return '';
        return domain.sliceValues.map((v: any, i: number) => `${p + i * xStep},${yPos(v)}`).join(' ');
    }, [hasData, domain.sliceValues, xStep, min, max, height]);

    const fillPath = useMemo(() => {
        if (!hasData || xStep === 0) return '';
        const line = domain.sliceValues.map((v: any, i: number) => `L${p + i * xStep},${yPos(v)}`).join(' ');
        return `M${p},${height - p} ${line} L${p + (domain.sliceValues.length - 1) * xStep},${height - p} Z`;
    }, [hasData, domain.sliceValues, xStep, min, max, height]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: evt => {
                    if (!hasData || xStep === 0) return;
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
                    if (!hasData || xStep === 0) return;
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
                    if (!hasData || xStep === 0) return;
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
                                Math.round((Math.min(dragStartX.current, dragEndX.current) - p) / xStep),
                                0,
                                domain.sliceValues.length - 1,
                            );
                        const eIdx =
                            domain.s +
                            clamp(
                                Math.round((Math.max(dragStartX.current, dragEndX.current) - p) / xStep),
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
        [domain.s, domain.sliceValues.length, xStep, hasData],
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

                {hasData && fillPath ? <Path d={fillPath} fill={color} fillOpacity={fillOpacity} /> : null}

                {hasData && points ? (
                    <Polyline
                        points={points}
                        fill="none"
                        stroke={color}
                        strokeWidth={3}
                        strokeLinejoin="round"
                    />
                ) : null}

                {hasData &&
                    touching &&
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

                {hasData &&
                    domain.sliceValues.map((v: any, i: number) => {
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

                {hasData && globalLastVisible && globalLastInSlice != null && !touching && (
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

                <Line x1={p} y1={height - p} x2={width - p} y2={height - p} stroke={BORDER} strokeWidth={2} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG_COLOR },

    // ✅ 헤더 고정 + 그림자
    stickyHeader: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: STICKY_HEADER_H,
        backgroundColor: BG_COLOR,
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 14,
        zIndex: 999,

        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 5 },
        elevation: 8,
    },

    // ✅ 헤더가 가리니까 paddingTop 올려줌
    content: { paddingHorizontal: 22, paddingBottom: 40, paddingTop: STICKY_HEADER_H + 10 },

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

    // ✅ RECENT FEED 뱃지 개선 (점 위치 깔끔 + 시간 표시)
    statusBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#1A1A1A',
        paddingHorizontal: 8,
        paddingVertical: 6,
        zIndex: 10,
        minWidth: 100,
    },
    statusTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        backgroundColor: '#FF0000',
    },
    statusText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'NeoDunggeunmoPro-Regular',
    },
    statusTimeText: {
        marginTop: 2,
        color: '#FFF',
        fontSize: 13,
        fontFamily: 'NeoDunggeunmoPro-Regular',
        opacity: 0.9,
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
