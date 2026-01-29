import React, { useState, useRef, useMemo, useEffect } from "react";
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
} from "react-native";
import Svg, { Line, Polyline, Rect, Text as SvgText, Circle, Path, G } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CONTENT_PAD_H = 22;
const PIXELBOX_BORDER = 3;
const PHOTO_WIDTH = PixelRatio.roundToNearestPixel(
    SCREEN_WIDTH - CONTENT_PAD_H * 2 - PIXELBOX_BORDER * 2
);

const BG_COLOR = "#EDEDE9";
const BORDER = "#300e08";
const CARD_BG = "#f6f6f6";
const ACCENT = "#2E5A35";

const HEIGHT_COLOR = "#2E5A35";
const WIDTH_COLOR = "#2F6FED";

const SAMPLE_PLANT_IMG = require("../assets/tomato_pic_1.jpg");
const SAMPLE_PLANT_IMG_2 = require("../assets/tomato_pic_2.jpg");

export default function HistoryScreen({ navigation }: any) {
    const periodLabel = "2026.01.17 - 2026.01.23";

    const [photoIndex, setPhotoIndex] = useState(0);
    const photos = [SAMPLE_PLANT_IMG, SAMPLE_PLANT_IMG_2];
    const scrollX = useRef(new Animated.Value(0)).current;

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
        if (photoIndex < photos.length - 1) runSlide(photoIndex + 1);
    };

    // ✅ 훅(useMemo) 쓰지 말고 그냥 계산: Fast Refresh 훅 mismatch 방지
    const anomalyTotal = dummyAnomaly.map((d) => d.water + d.nutrient + d.tempHum);
    const anomalyTempHum = dummyAnomaly.map((d) => d.tempHum);
    const anomalyWater = dummyAnomaly.map((d) => d.water);
    const anomalyNutrient = dummyAnomaly.map((d) => d.nutrient);

    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>식물 히스토리</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <SectionHeader title="현재 모습" />
                <PixelBox hasShadow style={{ padding: 0 }}>
                    <View style={styles.photoWrap}>
                        <Animated.View style={[styles.slideContainer, { transform: [{ translateX: scrollX }] }]}>
                            {photos.map((img, i) => (
                                <View key={i} style={styles.photoContainer}>
                                    <Image source={img} style={styles.photo} resizeMode="cover" />
                                </View>
                            ))}
                        </Animated.View>

                        <View style={styles.statusBadge}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusText}>RECENT FEED</Text>
                        </View>

                        {photoIndex > 0 && (
                            <Pressable onPress={goPrev} style={[styles.photoNavBtn, { left: 10 }]} hitSlop={10}>
                                <Text style={styles.photoNavText}>◀</Text>
                            </Pressable>
                        )}
                        {photoIndex < photos.length - 1 && (
                            <Pressable onPress={goNext} style={[styles.photoNavBtn, { right: 10 }]} hitSlop={10}>
                                <Text style={styles.photoNavText}>▶</Text>
                            </Pressable>
                        )}

                        <View style={styles.photoIndicatorRow}>
                            {photos.map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.photoDot,
                                        i === photoIndex ? { backgroundColor: "#FFD700" } : { backgroundColor: "#FFF" },
                                    ]}
                                />
                            ))}
                        </View>
                    </View>
                </PixelBox>

                <SectionHeader title="기록 보관소" />
                <Pressable
                    onPress={() => {
                        navigation.navigate("HistoryAlbum", {
                            start: "2026.01.10",
                            end: "2026.01.23",
                        });
                    }}
                >
                    <PixelBox hasShadow style={styles.archiveBar}>
                        <View style={styles.folderIcon}>
                            <View style={styles.folderTab} />
                            <View style={styles.folderBody} />
                        </View>
                        <View style={styles.archiveTextWrap}>
                            <Text style={styles.archiveTitle}>생장 앨범 열기</Text>
                            <Text style={styles.archiveSub}>TOTAL 28 RECORDS FOUND</Text>
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
                                key: "height",
                                titleRight: <LegendItem label="Height(cm)" color={HEIGHT_COLOR} />,
                                headerLeft: <Text style={styles.periodText}>{periodLabel}</Text>,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={dummyGrowth}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
                                        height={160}
                                        onTouchingChange={onTouchingChange}
                                        color={HEIGHT_COLOR}
                                        fillOpacity={0.12}
                                    />
                                ),
                            },
                            {
                                key: "width",
                                titleRight: <LegendItem label="Width(cm)" color={WIDTH_COLOR} />,
                                headerLeft: <Text style={styles.periodText}>{periodLabel}</Text>,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={dummyWidth}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
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

                    {/* 누적막대 제거 → 생장 그래프(라인) 동일 UX / 4페이지 스와이프 */}
                    <ChartPager
                        width={SCREEN_WIDTH - 80}
                        height={180}
                        pages={[
                            {
                                key: "anom_total",
                                headerLeft: <View />,
                                titleRight: <LegendItem label="전체(합산)" color="#FF3131" />,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={anomalyTotal}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
                                        height={180}
                                        onTouchingChange={onTouchingChange}
                                        color="#FF3131"
                                        fillOpacity={0.1}
                                    />
                                ),
                            },
                            {
                                key: "anom_tempHum",
                                headerLeft: <View />,
                                titleRight: <LegendItem label="온습도" color={"#fd7848"} />,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={anomalyTempHum}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
                                        height={180}
                                        onTouchingChange={onTouchingChange}
                                        color={"#fd7848"}
                                        fillOpacity={0.08}
                                    />
                                ),
                            },
                            {
                                key: "anom_water",
                                headerLeft: <View />,
                                titleRight: <LegendItem label="수위" color={"#6495ED"} />,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={anomalyWater}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
                                        height={180}
                                        onTouchingChange={onTouchingChange}
                                        color={"#6495ED"}
                                        fillOpacity={0.08}
                                    />
                                ),
                            },
                            {
                                key: "anom_nutrient",
                                headerLeft: <View />,
                                titleRight: <LegendItem label="농도" color={"#9ACD32"} />,
                                render: ({ onTouchingChange }) => (
                                    <GrowthLineChartInteractive
                                        days={dummyDays}
                                        values={anomalyNutrient}
                                        width={SCREEN_WIDTH - 80 - 34 * 2}
                                        height={180}
                                        onTouchingChange={onTouchingChange}
                                        color={"#9ACD32"}
                                        fillOpacity={0.08}
                                    />
                                ),
                            },
                        ]}
                    />

                </PixelBox>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

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

