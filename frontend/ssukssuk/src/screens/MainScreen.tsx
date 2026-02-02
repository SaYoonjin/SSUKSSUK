import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    Image,
    ImageBackground,
    Pressable,
    StyleSheet,
    View,
    Text,
    Animated,
    Easing,
    Modal,
    Dimensions,
    ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

import client from '../api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BG_DAY = require('../assets/background1.png');
const BG_NIGHT = require('../assets/background2.png');
const ALARM_ICON = require('../assets/alarm_balloon.png');
const TOMATO_NORMAL = require('../assets/tomato_normal.png');
const ALARM_BELL = require('../assets/alarm.png');

const DAY_START_HOUR = 3;
const DAY_END_HOUR = 18;

const FONT = 'NeoDunggeunmoPro-Regular';
const SIGN_TEXT_COLOR = '#300e08';

const MOVE_RANGE_X = 80;
const MOVE_RANGE_Y = 30;

const PIXEL = 4;
const BORDER_COLOR = '#300e08';
const CARD_BG = '#EDEDE9';

const MODE_STORAGE_KEY = 'plantMode';
const NOTIF_SEEN_STATE_KEY = 'notifSeenState';

// ✅ 식물 이름 캐시 키
const PLANT_NAME_STORAGE_KEY = 'plantName';

type TodayNotificationsResponse = {
    success: boolean;
    message: string;
    data: {
        date: string;
        notifications: Array<{
            notificationId: number;
            message: string;
            createdAt: string;
        }>;
    } | null;
};

type WaterSensorCardResponse = {
    success: boolean;
    message?: string;
    data: {
        plantId: number;
        measuredAt: string;
        current_water: number;
        ideal_min: number;
        ideal_max: number;
    } | null;
};

type NutrientSensorCardResponse = {
    success: boolean;
    data: {
        plantId: number;
        measuredAt: string;
        current_nutrient: number;
        ideal_min: number;
        ideal_max: number;
    } | null;
    error: any;
};

type SensorKind = 'water' | 'nutrient';

type SensorBarData = {
    kind: SensorKind;
    measuredAt?: string;
    current: number;
    ideal_min: number;
    ideal_max: number;
};

type ModalItem = {
    message: string;
    createdAt?: string;
    sensor?: SensorBarData;
};

// ✅ 모달 짤림 방지: PixelBox innerStyle 받아서 모달에서만 stretch 처리 가능
function PixelBox({ children, style, innerStyle }: any) {
    return (
        <View style={[styles.pixelBoxContainer, style]}>
            <View style={styles.pixelBgUnderlay} />
            <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.05, width: PIXEL }]} />
            <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.05, width: PIXEL }]} />
            <View style={styles.pixelTop} />
            <View style={styles.pixelBottom} />
            <View style={styles.pixelLeft} />
            <View style={styles.pixelRight} />
            <View style={styles.pixelCornerTL1} />
            <View style={styles.pixelCornerTL2} />
            <View style={styles.pixelCornerTL3} />
            <View style={styles.pixelCornerTR1} />
            <View style={styles.pixelCornerTR2} />
            <View style={styles.pixelCornerTR3} />
            <View style={styles.pixelCornerBL1} />
            <View style={styles.pixelCornerBL2} />
            <View style={styles.pixelCornerBL3} />
            <View style={styles.pixelCornerBR1} />
            <View style={styles.pixelCornerBR2} />
            <View style={styles.pixelCornerBR3} />
            <View style={[styles.cardInner, innerStyle]}>{children}</View>
        </View>
    );
}

function isDayTime(now: Date) {
    const h = now.getHours();
    return h >= DAY_START_HOUR && h < DAY_END_HOUR;
}

function getNextSwitchTime(now: Date) {
    const next = new Date(now);
    const h = now.getHours();
    if (h >= DAY_START_HOUR && h < DAY_END_HOUR) {
        next.setHours(DAY_END_HOUR, 0, 0, 0);
        return next;
    }
    next.setHours(DAY_START_HOUR, 0, 0, 0);
    if (h >= DAY_END_HOUR) next.setDate(next.getDate() + 1);
    return next;
}

function clamp01(n: number) {
    return Math.max(0, Math.min(1, n));
}

function getSensorTitle(kind: SensorKind) {
    if (kind === 'water') return '현재 수위';
    return '현재 농도';
}

