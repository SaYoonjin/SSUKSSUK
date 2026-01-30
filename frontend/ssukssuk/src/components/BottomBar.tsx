import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  ImageBackground,
  Animated,
  Easing,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const ASSETS = {
  Home: {
    on: require('../assets/home_select.png'),
    off: require('../assets/home_not_select.png'),
  },
  History: {
    on: require('../assets/history_select.png'),
    off: require('../assets/history_not_select.png'),
  },
  Plant: {
    on: require('../assets/plant_select.png'),
    off: require('../assets/plant_not_select.png'),
  },
  Profile: {
    on: require('../assets/profile_select.png'),
    off: require('../assets/profile_not_select.png'),
  },
} as const;

type RouteName = keyof typeof ASSETS;
const BOTTOM_BG = require('../assets/bottom.png');

// ✅ [신규] 애니메이션을 담당할 개별 탭 컴포넌트
function TabItem({
  name,
  isFocused,
  onPress,
}: {
  name: RouteName;
  isFocused: boolean;
  onPress: () => void;
}) {
  // 애니메이션 값 (크기 조절용)
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      // 선택되었을 때: 0.8배로 작아졌다가 -> 1배로 튀어오르는 효과 (Bounce)
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3, // 튕기는 정도 (낮을수록 많이 튕김)
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // 선택 해제됐을 때: 크기 원상복구
      scaleAnim.setValue(1);
    }
  }, [isFocused, scaleAnim]);

  return (
    <Pressable onPress={onPress} style={styles.item}>
      <Animated.Image
        source={isFocused ? ASSETS[name].on : ASSETS[name].off}
        style={[
          styles.icon,
          {
            transform: [{ scale: scaleAnim }], // 애니메이션 적용
          },
        ]}
        resizeMode="contain"
      />
    </Pressable>
  );
}

export default function BottomBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={BOTTOM_BG}
        resizeMode="stretch"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const name = route.name as RouteName;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (isFocused) {
              if (name === 'History') {
                navigation.navigate('History', { screen: 'HistoryHome' });
              }
            } else if (!event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              name={name}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 90,
    borderTopWidth: 0,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 55,
    height: 55,
    marginTop: 14,
  },
});