/* ---------------------------
   픽셀 아이콘 느낌 화살표
   - 박스 없음, 아이콘만
   - 색상 변경: PixelChevron 내부 fill="#B3B3B3"
---------------------------- */
function PixelChevron({ dir }: { dir: "left" | "right" }) {
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

    const map = dir === "left" ? LEFT : RIGHT;

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
                    ) : null
                )
            )}
        </Svg>
    );
}

type ChartPagerPage = {
    key: string;
    headerLeft: React.ReactNode;
    titleRight: React.ReactNode;
    render: (args: { onTouchingChange: (t: boolean) => void }) => React.ReactNode;
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
    const NAV_GUTTER = 34;
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => false,
                onMoveShouldSetPanResponder: (_, g) => {
                    if (chartTouching) return false;
                    const dx = Math.abs(g.dx);
                    const dy = Math.abs(g.dy);
                    return dx > 10 && dx > dy;
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
        [page, chartW, pages.length, chartTouching, translateX]
    );

    return (
        <View>
            <View style={styles.chartHeader}>
                <View style={{ flex: 1 }}>{pages[page]?.headerLeft}</View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>{pages[page]?.titleRight}</View>
            </View>

            <View style={[styles.pagerFrame, { width, height }]} {...panResponder.panHandlers}>
                <View
                    style={{
                        position: "absolute",
                        left: NAV_GUTTER,
                        right: NAV_GUTTER,
                        top: 0,
                        bottom: 0,
                        overflow: "hidden",
                    }}
                >
                    <Animated.View
                        style={{
                            flexDirection: "row",
                            width: chartW * pages.length,
                            transform: [{ translateX }],
                        }}
                    >
                        {pages.map((p) => (
                            <View key={p.key} style={{ width: chartW, height }}>
                                {p.render({ onTouchingChange: setChartTouching })}
                            </View>
                        ))}
                    </Animated.View>
                </View>

                {page > 0 && (
                    <Pressable
                        onPress={() => goTo(page - 1)}
                        hitSlop={14}
                        android_ripple={{ color: "rgba(26,26,26,0.10)", borderless: true }}
                        style={[styles.pagerIconBtn, { left: 8 }]}
                    >
                        <PixelChevron dir="left" />
                    </Pressable>
                )}
                {page < pages.length - 1 && (
                    <Pressable
                        onPress={() => goTo(page + 1)}
                        hitSlop={14}
                        android_ripple={{ color: "rgba(26,26,26,0.10)", borderless: true }}
                        style={[styles.pagerIconBtn, { right: 8 }]}
                    >
                        <PixelChevron dir="right" />
                    </Pressable>
                )}
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
    const p = 30;

    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const [touching, setTouching] = useState(false);

    const [zoomRange, setZoomRange] = useState<{ start: number; end: number } | null>(null);

    const dragStartX = useRef<number | null>(null);
    const dragEndX = useRef<number | null>(null);
    const tapTs = useRef<number>(0);

    const globalLastIdx = values.length - 1;

    const setTouchingSafe = (t: boolean) => {
        setTouching(t);
        if (typeof onTouchingChange === "function") onTouchingChange(t);
    };

    const domain = useMemo(() => {
        const n = values.length;
        const s = zoomRange ? clamp(Math.min(zoomRange.start, zoomRange.end), 0, n - 1) : 0;
        const e = zoomRange ? clamp(Math.max(zoomRange.start, zoomRange.end), 0, n - 1) : n - 1;

        const sliceDays = days.slice(s, e + 1);
        const sliceValues = values.slice(s, e + 1);
        return { s, e, sliceDays, sliceValues };
    }, [days, values, zoomRange]);

    const globalLastVisible = domain.s <= globalLastIdx && globalLastIdx <= domain.e;
    const globalLastInSlice = globalLastVisible ? globalLastIdx - domain.s : null;

    const min = useMemo(() => Math.min(...domain.sliceValues) * 0.9, [domain.sliceValues]);
    const max = useMemo(() => Math.max(...domain.sliceValues) * 1.1, [domain.sliceValues]);

    const xStep = useMemo(() => {
        const n = domain.sliceDays.length;
        return n <= 1 ? 0 : (width - p * 2) / (n - 1);
    }, [width, domain.sliceDays.length]);

    const yPos = (v: number) => p + (height - p * 2) * (1 - (v - min) / (max - min || 1));

    const points = useMemo(() => {
        return domain.sliceValues
            .map((v: number, i: number) => `${p + i * xStep},${yPos(v)}`)
            .join(" ");
    }, [domain.sliceValues, xStep, min, max, width, height]);

    const fillPath = useMemo(() => {
        const baseY = height - p;
        const line = domain.sliceValues
            .map((v: number, i: number) => `L${p + i * xStep},${yPos(v)}`)
            .join(" ");
        const lastX = p + (domain.sliceValues.length - 1) * xStep;
        return `M${p},${baseY} ${line} L${lastX},${baseY} Z`;
    }, [domain.sliceValues, xStep, min, max, width, height]);

    const valueIdxToX = (idxInSlice: number) => p + idxInSlice * xStep;

    const xToNearestIdx = (x: number) => {
        const n = domain.sliceValues.length;
        if (n <= 1) return 0;
        const rel = (x - p) / xStep;
        return clamp(Math.round(rel), 0, n - 1);
    };

    const sliceIdxToGlobalIdx = (idxInSlice: number) => domain.s + idxInSlice;

    const computeActiveFromX = (x: number) => {
        const idxInSlice = xToNearestIdx(x);
        setActiveIdx(sliceIdxToGlobalIdx(idxInSlice));
    };

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,

                onPanResponderGrant: (evt) => {
                    const now = Date.now();
                    if (now - tapTs.current < 280) {
                        setZoomRange(null);
                        setTouchingSafe(false);
                        setActiveIdx(null);
                        dragStartX.current = null;
                        dragEndX.current = null;
                        tapTs.current = 0;
                        return;
                    }
                    tapTs.current = now;

                    setTouchingSafe(true);
                    const x = evt.nativeEvent.locationX;
                    dragStartX.current = x;
                    dragEndX.current = x;
                    computeActiveFromX(x);
                },

                onPanResponderMove: (evt) => {
                    const x = evt.nativeEvent.locationX;
                    dragEndX.current = x;
                    computeActiveFromX(x);
                },

                onPanResponderRelease: () => {
                    const sX = dragStartX.current;
                    const eX = dragEndX.current;

                    setTouchingSafe(false);
                    setActiveIdx(null);

                    if (sX == null || eX == null) return;

                    const dist = Math.abs(eX - sX);
                    if (dist < 28) return;

                    const sIdx = xToNearestIdx(Math.min(sX, eX));
                    const eIdx = xToNearestIdx(Math.max(sX, eX));

                    const globalStart = sliceIdxToGlobalIdx(sIdx);
                    const globalEnd = sliceIdxToGlobalIdx(eIdx);

                    if (Math.abs(globalEnd - globalStart) < 1) return;

                    setZoomRange({ start: globalStart, end: globalEnd });

                    dragStartX.current = null;
                    dragEndX.current = null;
                },

                onPanResponderTerminate: () => {
                    setTouchingSafe(false);
                    setActiveIdx(null);
                    dragStartX.current = null;
                    dragEndX.current = null;
                },
            }),
        [domain.s, domain.sliceValues.length, xStep]
    );

    const activeInSlice =
        activeIdx == null ? null : clamp(activeIdx - domain.s, 0, domain.sliceValues.length - 1);

    const showX = activeInSlice == null ? null : valueIdxToX(activeInSlice);
    const showV = activeInSlice == null ? null : domain.sliceValues[activeInSlice];

    const showTouchXLabelIdx = touching ? activeInSlice : null;

    const selectOverlay = useMemo(() => {
        const sX = dragStartX.current;
        const eX = dragEndX.current;
        if (!touching || sX == null || eX == null) return null;

        const left = Math.min(sX, eX);
        const right = Math.max(sX, eX);
        const w = right - left;
        if (w < 28) return null;

        return <Rect x={left} y={p} width={w} height={height - p * 2} fill={color} fillOpacity={0.08} />;
    }, [touching, height, color]);

    const isTouchingLast = touching && activeIdx === values.length - 1;
    const lastPointLabel = useMemo(() => {
        if (!globalLastVisible || globalLastInSlice == null) return null;

        const x = valueIdxToX(globalLastInSlice);
        const v = domain.sliceValues[globalLastInSlice];

        return (
            <G>
                <SvgText
                    x={x}
                    y={p - 8}
                    fontSize="16"
                    textAnchor="middle"
                    fill={BORDER}
                    fontFamily="NeoDunggeunmoPro-Regular"
                >
                    {v}
                </SvgText>
            </G>
        );
    }, [globalLastVisible, globalLastInSlice, domain.sliceValues, xStep, p]);

    return (
        <View style={{ width, height }} {...panResponder.panHandlers}>
            <Svg width={width} height={height}>
                {[0, 1, 2, 3, 4].map((i) => (
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
                <Polyline points={points} fill="none" stroke={color} strokeWidth={3} strokeLinejoin="round" />

                {selectOverlay}

                {domain.sliceValues.map((v: number, i: number) => {
                    const cx = p + i * xStep;
                    const cy = yPos(v);
                    const isActive = activeInSlice === i && touching;

                    const globalIdx = domain.s + i;
                    const isGlobalLast = globalIdx === values.length - 1;

                    const isDefaultLabel = i === 0 || i === domain.sliceValues.length - 1;
                    const isTouchLabel = showTouchXLabelIdx === i;

                    return (
                        <G key={i}>
                            <Circle
                                cx={cx}
                                cy={cy}
                                r={isActive ? 6 : isGlobalLast ? 6 : 4}
                                fill={CARD_BG}
                                stroke={color}
                                strokeWidth={isActive ? 3 : isGlobalLast ? 3 : 2}
                            />

                            {(isDefaultLabel || isTouchLabel) && (
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
                        </G>
                    );
                })}

                {touching && !isTouchingLast && showX != null && showV != null && (
                    <G>
                        <Line x1={showX} y1={p} x2={showX} y2={height - p} stroke={color} strokeWidth={1} strokeDasharray="4 4" />
                        <SvgText
                            x={showX}
                            y={p - 8}
                            fontSize="14"
                            textAnchor="middle"
                            fill={BORDER}
                            fontFamily="NeoDunggeunmoPro-Regular"
                        >
                            {showV}
                        </SvgText>
                    </G>
                )}

                {lastPointLabel}

                <Line x1={p} y1={height - p} x2={width - p} y2={height - p} stroke={BORDER} strokeWidth={2} />
            </Svg>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: BG_COLOR },
    content: { paddingHorizontal: 22, paddingBottom: 40, paddingTop: 0 },

    header: { marginTop: 60, marginBottom: 20, alignItems: "center" },
    headerTitle: { fontSize: 30, fontFamily: "NeoDunggeunmoPro-Regular", color: "rgba(36,46,19,0.9)" },

    sectionHeader: { flexDirection: "row", alignItems: "center", marginTop: 26, marginBottom: 12 },
    headerSquare: { width: 10, height: 10, backgroundColor: "rgba(36,46,19,0.9)", marginRight: 8 },
    sectionTitle: { fontSize: 18, fontFamily: "NeoDunggeunmoPro-Regular", color: "rgba(36,46,19,0.9)" },

    pixelContainer: { marginBottom: 8, position: "relative" },
    pixelShadow: { position: "absolute", top: 4, left: 4, right: -4, bottom: -4, backgroundColor: BORDER },
    pixelBox: { backgroundColor: CARD_BG, borderWidth: 3, borderColor: BORDER, padding: 12 },

    photoWrap: { width: PHOTO_WIDTH, height: 220, position: "relative", overflow: "hidden", backgroundColor: BORDER },
    slideContainer: { flexDirection: "row", width: PHOTO_WIDTH * 2, height: "100%" },
    photoContainer: { width: PHOTO_WIDTH, height: "100%", overflow: "hidden", backgroundColor: BORDER },
    photo: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },

    statusBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: "#1A1A1A",
        flexDirection: "row",
        alignItems: "center",
        padding: 4,
        zIndex: 10,
    },
    statusDot: { width: 6, height: 6, backgroundColor: "#FF0000", marginRight: 5 },
    statusText: { color: "#FFF", fontSize: 16, fontFamily: "NeoDunggeunmoPro-Regular" },
    photoNavBtn: { position: "absolute", top: "45%", backgroundColor: "rgba(26,26,26,0.6)", padding: 8, borderRadius: 2, zIndex: 20 },
    photoNavText: { color: "#FFF", fontSize: 16 },
    photoIndicatorRow: { position: "absolute", bottom: 10, width: "100%", flexDirection: "row", justifyContent: "center", gap: 6 },
    photoDot: { width: 6, height: 6, borderWidth: 1, borderColor: BORDER },

    archiveBar: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
    folderIcon: { width: 28, height: 20, marginRight: 15, position: "relative" },
    folderTab: { width: 10, height: 4, backgroundColor: BORDER, position: "absolute", top: -4 },
    folderBody: { flex: 1, borderWidth: 2, borderColor: BORDER, backgroundColor: "#EEE" },
    archiveTextWrap: { flex: 1 },
    archiveTitle: { fontSize: 16, fontFamily: "NeoDunggeunmoPro-Regular", color: "rgba(36,46,19,0.9)" },
    archiveSub: { fontSize: 12, fontFamily: "NeoDunggeunmoPro-Regular", color: "#777", marginTop: 2 },
    arrow: { fontSize: 12, color: BORDER, fontWeight: "bold" },

    chartBox: { padding: 12 },
    chartHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10, alignItems: "center", gap: 10 },
    periodText: { fontSize: 16, fontFamily: "NeoDunggeunmoPro-Regular", color: "#666" },

    legendRow: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 10 },
    legendDot: { width: 8, height: 8, borderWidth: 1, borderColor: BORDER },
    legendText: { fontSize: 16, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },

    monitorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "#EEEEEE", paddingBottom: 5 },
    monitorLed: { width: 6, height: 6, borderRadius: 3, marginRight: 8 },
    monitorTitle: { fontSize: 13, fontFamily: "NeoDunggeunmoPro-Regular", color: BORDER },
    monitorFooter: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },

    pagerFrame: { position: "relative" },

    pagerIconBtn: {
        position: "absolute",
        top: "50%",
        marginTop: -14,
        paddingHorizontal: 8,
        paddingVertical: 8,
        backgroundColor: "transparent",
        borderWidth: 0,
        zIndex: 30,
    },
});

const dummyDays = ["01.17", "01.18", "01.19", "01.20", "01.21", "01.22", "01.23"];
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
