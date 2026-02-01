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
} from 'react-native';

// BottomSheet 관련 컴포넌트 복구
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';

const BG_DAY = require('../assets/background1.png');
const BG_NIGHT = require('../assets/background2.png');
const ALARM_ICON = require('../assets/alarm_balloon.png');
const TOMATO_NORMAL = require('../assets/tomato_normal.png');

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;

// [복구] 스타일에서 사용되는 상수들
const SHEET_BG = '#D4E1C6';
const BORDER = '#1A1A1A';
const FONT = 'NeoDunggeunmoPro-Regular';

// [설정] 캐릭터 이동 범위
const MOVE_RANGE_X = 80;
const MOVE_RANGE_Y = 30;

// --------------------
// 픽셀 박스 컴포넌트 (복구)
// --------------------
function PixelBox({
  children,
  style,
  bgColor = '#FFFFFF',
  cardThin = false,
}: any) {
  const t = cardThin ? 2 : 4;
  const s = cardThin ? 4 : 8;
  const step = t;

  return (
    <View style={[styles.pixelBoxContainer, style]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: bgColor, margin: t },
        ]}
      />
      <View style={[styles.pLine, { top: 0, left: s, right: s, height: t }]} />
      <View
        style={[styles.pLine, { bottom: 0, left: s, right: s, height: t }]}
      />
      <View style={[styles.pLine, { left: 0, top: s, bottom: s, width: t }]} />
      <View style={[styles.pLine, { right: 0, top: s, bottom: s, width: t }]} />
      <View
        style={[styles.pLine, { top: t, left: t, width: step, height: step }]}
      />
      <View
        style={[styles.pLine, { top: 0, left: t, width: step, height: step }]}
      />
      <View
        style={[styles.pLine, { top: t, left: 0, width: step, height: step }]}
      />
      <View
        style={[styles.pLine, { top: t, right: t, width: step, height: step }]}
      />
      <View
        style={[styles.pLine, { top: 0, right: t, width: step, height: step }]}
      />
      <View
        style={[styles.pLine, { top: t, right: 0, width: step, height: step }]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: t, left: t, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: 0, left: t, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: t, left: 0, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: t, right: t, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: 0, right: t, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pLine,
          { bottom: t, right: 0, width: step, height: step },
        ]}
      />
      <View
        style={[
          styles.pixelBoxInner,
          cardThin && { padding: 10, paddingTop: 12 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

// --------------------
// 바텀시트 배경 (복구)
// --------------------
function PixelSheetBackground({ style }: BottomSheetBackgroundProps) {
  return (
    <View style={[style, { backgroundColor: 'transparent', top: -1 }]}>
      <View style={styles.pixelSheetFrame}>
        <View style={styles.pixelSheetInner} />
        <View style={styles.pixelSheetCornerTL} />
        <View style={styles.pixelSheetCornerTR} />
      </View>
    </View>
  );
}

// --------------------
// 유틸 함수
// --------------------
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

// [수정] navigation prop은 사용하지 않으므로 제거 (ESLint 에러 해결)
export default function MainScreen() {
  const [useDayBg, setUseDayBg] = useState(() => isDayTime(new Date()));
  // [수정] setHasAlarm 미사용으로 제거
  const [hasAlarm] = useState(false);

  // --- 애니메이션 값 ---
  const translateX = useRef(new Animated.Value(0)).current; // 좌우 산책
  const translateY_walk = useRef(new Animated.Value(0)).current; // 상하 산책
  const translateY_jump = useRef(new Animated.Value(0)).current; // 점프 모션

  // 산책(Y)과 점프(Y)를 합쳐서 최종 Y 위치 결정
  const combinedTranslateY = Animated.add(translateY_walk, translateY_jump);

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['8%', '43%'], []);

  const backgroundSource = useMemo(
    () => (useDayBg ? BG_DAY : BG_NIGHT),
    [useDayBg],
  );

  const scheduleBackgroundSwitch = useCallback(() => {
    const now = new Date();
    setUseDayBg(isDayTime(now));
    const next = getNextSwitchTime(now);
    const ms = Math.max(500, next.getTime() - now.getTime());
    setTimeout(() => scheduleBackgroundSwitch(), ms);
  }, []);

  useEffect(() => {
    scheduleBackgroundSwitch();
  }, [scheduleBackgroundSwitch]);

  // ----------------------------------------
  // 🍅 캐릭터 애니메이션 로직
  // ----------------------------------------

  // [수정] useCallback 적용 및 의존성 추가 (ESLint 경고 해결)
  const moveRandomly = useCallback(() => {
    const toX =
      Math.floor(Math.random() * (MOVE_RANGE_X * 2 + 1)) - MOVE_RANGE_X;
    const toY =
      Math.floor(Math.random() * (MOVE_RANGE_Y * 2 + 1)) - MOVE_RANGE_Y;
    const duration = 3000 + Math.random() * 3000;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: toX,
        duration: duration,
        useNativeDriver: true,
        // [수정] Easing.sine -> Easing.ease (런타임 에러 해결)
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(translateY_walk, {
        toValue: toY,
        duration: duration,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setTimeout(moveRandomly, 1000 + Math.random() * 2000);
      }
    });
  }, [translateX, translateY_walk]);

  // 2. 터치 반응 (점프)
  const handleCharacterPress = () => {
    translateY_jump.setValue(0);

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

  // [수정] 의존성 배열에 moveRandomly 추가
  useEffect(() => {
    moveRandomly();
  }, [moveRandomly]);

  return (
    <View style={styles.root}>
      <ImageBackground
        source={backgroundSource}
        style={styles.bg}
        resizeMode="cover"
      >
        {/* 알림 버튼 */}
        <Pressable style={styles.alarmWrap} onPress={() => {}}>
          <View style={styles.alarmBox}>
            <Image source={ALARM_ICON} style={styles.alarmIcon} />
            {hasAlarm && <View style={styles.badgeDot} />}
          </View>
        </Pressable>

        {/* 🍅 캐릭터 (Animated View) */}
        <Animated.View
          style={[
            styles.characterWrapper,
            {
              transform: [
                { translateX: translateX },
                { translateY: combinedTranslateY },
              ],
            },
          ]}
        >
          <Pressable onPress={handleCharacterPress}>
            <Image source={TOMATO_NORMAL} style={styles.tomatoImage} />
          </Pressable>
        </Animated.View>
      </ImageBackground>

      {/* [복구] 바텀 시트 및 내부 UI */}
      {/*<BottomSheet*/}
      {/*  ref={sheetRef}*/}
      {/*  index={0}*/}
      {/*  snapPoints={snapPoints}*/}
      {/*  enablePanDownToClose={false}*/}
      {/*  backgroundComponent={PixelSheetBackground}*/}
      {/*  handleStyle={styles.handleArea}*/}
      {/*  handleIndicatorStyle={styles.handleIndicator}*/}
      {/*>*/}
      {/*  <BottomSheetView style={styles.sheetContent}>*/}
      {/*    <View style={styles.sheetHeader}>*/}
      {/*      <View style={styles.headerLeft}>*/}
      {/*        <Text style={styles.plantName}>토토</Text>*/}
      {/*        <Text style={styles.plantType}>(방울토마토)</Text>*/}
      {/*      </View>*/}
      {/*      <View style={styles.dDayPill}>*/}
      {/*        <Text style={styles.dDayText}>D+45</Text>*/}
      {/*      </View>*/}
      {/*    </View>*/}

      {/*    <PixelBox style={styles.statusPanel} bgColor="#F2F7ED" cardThin>*/}
      {/*      <Text style={styles.panelTitle}>현재 상태</Text>*/}
      {/*      <View style={styles.barTrack}>*/}
      {/*        <View style={[styles.barFill, { width: '80%' }]} />*/}
      {/*      </View>*/}
      {/*      <Text style={[styles.panelTitle, { marginTop: 12 }]}>*/}
      {/*        성장 상태*/}
      {/*      </Text>*/}
      {/*      <View style={styles.barTrack}>*/}
      {/*        <View style={[styles.barFillDark, { width: '65%' }]} />*/}
      {/*      </View>*/}
      {/*    </PixelBox>*/}

      {/*    <Text style={styles.sectionTitle}>현재 기기 상태</Text>*/}

      {/*    <View style={styles.cardRow}>*/}
      {/*      <PixelBox style={styles.card} bgColor="#BFD1F1" cardThin>*/}
      {/*        <Text style={styles.cardTitle}>수위</Text>*/}
      {/*        <Text style={styles.cardDesc}>충분함</Text>*/}
      {/*      </PixelBox>*/}
      {/*      <PixelBox style={styles.card} bgColor="#E7CF90" cardThin>*/}
      {/*        <Text style={styles.cardTitle}>농도</Text>*/}
      {/*        <Text style={styles.cardDesc}>적당함</Text>*/}
      {/*      </PixelBox>*/}
      {/*      <PixelBox style={styles.card} bgColor="#DDE8C8" cardThin>*/}
      {/*        <Text style={styles.cardTitle}>기온/습도</Text>*/}
      {/*        <Text style={styles.cardDesc}>25도 / 58%</Text>*/}
      {/*      </PixelBox>*/}
      {/*    </View>*/}
      {/*  </BottomSheetView>*/}
      {/*</BottomSheet>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },

  // --- 픽셀 공통 요소 ---
  pLine: { position: 'absolute', backgroundColor: BORDER },
  pixelBoxContainer: { position: 'relative' },
  pixelBoxInner: { padding: 12, paddingTop: 14 },

  // --- 바텀시트 배경 ---
  pixelSheetFrame: { flex: 1, backgroundColor: 'transparent' },
  pixelSheetInner: {
    flex: 1,
    backgroundColor: SHEET_BG,
    borderTopWidth: 4,
    borderColor: BORDER,
    marginTop: 0,
  },
  pixelSheetCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 8,
    height: 8,
    backgroundColor: 'transparent',
    borderLeftWidth: 4,
    borderTopWidth: 4,
    borderColor: BORDER,
  },
  pixelSheetCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    backgroundColor: 'transparent',
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderColor: BORDER,
  },

  // --- 캐릭터 스타일 ---
  characterWrapper: {
    position: 'absolute',
    bottom: 150, // 위치 조정됨 (지면 위)
    alignSelf: 'center',
    zIndex: 10,
  },
  tomatoImage: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
  },

  // --- 레이아웃 ---
  alarmWrap: { position: 'absolute', top: 80, right: 1, zIndex: 20 },
  alarmBox: {
    width: 78,
    height: 78,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmIcon: { width: 70, height: 70, resizeMode: 'contain' },
  badgeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
    borderWidth: 2,
    borderColor: 'white',
  },

  // 바텀시트 내부 스타일
  handleArea: { paddingTop: 12, paddingBottom: 4 },
  handleIndicator: {
    width: 60,
    height: 5,
    borderRadius: 10,
    backgroundColor: BORDER,
    opacity: 0.2,
  },
  sheetContent: { flex: 1, paddingHorizontal: 20 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  plantName: { fontSize: 32, color: '#1A1A1A', fontFamily: FONT },
  plantType: {
    fontSize: 16,
    color: '#1A1A1A',
    opacity: 0.6,
    marginBottom: 4,
    fontFamily: FONT,
  },
  dDayPill: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  dDayText: { fontSize: 13, color: '#FFF', fontFamily: FONT },
  statusPanel: { marginTop: 4 },
  panelTitle: {
    fontSize: 13,
    color: '#1A1A1A',
    marginBottom: 8,
    fontFamily: FONT,
  },
  barTrack: {
    height: 18,
    borderWidth: 3,
    borderColor: BORDER,
    backgroundColor: '#FFF',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#7EC37A' },
  barFillDark: { height: '100%', backgroundColor: '#2E5A35' },
  sectionTitle: {
    marginTop: 24,
    fontSize: 18,
    color: '#1A1A1A',
    fontFamily: FONT,
  },
  cardRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  card: { flex: 1, minHeight: 100, justifyContent: 'center' },
  cardTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 4,
    fontFamily: FONT,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 11,
    color: '#1A1A1A',
    opacity: 0.8,
    fontFamily: FONT,
    textAlign: 'center',
  },
});