function getLevelText(current: number, min: number, max: number) {
    if (current < min) return '낮음';
    if (current > max) return '높음';
    return '정상';
}

function buildDomain(min: number, max: number) {
    const span = Math.max(1e-6, max - min);
    const pad = span;
    return { dmin: min - pad, dmax: max + pad };
}

function getGuideKeywords(kind: SensorKind, current: number, min: number, max: number) {
    const status = getLevelText(current, min, max);
    if (status === '정상') return ['정상'];
    if (kind === 'water') return status === '낮음' ? ['낮아요', '낮음'] : ['높아요', '높음'];
    return status === '낮음' ? ['낮아요', '낮음'] : ['높아요', '높음'];
}

function renderHighlightedGuide(message: string, keywords: string[]) {
    if (!message) return null;

    const ks = Array.from(new Set(keywords.filter(Boolean))).sort((a, b) => b.length - a.length);
    if (ks.length === 0) {
        return <Text style={[styles.notifMessage, { textAlign: 'center' }]}>{message}</Text>;
    }

    const escaped = ks.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
    const parts = message.split(pattern);

    return (
        <Text style={[styles.notifMessage, { textAlign: 'center' }]}>
            {parts.map((p, i) => {
                const isHit = ks.includes(p);
                return (
                    <Text key={i} style={isHit ? styles.guideKeyword : undefined}>
                        {p}
                    </Text>
                );
            })}
        </Text>
    );
}

function SensorBar({ data }: { data: SensorBarData }) {
    const { current, ideal_min, ideal_max, kind } = data;

    const { dmin, dmax } = buildDomain(ideal_min, ideal_max);
    const range = Math.max(1e-6, dmax - dmin);

    const p = clamp01((current - dmin) / range);
    const normalStart = clamp01((ideal_min - dmin) / range);
    const normalEnd = clamp01((ideal_max - dmin) / range);

    const status = getLevelText(current, ideal_min, ideal_max);
    const pointerColor = status === '정상' ? '#222' : '#D25353';

    return (
        <View style={styles.sensorBlock}>
            <Text style={styles.sensorTitle}>{getSensorTitle(kind)}</Text>

            <View style={styles.sensorBarWrap}>
                <View style={styles.sensorBar}>
                    <LinearGradient
                        colors={['#D98F8F', '#F6F0EE', '#99BDEB']}
                        locations={[0, 0.5, 1]}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={StyleSheet.absoluteFill}
                    />

                    <View style={[styles.normalTick, { left: `${normalStart * 100}%` }]} />
                    <View style={[styles.normalTick, { left: `${normalEnd * 100}%` }]} />

                    <View
                        style={[
                            styles.sensorPointer,
                            { left: `${p * 100}%`, backgroundColor: pointerColor },
                        ]}
                    />
                </View>

                <View style={styles.sensorLabels}>
                    <Text style={styles.sensorLabelText}>낮음</Text>
                    <Text style={styles.sensorLabelText}>정상</Text>
                    <Text style={styles.sensorLabelText}>높음</Text>
                </View>

                <View style={styles.sensorMetaRow}>
                    <Text style={styles.sensorMetaText}>
                        {`현재: ${Number.isFinite(current) ? current.toFixed(1) : '-'}`}
                    </Text>
                    <Text style={styles.sensorMetaText}>
                        {`기준: ${ideal_min.toFixed(1)} ~ ${ideal_max.toFixed(1)}`}
                    </Text>
                </View>
            </View>
        </View>
    );
}

