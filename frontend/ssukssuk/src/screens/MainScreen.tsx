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
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';


import client from '../api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BG_DAY = require('../assets/background1.png');
const BG_NIGHT = require('../assets/background2.png');
const ALARM_ICON = require('../assets/alarm_balloon.png');
const TOMATO_NORMAL = require('../assets/tomato_normal.png'); // 기본 이미지 (fallback용)
const ALARM_BELL = require('../assets/alarm.png');

const DAY_START_HOUR = 7;
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
const PLANT_NAME_STORAGE_KEY = 'plantName';

const NOTIF_CARD_MIN_H = 62;
const NOTIF_CARD_GAP = 8;
const MAX_VISIBLE_NOTIF_CARDS = 4;
const LIST_MODAL_MAX_HEIGHT =
    NOTIF_CARD_MIN_H * MAX_VISIBLE_NOTIF_CARDS +
    NOTIF_CARD_GAP * (MAX_VISIBLE_NOTIF_CARDS - 1) +
    4;

type TodayNotificationsResponse = {
  success: boolean;
  message: string;
  data:
      | {
    date: string;
    notifications: Array<{
      notificationId: number;
      message: string;
      createdAt: string;
    }>;
  }
      | null;
};

type WaterSensorCardResponse = {
  success: boolean;
  message?: string;
  data:
      | {
    plantId: number;
    measuredAt: string;
    current_water: number;
    ideal_min: number;
    ideal_max: number;
  }
      | null;
};

type NutrientSensorCardResponse = {
  success: boolean;
  data:
      | {
    plantId: number;
    measuredAt: string;
    current_nutrient: number;
    ideal_min: number;
    ideal_max: number;
  }
      | null;
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
  notificationId?: number;
};

type SeenState = {
  date: string;
  lastSeenAt: string;
};

type HomeResponse =
    | {
  success: true;
  data: {
    plantId?: number;
    imageUrl?: string; // 서버에서 주는 이미지 URL
    header?: {
      todayNotificationCount?: number;
      asOf?: string;
    };
    user?: {
      userId: number;
      nickname: string;
    };
    mainPlant?: {
      plantId: number;
      name: string;
      species: string;
      characterCode: string;
      imageUrl?: string;
      ageDays: number;
    };
    plantName?: string;
    characterCode?: number;
    healthScore?: number;
    waterLevelStatus?: string;
    nutrientStatus?: string;
    temperature?: number;
    humidity?: number;
    temperatureStatus?: string;
    humidityStatus?: string;
    hasUnreadNotification?: boolean;
    currentSensor?: {
      waterLevel?: { value: number; status: string; updatedAt: string };
      nutrient?: { value: number; status: string; updatedAt: string };
      temperatureHumidity?: {
        temperature: number;
        humidity: number;
        status: string;
        updatedAt: string;
      };
    };
    growthStatus?: { label: string; percentage: number };
    environmentStatus?: { label: string; percentage: number };
    statusMessage?: { statusMessage: string };
    device?: { connected: boolean; deviceId?: string };
  };
  error?: null;
}
    | {
  success: false;
  message?: string;
  error?: any;
  data?: any;
};

