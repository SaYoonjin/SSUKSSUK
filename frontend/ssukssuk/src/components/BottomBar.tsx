import React, { useEffect, useRef } from 'react';
import {
  View,
  Pressable,
  ImageBackground,
  Animated,
  StyleSheet,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';

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
const BASE_H = 90;

// ---------------- TabItem ----------------

function TabItem({
                   name,
                   isFocused,
                   onPress,
                 }: {
  name: RouteName;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isFocused]);

  return (
      <Pressable onPress={onPress} style={styles.item}>
        <Animated.Image
            source={isFocused ? ASSETS[name].on : ASSETS[name].off}
            style={[styles.icon, { transform: [{ scale: scaleAnim }] }]}
            resizeMode="contain"
        />
      </Pressable>
  );
}

// ---------------- BottomBar ----------------

export default function BottomBar({ state, navigation }: BottomTabBarProps) {
  return (
      // ✅ SafeAreaView가 시스템 버튼 영역 자동 보호
      <SafeAreaView edges={['bottom']} style={styles.safe}>
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

                if (!isFocused && !event.defaultPrevented) {
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
      </SafeAreaView>
  );
}

// ---------------- Styles ----------------

const styles = StyleSheet.create({
  safe: {
    backgroundColor: 'transparent',
  },

  container: {
    height: BASE_H,
  },

  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginTop: 5,
  },
});