export default function MainScreen() {
    const [useDayBg, setUseDayBg] = useState(() => isDayTime(new Date()));
    const [isAutoMode, setIsAutoMode] = useState(true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalType, setModalType] = useState<'list' | 'sign'>('list');
    const [modalBodyItems, setModalBodyItems] = useState<ModalItem[]>([]);

    const modalOpacity = useRef(new Animated.Value(0)).current;
    const modalScale = useRef(new Animated.Value(0.96)).current;

    const [isModeSaving, setIsModeSaving] = useState(false);
    const toggleAnim = useRef(new Animated.Value(0)).current;

    const [todayNotifications, setTodayNotifications] = useState<any>(null);
    const [todayCount, setTodayCount] = useState(0);
    const [latestNotification, setLatestNotification] = useState<any>(null);

    // ✅ 닉네임(식물 이름)
    const [plantName, setPlantName] = useState<string>('');

    const translateX = useRef(new Animated.Value(0)).current;
    const translateY_walk = useRef(new Animated.Value(0)).current;
    const translateY_jump = useRef(new Animated.Value(0)).current;
    const combinedTranslateY = Animated.add(translateY_walk, translateY_jump);

    const backgroundSource = useMemo(() => (useDayBg ? BG_DAY : BG_NIGHT), [useDayBg]);
    const toggleTranslateX = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 50] });
    const toggleBgColor = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: ['#75A743', '#a1a1a1'] });

    const formatTimeHHmm = (iso: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    const getTagFromMessage = (msg: string) => {
        if (msg.includes('수위')) return '수위';
        if (msg.includes('농도')) return '농도';
        if (msg.includes('온도') || msg.includes('습도')) return '온습도';
        return '알림';
    };

    const openModal = (title: string, content: string | any[], type: 'list' | 'sign' = 'sign') => {
        setModalTitle(title);
        setModalType(type);

        if (Array.isArray(content)) {
            setModalBodyItems(content);
        } else {
            setModalBodyItems([{ message: content }]);
        }

        modalOpacity.setValue(0);
        modalScale.setValue(0.96);

        setIsModalVisible(true);

        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(modalScale, { toValue: 1, duration: 220, useNativeDriver: true }),
        ]).start();
    };

    const closeModal = () => {
        Animated.parallel([
            Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(modalScale, { toValue: 0.96, duration: 180, useNativeDriver: true }),
        ]).start(() => setIsModalVisible(false));
    };

    useEffect(() => {
        const schedule = () => {
            const now = new Date();
            setUseDayBg(isDayTime(now));
            setTimeout(schedule, Math.max(500, getNextSwitchTime(now).getTime() - now.getTime()));
        };
        schedule();
    }, []);

    // ✅ 앱 시작 시 저장된 모드 복구
    useEffect(() => {
        const initMode = async () => {
            try {
                const stored = await AsyncStorage.getItem(MODE_STORAGE_KEY); // 'AUTO' | 'MANUAL' | null
                const auto = stored ? stored === 'AUTO' : true;

                setIsAutoMode(auto);
                toggleAnim.setValue(auto ? 0 : 1);
            } catch {
                setIsAutoMode(true);
                toggleAnim.setValue(0);
            }
        };
        initMode();
    }, [toggleAnim]);

    // ✅ 앱 시작 시 저장된 plantName 먼저 복구 (깜빡임 방지)
    useEffect(() => {
        const initPlantName = async () => {
            try {
                const cachedName = await AsyncStorage.getItem(PLANT_NAME_STORAGE_KEY);
                if (cachedName) setPlantName(cachedName);
            } catch {}
        };
        initPlantName();
    }, []);

    const moveRandomly = useCallback(() => {
        const toX = Math.floor(Math.random() * (MOVE_RANGE_X * 2 + 1)) - MOVE_RANGE_X;
        const toY = Math.floor(Math.random() * (MOVE_RANGE_Y * 2 + 1)) - MOVE_RANGE_Y;
        const duration = 3000 + Math.random() * 3000;
        Animated.parallel([
            Animated.timing(translateX, { toValue: toX, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(translateY_walk, { toValue: toY, duration, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ]).start(({ finished }) => { if (finished) setTimeout(moveRandomly, 1000 + Math.random() * 2000); });
    }, [translateX, translateY_walk]);

    useEffect(() => { moveRandomly(); }, [moveRandomly]);

    const handleCharacterPress = () => {
        Animated.sequence([
            Animated.timing(translateY_jump, { toValue: -50, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
            Animated.timing(translateY_jump, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.bounce }),
        ]).start();
    };

    const handleToggle = async (auto: boolean) => {
        if (isModeSaving || isAutoMode === auto) return;
        const prev = isAutoMode;

        setIsAutoMode(auto);
        Animated.timing(toggleAnim, { toValue: auto ? 0 : 1, duration: 250, useNativeDriver: false }).start();

        setIsModeSaving(true);
        try {
            const token = await AsyncStorage.getItem('accessToken');
            await client.patch('/auth/mode', { mode: auto ? 'AUTO' : 'MANUAL' }, { headers: { Authorization: `Bearer ${token}` } });
            await AsyncStorage.setItem(MODE_STORAGE_KEY, auto ? 'AUTO' : 'MANUAL');
        } catch {
            setIsAutoMode(prev);
            Animated.timing(toggleAnim, { toValue: prev ? 0 : 1, duration: 250, useNativeDriver: false }).start();
        } finally {
            setIsModeSaving(false);
        }
    };

    const fetchTodayNotifications = useCallback(async () => {
        try {
            const res = await client.post<TodayNotificationsResponse>('/notifications/list', {});
            const data = res.data.data;
            if (!data) return;

            const rawState = await AsyncStorage.getItem(NOTIF_SEEN_STATE_KEY);
            const parsed = rawState ? JSON.parse(rawState) : {};
            const lastSeen = parsed.date === data.date ? parsed.lastSeenAt : null;

            const list = data.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const unread = lastSeen ? list.filter(n => new Date(n.createdAt).getTime() > new Date(lastSeen).getTime()) : list;

            setTodayNotifications(data);
            setTodayCount(unread.length);
            setLatestNotification(unread[0] || null);
        } catch {}
    }, []);

    useEffect(() => {
        fetchTodayNotifications();
        const id = setInterval(fetchTodayNotifications, 30000);
        return () => clearInterval(id);
    }, [fetchTodayNotifications]);

    const onPressBell = async () => {
        if (todayNotifications?.notifications) {
            const list = [...todayNotifications.notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            openModal('오늘의 알림', list, 'list');
            if (list.length > 0) {
                await AsyncStorage.setItem(NOTIF_SEEN_STATE_KEY, JSON.stringify({ date: todayNotifications.date, lastSeenAt: list[0].createdAt }));
                setTodayCount(0);
                setLatestNotification(null);
            }
        }
    };

    // ✅ plantId 캐시가 있어도 plantName이 없으면 /plants로 name 채우게 수정 (닉네임 안 뜨는 문제 해결)
    const getPlantId = useCallback(async () => {
        const cached = await AsyncStorage.getItem('plantId');
        const cachedName = await AsyncStorage.getItem(PLANT_NAME_STORAGE_KEY);

        const cachedPid = cached && !Number.isNaN(Number(cached)) ? Number(cached) : null;

        if (cachedName) setPlantName(cachedName);

        // pid도 있고 name도 있으면 그대로 사용
        if (cachedPid && cachedName) {
            return cachedPid;
        }

        try {
            const token = await AsyncStorage.getItem('accessToken');

            const res = await client.get('/plants', {
                headers: { Authorization: `Bearer ${token}` },
            });

            const list = res?.data?.data || [];
            const main = list.find((p: any) => p?.is_main === true) || list[0];

            const pid = main?.plant_id ?? cachedPid;
            const pname = main?.name;

            if (pname) {
                setPlantName(String(pname));
                try { await AsyncStorage.setItem(PLANT_NAME_STORAGE_KEY, String(pname)); } catch {}
            }

            if (pid && !Number.isNaN(Number(pid))) {
                await AsyncStorage.setItem('plantId', String(pid));
                return Number(pid);
            }
        } catch {}

        return cachedPid;
    }, []);

    // ✅ 앱 시작 시 한 번 확보
    useEffect(() => {
        getPlantId();
    }, [getPlantId]);

    const buildWaterGuide = (current: number, min: number, max: number) => {
        if (current > max) return '물 수위가 높아요. \n수위가 높으면 뿌리 손상이 생길 수 있으니 급수 중지가 필요해요!';
        if (current < min) return '물 수위가 낮아요. \n뿌리가 충분한 수분을 흡수하지 못할 수 있으니 급수가 필요해요!';
        return '물 수위가 정상이에요.\n따로 조치할 필요 없어요.';
    };

    const buildNutrientGuide = (current: number, min: number, max: number) => {
        if (current > max) return '영양분 농도가 높아요. \n뿌리에 부담이 생겨 영양분 흡수가 어려울 수 있으니 농도를 낮춰주세요!';
        if (current < min) return '영양분 농도가 낮아요. \n식물이 필요한 영양분을 충분히 흡수하지 못 할 수 있으니 영양분 보충이 필요해요!';
        return '영양분 농도가 정상이에요. \n따로 조치할 필요 없어요.';
    };

    const onPressWaterSign = useCallback(async () => {
        openModal('수위 정보', '불러오는 중...', 'sign');
        try {
            const plantId = await getPlantId();
            const token = await AsyncStorage.getItem('accessToken');

            if (!plantId) {
                openModal('수위 정보', '식물 정보를 찾지 못했습니다. (plantId 없음)', 'sign');
                return;
            }

            const res = await client.get<WaterSensorCardResponse>(`/plants/${plantId}/sensors/water`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data.data;
            if (!data) {
                openModal('수위 정보', '데이터가 없습니다.', 'sign');
                return;
            }

            const guide = buildWaterGuide(data.current_water, data.ideal_min, data.ideal_max);

            openModal(
                '수위 정보',
                [
                    {
                        message: guide,
                        sensor: {
                            kind: 'water',
                            measuredAt: data.measuredAt,
                            current: data.current_water,
                            ideal_min: data.ideal_min,
                            ideal_max: data.ideal_max,
                        },
                    },
                ],
                'sign'
            );
        } catch (e) {
            openModal('수위 정보', '정보를 불러오지 못했습니다.', 'sign');
        }
    }, [getPlantId]);

    const onPressNutrientSign = useCallback(async () => {
        openModal('농도 정보', '불러오는 중...', 'sign');
        try {
            const plantId = await getPlantId();
            const token = await AsyncStorage.getItem('accessToken');

            if (!plantId) {
                openModal('농도 정보', '식물 정보를 찾지 못했습니다. (plantId 없음)', 'sign');
                return;
            }

            const res = await client.get<NutrientSensorCardResponse>(`/plants/${plantId}/sensors/nutrient`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = res.data.data;
            if (!data) {
                openModal('농도 정보', '데이터가 없습니다.', 'sign');
                return;
            }

            const guide = buildNutrientGuide(data.current_nutrient, data.ideal_min, data.ideal_max);

            openModal(
                '농도 정보',
                [
                    {
                        message: guide,
                        sensor: {
                            kind: 'nutrient',
                            measuredAt: data.measuredAt,
                            current: data.current_nutrient,
                            ideal_min: data.ideal_min,
                            ideal_max: data.ideal_max,
                        },
                    },
                ],
                'sign'
            );
        } catch (e) {
            openModal('농도 정보', '정보를 불러오지 못했습니다.', 'sign');
        }
    }, [getPlantId]);

    return (
        <View style={styles.root}>
            <ImageBackground source={backgroundSource} style={styles.bg} resizeMode="cover">
                <Pressable style={styles.topBellIconBtn} onPress={onPressBell}>
                    <Image source={ALARM_BELL} style={styles.bellImage} />
                    {todayCount > 0 && (
                        <View style={styles.bellBadge}>
                            <Text style={styles.bellBadgeText}>{todayCount > 99 ? '99+' : todayCount}</Text>
                        </View>
                    )}
                </Pressable>

                <View style={styles.modeToggleContainer}>
                    <Animated.View style={[styles.toggleSlider, { transform: [{ translateX: toggleTranslateX }], backgroundColor: toggleBgColor }]} />
                    <Pressable onPress={() => handleToggle(true)} style={styles.togglePiece}><Text style={[styles.togglePieceText, isAutoMode && styles.textActive]}>AUTO</Text></Pressable>
                    <Pressable onPress={() => handleToggle(false)} style={styles.togglePiece}><Text style={[styles.togglePieceText, !isAutoMode && styles.textActive]}>MANU</Text></Pressable>
                </View>

                {/* ✅ 표지판 영역에 식물 이름 표시 */}
                <View style={styles.plantNameWrap} pointerEvents="none">
                    <Text style={styles.plantNameText}>{plantName ? plantName : ''}</Text>
                </View>

                <Pressable style={[styles.signTouchArea, { left: '3%', top: '24%' }]} onPress={onPressWaterSign}>
                    <Text style={styles.signTitleText}>수위</Text>
                </Pressable>
                <Pressable style={[styles.signTouchArea, { left: '36%', top: '24%' }]} onPress={onPressNutrientSign}>
                    <Text style={styles.signTitleText}>농도</Text>
                </Pressable>
                <View style={[styles.signTouchArea, { left: '68.5%', top: '24%' }]}>
                    <Text style={styles.signTitleText}>온습도</Text>
                </View>

                <Animated.View style={[styles.characterWrapper, { transform: [{ translateX }, { translateY: combinedTranslateY }] }]}>
                    {latestNotification && (
                        <Pressable style={styles.alarmWrap} onPress={() => openModal('최신 알림', [latestNotification], 'list')}>
                            <View style={styles.alarmBox}><Image source={ALARM_ICON} style={styles.alarmIcon} /></View>
                        </Pressable>
                    )}
                    <Pressable onPress={handleCharacterPress}><Image source={TOMATO_NORMAL} style={styles.tomatoImage} /></Pressable>
                </Animated.View>
            </ImageBackground>

            <Modal transparent visible={isModalVisible} animationType="none" onRequestClose={closeModal} statusBarTranslucent>
                <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />
                    <Animated.View onStartShouldSetResponder={() => true} style={{ transform: [{ scale: modalScale }] }}>
                        {/* ✅ 모달 짤림 방지: innerStyle로 stretch + maxHeight 화면비 */}
                        <PixelBox style={styles.modalContent} innerStyle={styles.modalInner}>
                            <View style={styles.modalHeaderCustom}>
                                <Text style={styles.modalHeaderTextCustom}>{modalTitle}</Text>
                                <Pressable style={styles.closeBtn} onPress={closeModal}><Text style={styles.closeBtnText}>X</Text></Pressable>
                            </View>

                            <ScrollView
                                style={styles.modalScroll}
                                contentContainerStyle={styles.modalScrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {modalBodyItems.length > 0 ? (
                                    modalBodyItems.map((item, idx) => (
                                        <View key={idx} style={styles.notifCard}>
                                            <View style={styles.notifRow}>
                                                {modalType === 'list' && (
                                                    <Text style={styles.tagBadgeText}>[{getTagFromMessage(item.message)}]</Text>
                                                )}

                                                {modalType === 'sign' && item.sensor
                                                    ? renderHighlightedGuide(
                                                        item.message,
                                                        getGuideKeywords(item.sensor.kind, item.sensor.current, item.sensor.ideal_min, item.sensor.ideal_max)
                                                    )
                                                    : (
                                                        <Text style={styles.notifMessage}>
                                                            {item.message}
                                                        </Text>
                                                    )
                                                }
                                            </View>

                                            {modalType === 'sign' && item.sensor && (
                                                <SensorBar data={item.sensor} />
                                            )}

                                            {item.createdAt && (
                                                <Text style={styles.notifTime}>{formatTimeHHmm(item.createdAt)}</Text>
                                            )}
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>데이터가 없습니다.</Text>
                                )}
                            </ScrollView>
                        </PixelBox>
                    </Animated.View>
                </Animated.View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    bg: { flex: 1 },

    topBellIconBtn: { position: 'absolute', top: 36, right: '53%', zIndex: 70 },
    bellImage: { width: 52, height: 52, resizeMode: 'contain' },
    bellBadge: { position: 'absolute', top: 5, right: 6, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#D25353', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFF' },
    bellBadgeText: { fontFamily: FONT, fontSize: 11, color: '#FFF' },

    modeToggleContainer: { position: 'absolute', top: 140, left: 20, flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 2, borderColor: BORDER_COLOR, zIndex: 60, overflow: 'hidden' },
    toggleSlider: { position: 'absolute', top: 0, left: 0, width: 50, height: '100%' },
    togglePiece: { width: 50, paddingVertical: 7, alignItems: 'center', justifyContent: 'center' },
    togglePieceText: { fontFamily: FONT, fontSize: 14, color: BORDER_COLOR, opacity: 0.4, zIndex: 10 },
    textActive: { color: '#FFF', opacity: 1 },

    // ✅ 표지판(나무판) 쪽에 자연스럽게
    plantNameWrap: {
        position: 'absolute',
        top: 34,
        left: -33,
        width: 240,
        height: 54,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 90,
    },
    plantNameText: {
        fontFamily: FONT,
        fontSize: 20,
        color: SIGN_TEXT_COLOR,
        textAlign: 'center',
    },

    signTouchArea: { position: 'absolute', width: '28%', height: '11%', alignItems: 'center' },
    signTitleText: { fontFamily: FONT, fontSize: 16, color: SIGN_TEXT_COLOR, textAlign: 'center', marginTop: 40 },

    characterWrapper: { position: 'absolute', bottom: 150, alignSelf: 'center', zIndex: 10, alignItems: 'center' },
    tomatoImage: { width: 320, height: 320, resizeMode: 'contain' },

    alarmWrap: { position: 'absolute', top: 20, right: 30, zIndex: 20 },
    alarmBox: { width: 78, height: 78, justifyContent: 'center', alignItems: 'center' },
    alarmIcon: { width: 70, height: 70, resizeMode: 'contain' },

    // 모달 짤림 방지: padding 주고, maxHeight 화면비로
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    modalContent: { width: 300, maxHeight: SCREEN_HEIGHT * 0.78 },
    modalInner: { alignItems: 'stretch' },

    modalHeaderCustom: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 10 },
    modalHeaderTextCustom: { fontFamily: FONT, fontSize: 20, color: BORDER_COLOR },
    closeBtn: { padding: 4 },
    closeBtnText: { fontFamily: FONT, fontSize: 18, color: '#999' },

    modalScroll: { width: '100%' },
    modalScrollContent: { paddingBottom: 10 },

    notifCard: {
        width: '100%',
        backgroundColor: '#fafaf6',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e6e6e0',
    },
    notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
    tagBadgeText: { fontFamily: FONT, fontSize: 13, color: '#75A743', marginRight: 6 },
    notifMessage: { flex: 1, fontFamily: FONT, fontSize: 14, color: '#333', lineHeight: 18 },
    notifTime: { alignSelf: 'flex-end', fontFamily: FONT, fontSize: 11, color: '#bbb', marginTop: 4 },
    emptyText: { fontFamily: FONT, fontSize: 14, color: '#999', textAlign: 'center', marginTop: 40 },

    guideKeyword: {
        fontFamily: FONT,
        fontSize: 18,
        color: BORDER_COLOR,
    },

    sensorBlock: { marginTop: 12, width: '100%' },
    sensorTitle: { fontFamily: FONT, fontSize: 13, color: '#4A2A1E', marginBottom: 8, textAlign: 'left' },
    sensorBarWrap: { width: '100%' },

    sensorBar: {
        width: '100%',
        height: 16,
        borderWidth: 2,
        borderColor: BORDER_COLOR,
        borderRadius: 999,
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: '#fafaf6',
    },

    normalTick: {
        position: 'absolute',
        top: 2,
        bottom: 2,
        width: 2,
        backgroundColor: 'rgba(48, 14, 8, 0.35)',
        marginLeft: -1,
    },

    sensorPointer: {
        position: 'absolute',
        top: -4,
        width: 3,
        height: 24,
        marginLeft: -1.5,
        borderRadius: 2,
    },

    sensorLabels: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    sensorLabelText: { fontFamily: FONT, fontSize: 11, color: '#333' },

    sensorMetaRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    sensorMetaText: { fontFamily: FONT, fontSize: 11, color: '#666' },

    pixelBoxContainer: { position: 'relative', marginHorizontal: PIXEL * 2 },
    pixelBgUnderlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: CARD_BG },
    cardInner: { padding: 15, alignItems: 'center', position: 'relative', zIndex: 10 },

    shadeLeft: { position: 'absolute', top: PIXEL, bottom: PIXEL, backgroundColor: '#000', zIndex: 1 },
    shadeRight: { position: 'absolute', top: PIXEL, bottom: PIXEL, backgroundColor: '#000', zIndex: 1 },

    pixelTop: { position: 'absolute', top: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelBottom: { position: 'absolute', bottom: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelLeft: { position: 'absolute', top: PIXEL, bottom: PIXEL, left: -PIXEL, width: PIXEL, backgroundColor: BORDER_COLOR },
    pixelRight: { position: 'absolute', top: PIXEL, bottom: PIXEL, right: -PIXEL, width: PIXEL, backgroundColor: BORDER_COLOR },

    pixelCornerTL1: { position: 'absolute', top: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerTL2: { position: 'absolute', top: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerTL3: { position: 'absolute', top: 0, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },

    pixelCornerTR1: { position: 'absolute', top: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerTR2: { position: 'absolute', top: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerTR3: { position: 'absolute', top: 0, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },

    pixelCornerBL1: { position: 'absolute', bottom: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerBL2: { position: 'absolute', bottom: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerBL3: { position: 'absolute', bottom: 0, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },

    pixelCornerBR1: { position: 'absolute', bottom: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerBR2: { position: 'absolute', bottom: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
    pixelCornerBR3: { position: 'absolute', bottom: 0, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR },
});