function PixelBox({ children, style, innerStyle }: any) {
  return (
      <View style={[styles.pixelBoxContainer, style]}>
        <View style={styles.pixelBgUnderlay} />
        <View
            pointerEvents="none"
            style={[
              styles.shadeLeft,
              { left: -PIXEL, opacity: 0.05, width: PIXEL },
            ]}
        />
        <View
            pointerEvents="none"
            style={[
              styles.shadeRight,
              { right: -PIXEL, opacity: 0.05, width: PIXEL },
            ]}
        />
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function getGuideKeywords(
    kind: SensorKind,
    current: number,
    min: number,
    max: number,
) {
  const status = getLevelText(current, min, max);
  if (status === '정상') return ['정상'];
  if (kind === 'water') return status === '낮음' ? ['낮아요', '낮음'] : ['높아요', '높음'];
  return status === '낮음' ? ['낮아요', '낮음'] : ['높아요', '높음'];
}

function renderHighlightedGuide(message: string, keywords: string[]) {
  if (!message) return null;

  const ks = Array.from(new Set(keywords.filter(Boolean))).sort(
      (a, b) => b.length - a.length,
  );
  if (ks.length === 0) {
    return (
        <Text style={[styles.notifMessage, { textAlign: 'center' }]}>
          {message}
        </Text>
    );
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
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

    // ✅ 에뮬에서 insets.top=0로 잡혀도 StatusBar 높이만큼은 확보
  const topPad = Math.max(insets.top, StatusBar.currentHeight ?? 0);

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

  const [plantName, setPlantName] = useState<string>('');
  const [characterUrl, setCharacterUrl] = useState<string | null>(null);

  const [plantNameFontSize, setPlantNameFontSize] = useState(45);

  useEffect(() => {
    setPlantNameFontSize(30);
  }, [plantName]);

  const [healthScore, setHealthScore] = useState<number>(0);
  const [waterStatusText, setWaterStatusText] = useState<string>('');
  const [nutrientStatusText, setNutrientStatusText] = useState<string>('');
  const [tempHumText, setTempHumText] = useState<string>('');

  const [waterNeedCheck, setWaterNeedCheck] = useState(false);
  const [nutrientNeedCheck, setNutrientNeedCheck] = useState(false);

  const [hasPlant, setHasPlant] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const homeInFlightRef = useRef(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY_walk = useRef(new Animated.Value(0)).current;
  const translateY_jump = useRef(new Animated.Value(0)).current;
  const combinedTranslateY = Animated.add(translateY_walk, translateY_jump);

  const backgroundSource = useMemo(
      () => (useDayBg ? BG_DAY : BG_NIGHT),
      [useDayBg],
  );

  const toggleTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 50],
  });
  const toggleBgColor = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#75A743', '#a1a1a1'],
  });

  const getNotifListSeenKey = () => `${NOTIF_SEEN_STATE_KEY}:list`;
  const getNotifBalloonSeenKey = () => `${NOTIF_SEEN_STATE_KEY}:balloon`;

  const formatTimeHHmm = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(
        d.getMinutes(),
    ).padStart(2, '0')}`;
  };

  const getTagFromMessage = (msg: string) => {
    if (msg.includes('수위')) return '수위';
    if (msg.includes('농도')) return '농도';
    if (msg.includes('온도') || msg.includes('습도')) return '온습도';
    return '알림';
  };

  const openModal = useCallback(
      (title: string, content: string | any[], type: 'list' | 'sign' = 'sign') => {
        setModalTitle(title);
        setModalType(type);

        if (Array.isArray(content)) setModalBodyItems(content);
        else setModalBodyItems([{ message: content }]);

        modalOpacity.setValue(0);
        modalScale.setValue(0.96);

        setIsModalVisible(true);

        Animated.parallel([
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(modalScale, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      },
      [modalOpacity, modalScale],
  );

  const closeModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.96,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => setIsModalVisible(false));
  }, [modalOpacity, modalScale]);

  useEffect(() => {
    const schedule = () => {
      const now = new Date();
      setUseDayBg(isDayTime(now));
      setTimeout(
          schedule,
          Math.max(500, getNextSwitchTime(now).getTime() - now.getTime()),
      );
    };
    schedule();
  }, []);

  useEffect(() => {
    const initMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(MODE_STORAGE_KEY);
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
      Animated.timing(translateX, {
        toValue: toX,
        duration,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(translateY_walk, {
        toValue: toY,
        duration,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start(({ finished }) => {
      if (finished) setTimeout(moveRandomly, 1000 + Math.random() * 2000);
    });
  }, [translateX, translateY_walk]);

  useEffect(() => {
    moveRandomly();
  }, [moveRandomly]);

  const handleCharacterPress = () => {
    Animated.sequence([
      Animated.timing(translateY_jump, {
        toValue: -50,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.timing(translateY_jump, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
        easing: Easing.bounce,
      }),
    ]).start();
  };

  const handleToggle = async (auto: boolean) => {
    if (isModeSaving || isAutoMode === auto) return;
    const prev = isAutoMode;

    setIsAutoMode(auto);
    Animated.timing(toggleAnim, {
      toValue: auto ? 0 : 1,
      duration: 250,
      useNativeDriver: false,
    }).start();

    setIsModeSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('NO_TOKEN');

      await client.patch(
          '/auth/mode',
          { mode: auto ? 'AUTO' : 'MANUAL' },
          { headers: { Authorization: `Bearer ${token}` } },
      );

      await AsyncStorage.setItem(MODE_STORAGE_KEY, auto ? 'AUTO' : 'MANUAL');
    } catch (e: any) {
      console.log('mode patch failed:', e?.response?.status);

      setIsAutoMode(prev);
      Animated.timing(toggleAnim, {
        toValue: prev ? 0 : 1,
        duration: 250,
        useNativeDriver: false,
      }).start();
    } finally {
      setIsModeSaving(false);
    }
  };

  const getPlantId = useCallback(async () => {
    const cached = await AsyncStorage.getItem('plantId');
    const cachedName = await AsyncStorage.getItem(PLANT_NAME_STORAGE_KEY);

    const cachedPid = cached && !Number.isNaN(Number(cached)) ? Number(cached) : null;

    if (cachedName) setPlantName(cachedName);

    if (cachedPid && cachedName) return cachedPid;

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
        try {
          await AsyncStorage.setItem(PLANT_NAME_STORAGE_KEY, String(pname));
        } catch {}
      }

      if (pid && !Number.isNaN(Number(pid))) {
        await AsyncStorage.setItem('plantId', String(pid));
        return Number(pid);
      }
    } catch {}

    return cachedPid;
  }, []);

  useEffect(() => {
    getPlantId();
  }, [getPlantId]);

  const readSeenAt = async (key: string, serverDate: string) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      const parsed: SeenState = JSON.parse(raw);
      if (!parsed?.date || !parsed?.lastSeenAt) return null;
      if (parsed.date !== serverDate) return null;
      return parsed.lastSeenAt;
    } catch {
      return null;
    }
  };

  const writeSeenAt = async (key: string, serverDate: string, lastSeenAt: string) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify({ date: serverDate, lastSeenAt }));
    } catch {}
  };

  const isOkLike = (status?: string) => {
    const s = String(status || '').toUpperCase();
    return s === 'OK' || s === 'NORMAL';
  };

  const [characterCode, setCharacterCode] = useState<number>(0);

  const getLevelFromCode = useCallback((code: number) => {
    const c = Number(code);
    if (!Number.isFinite(c)) return 1;
    return (c % 3) + 1;
  }, []);

  const fetchHome = useCallback(async () => {
    if (homeInFlightRef.current) return;
    homeInFlightRef.current = true;

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await client.get<HomeResponse>('/home', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res?.data || res.data.success !== true) {
        setHasPlant(false);
        return;
      }

      setHasPlant(true);

      const d: any = res.data.data || {};

      if (d?.plantId || d?.mainPlant?.plantId) {
        const serverPlantId = String(d.plantId || d.mainPlant?.plantId);
        const currentCachedId = await AsyncStorage.getItem('plantId');

        if (serverPlantId !== currentCachedId) {
          await AsyncStorage.setItem('plantId', serverPlantId);
          console.log(`🔄 메인 식물 ID 동기화: ${currentCachedId} -> ${serverPlantId}`);
        }
      }

      const pname = d?.plantName ?? d?.mainPlant?.name;
      if (typeof pname === 'string') {
        setPlantName(prev => (prev === pname ? prev : pname));
        try {
          await AsyncStorage.setItem(PLANT_NAME_STORAGE_KEY, pname);
        } catch {}
      }

      const rawCode = d?.characterCode ?? d?.mainPlant?.characterCode ?? null;

      const nextCode = Number(rawCode);
      if (Number.isFinite(nextCode)) {
        setCharacterCode(prev => (prev === nextCode ? prev : nextCode));
      }

      const imgUrl = d?.imageUrl || d?.mainPlant?.imageUrl;
      setCharacterUrl(imgUrl || null);

      const hsRaw =
          typeof d?.healthScore === 'number'
              ? d.healthScore
              : typeof d?.growthStatus?.percentage === 'number'
                  ? d.growthStatus.percentage
                  : 0;

      const nextHs = clamp(Number(hsRaw) || 0, 0, 100);
      setHealthScore(prev => (prev === nextHs ? prev : nextHs));

      const waterStatus = d?.waterLevelStatus ?? d?.currentSensor?.waterLevel?.status;
      const nutrientStatus = d?.nutrientStatus ?? d?.currentSensor?.nutrient?.status;

      const waterOk = isOkLike(waterStatus);
      const nutrientOk = isOkLike(nutrientStatus);

      const nextWaterText = waterOk ? '적정함' : '확인\n필요';
      const nextNutText = nutrientOk ? '적정함' : '확인\n필요';

      setWaterStatusText(prev => (prev === nextWaterText ? prev : nextWaterText));
      setNutrientStatusText(prev => (prev === nextNutText ? prev : nextNutText));

      setWaterNeedCheck(prev => (prev === !waterOk ? prev : !waterOk));
      setNutrientNeedCheck(prev => (prev === !nutrientOk ? prev : !nutrientOk));

      const temp =
          typeof d?.temperature === 'number'
              ? d.temperature
              : d?.currentSensor?.temperatureHumidity?.temperature;
      const hum =
          typeof d?.humidity === 'number'
              ? d.humidity
              : d?.currentSensor?.temperatureHumidity?.humidity;

      const tNum = typeof temp === 'number' ? temp : null;
      const hNum = typeof hum === 'number' ? hum : null;

      const nextTempHum =
          tNum == null || hNum == null ? '-' : `   ${tNum.toFixed(1)}°C / \n ${hNum.toFixed(0)}%`;

      setTempHumText(prev => (prev === nextTempHum ? prev : nextTempHum));

      const cnt =
          typeof d?.header?.todayNotificationCount === 'number'
              ? d.header.todayNotificationCount
              : typeof d?.todayNotificationCount === 'number'
                  ? d.todayNotificationCount
                  : null;

      if (typeof cnt === 'number') {
        setTodayCount(prev => (prev === cnt ? prev : cnt));
      }
    } catch (e: any) {
      const status = e.response?.status;
      const errorCode = e.response?.data?.error?.code;

      if (status === 404 || errorCode === 'PLANT_NOT_FOUND') {
        console.log('ℹ️ 등록된 식물이 없습니다. (정상 처리)');
        setHasPlant(false);
      } else {
        console.error('fetchHome real error:', e);
      }
    } finally {
      homeInFlightRef.current = false;
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [getLevelFromCode]);

  const fetchTodayNotifications = useCallback(async () => {
    try {
      const plantId = await getPlantId();
      if (!plantId) return;

      const res = await client.post<TodayNotificationsResponse>('/notifications/list', {});
      const data = res.data.data;
      if (!data) return;

      const list = data.notifications
          .slice()
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const listSeenKey = getNotifListSeenKey();
      const balloonSeenKey = getNotifBalloonSeenKey();

      const listSeenAt = await readSeenAt(listSeenKey, data.date);
      const balloonSeenAt = await readSeenAt(balloonSeenKey, data.date);

      const unreadForBadge = listSeenAt
          ? list.filter(n => new Date(n.createdAt).getTime() > new Date(listSeenAt).getTime())
          : list;

      const balloonCandidate = balloonSeenAt
          ? list.find(
          n => new Date(n.createdAt).getTime() > new Date(balloonSeenAt).getTime(),
      ) || null
          : list[0] || null;

      setTodayNotifications({ ...data, notifications: list });
      setTodayCount(unreadForBadge.length);
      setLatestNotification(balloonCandidate);
    } catch {}
  }, [getPlantId]);

  useFocusEffect(
      useCallback(() => {
        fetchHome();
        fetchTodayNotifications();

        const id = setInterval(() => {
          fetchHome();
        }, 10000);

        const notifId = setInterval(fetchTodayNotifications, 30000);

        return () => {
          clearInterval(id);
          clearInterval(notifId);
        };
      }, [fetchHome, fetchTodayNotifications]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHome();
    fetchTodayNotifications();
  }, [fetchHome, fetchTodayNotifications]);

  const onPressBell = useCallback(async () => {
    try {
      const plantId = await getPlantId();
      if (!plantId) {
        Alert.alert('알림', '식물이 없습니다.');
        return;
      }

      const list = (todayNotifications?.notifications ?? [])
          .slice()
          .sort(
              (a: any, b: any) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );

      if (list.length === 0) {
        openModal('오늘의 알림', '현재 알람이 없습니다', 'list');
        return;
      }

      openModal('오늘의 알림', list, 'list');

      if (todayNotifications?.date && list.length > 0) {
        const latestAt = list[0].createdAt;
        await writeSeenAt(getNotifListSeenKey(), todayNotifications.date, latestAt);
        await writeSeenAt(getNotifBalloonSeenKey(), todayNotifications.date, latestAt);

        setTodayCount(0);
        setLatestNotification(null);
      }
    } catch (e) {
      console.error(e);
    }
  }, [getPlantId, todayNotifications, openModal]);

  const onPressBalloon = useCallback(async () => {
    try {
      const plantId = await getPlantId();
      if (!plantId) return;

      if (!latestNotification) return;

      // 최신 알림 모달 열기
      openModal('최신 알림', [latestNotification], 'list');

      if (todayNotifications?.date && latestNotification?.createdAt) {
        const latestAt = latestNotification.createdAt;

        // ✅ 풍선 읽음 처리
        await writeSeenAt(getNotifBalloonSeenKey(), todayNotifications.date, latestAt);

        // ✅ 리스트도 같이 읽음 처리 → 종 배지 같이 사라지게
        await writeSeenAt(getNotifListSeenKey(), todayNotifications.date, latestAt);
      }

      // ✅ 즉시 UI 반영
      setLatestNotification(null);
      setTodayCount(0);

      // 서버 기준 최신 상태 재동기화
      await fetchTodayNotifications();
    } catch (e) {
      console.error(e);
    }
  }, [getPlantId, latestNotification, todayNotifications, openModal, fetchTodayNotifications]);

  const buildWaterGuide = (current: number, min: number, max: number) => {
    if (current > max)
      return '물 수위가 높아요. \n수위가 높으면 뿌리 손상이 \n생길 수 있으니 급수 중지가 필요해요!';
    if (current < min)
      return '물 수위가 낮아요. \n뿌리가 충분한 수분을 흡수하지 \n못할 수 있으니 급수가 필요해요!';
    return '물 수위가 정상이에요.\n따로 조치할 필요 없어요.';
  };

  const buildNutrientGuide = (current: number, min: number, max: number) => {
    if (current > max)
      return '영양분 농도가 높아요. \n뿌리에 부담이 생겨 영양분 흡수가 \n어려울 수 있으니 농도를 낮춰주세요!';
    if (current < min)
      return '영양분 농도가 낮아요. \n식물이 필요한 영양분을 충분히 \n흡수하지 못 할 수 있으니 영양분 보충이 필요해요!';
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

      const res = await client.get<WaterSensorCardResponse>(
          `/plants/${plantId}/sensors/water`,
          { headers: { Authorization: `Bearer ${token}` } },
      );

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
          'sign',
      );
    } catch (e) {
      openModal('수위 정보', '정보를 불러오지 못했습니다.', 'sign');
    }
  }, [getPlantId, openModal]);

  const onPressNutrientSign = useCallback(async () => {
    openModal('농도 정보', '불러오는 중...', 'sign');
    try {
      const plantId = await getPlantId();
      const token = await AsyncStorage.getItem('accessToken');

      if (!plantId) {
        openModal('농도 정보', '식물 정보를 찾지 못했습니다. (plantId 없음)', 'sign');
        return;
      }

      const res = await client.get<NutrientSensorCardResponse>(
          `/plants/${plantId}/sensors/nutrient`,
          { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = res.data.data;
      if (!data) {
        openModal('농도 정보', '데이터가 없습니다.', 'sign');
        return;
      }

      const guide = buildNutrientGuide(
          data.current_nutrient,
          data.ideal_min,
          data.ideal_max,
      );

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
          'sign',
      );
    } catch (e) {
      openModal('농도 정보', '정보를 불러오지 못했습니다.', 'sign');
    }
  }, [getPlantId, openModal]);

  const hpPercent = useMemo(() => clamp(Number(healthScore) || 0, 0, 100), [healthScore]);
  const level = useMemo(() => getLevelFromCode(characterCode), [characterCode, getLevelFromCode]);

  return (
      <SafeAreaView style={styles.safeRoot} edges={[]}>
        <StatusBar translucent backgroundColor="transparent" />

        <View style={styles.root}>
          {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#75A743" />
              </View>
          )}

          {/* ✅ 배경은 paddingTop 영향 0: 화면 전체를 그대로 덮음 */}
          <ImageBackground
              source={backgroundSource}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
          />

          {/* ✅ 콘텐츠만 topPad 적용 */}
          <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingTop: topPad }]}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
          >
            {/* 종(벨) */}
            <Pressable style={[styles.topBellIconBtn, { top: 4 }]} onPress={onPressBell}>
              <Image source={ALARM_BELL} style={styles.bellImage} />
              {todayCount > 0 && (
                  <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>
                      {todayCount > 99 ? '99+' : todayCount}
                    </Text>
                  </View>
              )}
            </Pressable>

            <View style={[styles.modeToggleContainer, { top: 112 }]}>
              <Animated.View
                  style={[
                    styles.toggleSlider,
                    {
                      transform: [{ translateX: toggleTranslateX }],
                      backgroundColor: toggleBgColor,
                    },
                  ]}
              />
              <Pressable onPress={() => handleToggle(true)} style={styles.togglePiece}>
                <Text style={[styles.togglePieceText, isAutoMode && styles.textActive]}>
                  AUTO
                </Text>
              </Pressable>
              <Pressable onPress={() => handleToggle(false)} style={styles.togglePiece}>
                <Text style={[styles.togglePieceText, !isAutoMode && styles.textActive]}>
                  MANUAL
                </Text>
              </Pressable>
            </View>

            {hasPlant ? (
                <>
                    <Pressable
                        style={[styles.plantNameWrap, { top: 14 }]}
                        onPress={() => navigation.navigate('Plant', { screen: 'PlantHome' })}
                    >

                    <Text
                        style={[styles.plantNameText, { fontSize: plantNameFontSize }]}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        onTextLayout={e => {
                          if (e.nativeEvent.lines.length > 1 && plantNameFontSize > 28) {
                            setPlantNameFontSize(s => s - 2);
                          }
                        }}
                    >
                      {plantName ? plantName : ''}
                    </Text>

                    <View style={styles.hpRow}>
                      <Text style={styles.hpLabel}>
                        현재{'\n'}상태
                      </Text>

                      <View style={styles.hpArea}>
                        <Text style={styles.levelText}>Lv {level}</Text>

                        <View style={styles.hpOuter}>
                          <View style={[styles.hpFill, { width: `${hpPercent}%` }]} />
                        </View>
                      </View>
                    </View>
                    </Pressable>

                  <Pressable
                      style={[styles.signTouchArea, { left: '3%', top: '24%' }]}
                      onPress={onPressWaterSign}
                  >
                    {waterNeedCheck && (
                        <View style={styles.signAlertBadge}>
                          <Text style={styles.signAlertBadgeText}>!</Text>
                        </View>
                    )}
                    <Text style={styles.signTitleText}>수위</Text>
                    <View style={styles.signSubWrap}>
                      <Text style={styles.signSubText}>{waterStatusText}</Text>
                    </View>
                  </Pressable>

                  <Pressable
                      style={[styles.signTouchArea, { left: '36%', top: '24%' }]}
                      onPress={onPressNutrientSign}
                  >
                    {nutrientNeedCheck && (
                        <View style={styles.signAlertBadge}>
                          <Text style={styles.signAlertBadgeText}>!</Text>
                        </View>
                    )}
                    <Text style={styles.signTitleText}>농도</Text>
                    <View style={styles.signSubWrap}>
                      <Text style={styles.signSubText}>{nutrientStatusText}</Text>
                    </View>
                  </Pressable>

                  <View style={[styles.signTouchArea, { left: '68.5%', top: '24%' }]}>
                    <Text style={styles.signTitleText}>온습도</Text>
                    <View style={styles.signSubWrap}>
                      <Text style={styles.signSubText}>{tempHumText}</Text>
                    </View>
                  </View>

                  <Animated.View
                      style={[
                        styles.characterWrapper,
                        {
                          transform: [{ translateX }, { translateY: combinedTranslateY }],
                        },
                      ]}
                  >
                    {latestNotification && (
                        <Pressable style={styles.alarmWrap} onPress={onPressBalloon}>
                          <View style={styles.alarmBox}>
                            <Image source={ALARM_ICON} style={styles.alarmIcon} />
                          </View>
                        </Pressable>
                    )}
                    <Pressable onPress={handleCharacterPress}>
                      <Image
                          source={characterUrl ? { uri: characterUrl } : TOMATO_NORMAL}
                          style={styles.tomatoImage}
                          resizeMode="contain"
                      />
                    </Pressable>
                  </Animated.View>
                </>
            ) : (
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyMessageData}>
                    <Text style={styles.emptyTextTitle}>등록된 식물이 없어요!</Text>
                    <Text style={styles.emptyTextSub}>
                      오른쪽 아래 메뉴에서{'\n'}새로운 식물을 등록해주세요 🌱
                    </Text>
                  </View>
                </View>
            )}
          </ScrollView>

          <Modal
              transparent
              visible={isModalVisible}
              animationType="none"
              onRequestClose={closeModal}
              statusBarTranslucent
          >
            <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
              {/* ✅ 배경 클릭 시 닫기: 얘만 터치 먹게 */}
              <Pressable style={StyleSheet.absoluteFill} onPress={closeModal} />

              {/* ✅ 여기는 responder 강탈 금지 (ScrollView가 먹어야 함) */}
              <Animated.View style={[styles.modalCardWrap, { transform: [{ scale: modalScale }] }]}>
                {/* ✅ 카드 영역 터치가 배경으로 새는 거 방지용 (닫히지 않게만) */}
                <Pressable onPress={() => {}} style={styles.modalCardTouch}>
                  <PixelBox style={styles.modalContent} innerStyle={styles.modalInner}>
                    <View style={styles.modalHeaderCustom}>
                      <Text style={styles.modalHeaderTextCustom}>{modalTitle}</Text>
                      <Pressable style={styles.closeBtn} onPress={closeModal}>
                        <Text style={styles.closeBtnText}>X</Text>
                      </Pressable>
                    </View>

                    <ScrollView
                        style={[
                          styles.modalScroll,
                          modalTitle === '오늘의 알림' && styles.modalScrollLimit4,
                        ]}
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                    >
                      {modalBodyItems.length > 0 ? (
                          modalBodyItems.map((item, idx) => (
                              <View key={idx} style={styles.notifCard}>
                                <View style={styles.notifRow}>
                                  {modalType === 'list' && (
                                      <Text style={styles.tagBadgeText}>
                                        [{getTagFromMessage(item.message)}]
                                      </Text>
                                  )}

                                  {modalType === 'sign' && item.sensor ? (
                                      renderHighlightedGuide(
                                          item.message,
                                          getGuideKeywords(
                                              item.sensor.kind,
                                              item.sensor.current,
                                              item.sensor.ideal_min,
                                              item.sensor.ideal_max,
                                          ),
                                      )
                                  ) : (
                                      <Text style={styles.notifMessage}>{item.message}</Text>
                                  )}
                                </View>

                                {modalType === 'sign' && item.sensor && <SensorBar data={item.sensor} />}

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
                </Pressable>
              </Animated.View>
            </Animated.View>
          </Modal>

        </View>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: { flex: 1, backgroundColor: '#000' },

  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyMessageData: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: BORDER_COLOR,
  },
  emptyTextTitle: {
    fontFamily: FONT,
    fontSize: 22,
    color: '#300e08',
    marginBottom: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyTextSub: {
    fontFamily: FONT,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  topBellIconBtn: { position: 'absolute', right: '53%', zIndex: 70 },
  bellImage: { width: 52, height: 52, resizeMode: 'contain' },
  bellBadge: {
    position: 'absolute',
    top: 5,
    right: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D25353',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  bellBadgeText: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#FFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  modeToggleContainer: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    zIndex: 60,
    overflow: 'hidden',
  },
  toggleSlider: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: '100%',
  },
  togglePiece: {
    width: 50,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  togglePieceText: {
    fontFamily: FONT,
    fontSize: 14,
    color: BORDER_COLOR,
    opacity: 0.4,
    zIndex: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  textActive: { color: '#FFF', opacity: 1 },

  plantNameWrap: {
    position: 'absolute',
    left: 8,
    width: 143,
    height: 100,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 15,
    paddingTop: 10,
    zIndex: 90,
  },

  plantNameText: {
    fontFamily: FONT,
    color: SIGN_TEXT_COLOR,
    textAlign: 'left',
    fontSize: 30,
    lineHeight: 34,
    maxWidth: 260,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  hpRow: {
    marginTop: -5,
    flexDirection: 'row',
    alignItems: 'center',
  },

  hpLabel: {
    fontFamily: FONT,
    fontSize: 10,
    color: SIGN_TEXT_COLOR,
    lineHeight: 10,
    marginRight: 10,
    textAlign: 'center',
    marginTop: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  hpBarWrap: {
    alignItems: 'center',
  },

  hpArea: {
    position: 'relative',
    width: 120,
    paddingTop: 16,
  },

  levelText: {
    position: 'absolute',
    top: -5,
    right: 0,
    fontFamily: FONT,
    fontSize: 20,
    lineHeight: 22,
    color: SIGN_TEXT_COLOR,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  hpOuter: {
    width: 120,
    height: 14,
    borderWidth: 2,
    borderColor: BORDER_COLOR,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
    borderRadius: 2,
  },

  hpFill: {
    height: '100%',
    backgroundColor: '#75A743',
  },

  signTouchArea: {
    position: 'absolute',
    width: '28%',
    height: '11%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 32,
  },

  signTitleText: {
    fontFamily: FONT,
    fontSize: 16,
    lineHeight: 22,
    color: SIGN_TEXT_COLOR,
    textAlign: 'center',
    marginTop: 10,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  signSubWrap: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  signSubText: {
    marginTop: 0,
    fontFamily: FONT,
    fontSize: 20,
    lineHeight: 20,
    color: SIGN_TEXT_COLOR,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  characterWrapper: {
    position: 'absolute',
    bottom: 150,
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  tomatoImage: { width: 320, height: 320, resizeMode: 'contain' },

  alarmWrap: { position: 'absolute', top: 20, right: 30, zIndex: 20 },
  alarmBox: {
    width: 78,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmIcon: { width: 70, height: 70, resizeMode: 'contain' },

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

  modalHeaderCustom: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
    paddingBottom: 10,
    marginBottom: 10,
  },
  modalHeaderTextCustom: {
    fontFamily: FONT,
    fontSize: 20,
    color: BORDER_COLOR,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  closeBtn: { padding: 4 },
  closeBtnText: {
    fontFamily: FONT,
    fontSize: 18,
    color: '#999',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  modalScroll: { width: '100%' },
  modalScrollLimit4: { maxHeight: LIST_MODAL_MAX_HEIGHT },
  modalScrollContent: { paddingBottom: 10 },

  notifCard: {
    width: '100%',
    minHeight: NOTIF_CARD_MIN_H,
    backgroundColor: '#fafaf6',
    borderRadius: 6,
    padding: 12,
    marginBottom: NOTIF_CARD_GAP,
    borderWidth: 1,
    borderColor: '#e6e6e0',
  },
  notifRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tagBadgeText: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#75A743',
    marginRight: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  notifMessage: {
    flex: 1,
    fontFamily: FONT,
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  notifTime: {
    alignSelf: 'flex-end',
    fontFamily: FONT,
    fontSize: 11,
    color: '#bbb',
    marginTop: 4,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emptyText: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  guideKeyword: { fontFamily: FONT, fontSize: 18, color: BORDER_COLOR },

  sensorBlock: { marginTop: 12, width: '100%' },
  sensorTitle: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#4A2A1E',
    marginBottom: 8,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
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

  sensorLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sensorLabelText: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#333',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  sensorMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sensorMetaText: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#666',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },

  pixelBoxContainer: { position: 'relative', marginHorizontal: PIXEL * 2 },
  pixelBgUnderlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD_BG,
  },
  cardInner: {
    padding: 15,
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
  },

  shadeLeft: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    backgroundColor: '#000',
    zIndex: 1,
  },
  shadeRight: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    backgroundColor: '#000',
    zIndex: 1,
  },

  pixelTop: {
    position: 'absolute',
    top: -PIXEL,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelBottom: {
    position: 'absolute',
    bottom: -PIXEL,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelLeft: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    left: -PIXEL,
    width: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelRight: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    right: -PIXEL,
    width: PIXEL,
    backgroundColor: BORDER_COLOR,
  },

  pixelCornerTL1: {
    position: 'absolute',
    top: 0,
    left: -PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerTL2: {
    position: 'absolute',
    top: -PIXEL,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerTL3: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },

  pixelCornerTR1: {
    position: 'absolute',
    top: 0,
    right: -PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerTR2: {
    position: 'absolute',
    top: -PIXEL,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerTR3: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },

  pixelCornerBL1: {
    position: 'absolute',
    bottom: 0,
    left: -PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerBL2: {
    position: 'absolute',
    bottom: -PIXEL,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerBL3: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },

  pixelCornerBR1: {
    position: 'absolute',
    bottom: 0,
    right: -PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerBR2: {
    position: 'absolute',
    bottom: -PIXEL,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  pixelCornerBR3: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },

  signAlertBadge: {
    position: 'absolute',
    top: 22,
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D25353',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  signAlertBadgeText: {
    fontFamily: FONT,
    fontSize: 14,
    color: '#FFF',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalCardWrap: {
    // 가운데 정렬은 modalOverlay가 이미 해줌
    // responder 뺏지 않게 그냥 래퍼만 둠
  },

  modalCardTouch: {
    // 카드 안 눌러도 되는 “터치 차단막”
    // 배경 닫기 Pressable로 이벤트가 새는 걸 방지
  },

});
