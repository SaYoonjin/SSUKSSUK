import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';

const BG_COLOR = '#EDEDE9';
const GREEN_BTN = '#2E5A35';
const PIXEL = 4;
const BORDER_COLOR = '#300E08';
const CARD_BG = '#F6F6F6';

export default function PlantAddEditScreen({ route, navigation }: any) {
  const { mode, plantData } = route.params || { mode: 'add' };
  const isEdit = mode === 'edit';

  const [type, setType] = useState(isEdit ? plantData.type : '');
  const [nickname, setNickname] = useState(isEdit ? plantData.nickname : '');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const plantTypes = ['토마토', '상추', '고추', '바질', '딸기', '케일', '파프리카', '청경채'];
  const allDevices = [
    { id: 'dev1', name: '디바이스 1', status: 'unavailable' },
    { id: 'dev2', name: '디바이스 2', status: 'unavailable' },
    { id: 'dev3', name: '디바이스 3', status: 'available' },
    { id: 'dev4', name: '디바이스 4', status: 'available' },
    { id: 'dev5', name: '디바이스 5', status: 'available' },
    { id: 'none', name: '연결 해제', status: 'available' },
  ];

  const displayedDevices = isEdit ? allDevices : allDevices.filter(d => d.id !== 'none');

  const handleSave = () => {
    navigation.goBack();
  };

  return (
      <View style={styles.screen}>
        <View style={styles.fixedHeader}>
          <Text style={styles.headerTitle}>
            {isEdit ? '식물 수정하기' : '식물 추가하기'}
          </Text>
        </View>

        <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
          {/* 1. 식물 종류 */}
          <View style={{ zIndex: 3000, marginBottom: 20 }}>
            <Text style={styles.label}>식물 종류</Text>
            {isEdit ? (
                <PixelBox style={{ backgroundColor: '#fafaf6', opacity: 0.8 }}>
                  <View style={styles.inputInner}>
                    <Text style={[styles.inputText, { color: '#666' }]}>{type}</Text>
                  </View>
                </PixelBox>
            ) : (
                <PixelDropdown
                    placeholder="식물 종류 선택"
                    items={plantTypes.map(t => ({ label: t, value: t, active: true }))}
                    selectedValue={type}
                    onSelect={(val: string) => setType(val)}
                />
            )}
          </View>

          {/* 2. 식물 닉네임 */}
          <View style={{ zIndex: 2000, marginBottom: 20 }}>
            <Text style={styles.label}>식물 닉네임</Text>
            <PixelInput value={nickname} onChangeText={setNickname} placeholder="예: 토토" />
          </View>

          {/* 3. 디바이스 선택 */}
          <View style={{ zIndex: 1000, marginBottom: 40 }}>
            <Text style={styles.label}>디바이스 선택</Text>
            <PixelDropdown
                placeholder="디바이스를 선택하세요"
                selectedValue={selectedDevice}
                onSelect={(val: string) => setSelectedDevice(val)}
                items={displayedDevices.map(d => ({
                  label: d.name,
                  value: d.id,
                  active: d.status === 'available',
                  statusText: d.id === 'none' ? '' : (d.status === 'available' ? '선택 가능' : '선택 불가능'),
                }))}
                hasSeparateItem={isEdit}
            />
          </View>

          <PixelButton text={isEdit ? '수정하기' : '추가하기'} onPress={handleSave} />

          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 25, alignItems: 'center' }}>
            <Text style={styles.cancelText}>취소</Text>
          </Pressable>
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
  );
}

// ---------------- 픽셀 UI 컴포넌트들 ----------------

function PixelBox({ children, style, isDropdownList }: any) {
  return (
      <View style={[styles.pixelBoxContainer, style]}>
        <View style={styles.pixelBgUnderlay} />
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
        <View pointerEvents="none" style={[styles.shadeLeft, { left: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]} />
        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.05, width: PIXEL + 1 }]} />
        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, opacity: 0.03, width: PIXEL * 2 }]} />
        <View pointerEvents="none" style={[styles.shadeRight, { right: -PIXEL, top: PIXEL, bottom: PIXEL, opacity: 0.02, width: PIXEL * 4 - 1 }]} />

        <View style={styles.pixelTop} /><View style={styles.pixelBottom} />
        <View style={styles.pixelLeft} /><View style={styles.pixelRight} />
        <View style={styles.pixelCornerTL1} /><View style={styles.pixelCornerTL2} />
        <View style={styles.pixelCornerTR1} /><View style={styles.pixelCornerTR2} />
        <View style={styles.pixelCornerBL1} /><View style={styles.pixelCornerBL2} />
        <View style={styles.pixelCornerBR1} /><View style={styles.pixelCornerBR2} />

        <View style={[styles.cardInner, isDropdownList && { paddingHorizontal: 0, paddingVertical: 0, height: undefined }]}>
          {children}
        </View>
      </View>
  );
}

function PixelDropdown({ items, selectedValue, onSelect, placeholder, hasSeparateItem }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = items.find((i: any) => i.value === selectedValue)?.label || placeholder;

  return (
      <View style={{ position: 'relative', zIndex: isOpen ? 9999 : 1 }}>
        {/* ✅ 헤더 부분 애니메이션 제거 */}
        <Pressable onPress={() => setIsOpen(!isOpen)}>
          <PixelBox>
            <View style={styles.dropdownInner}>
              <Text style={[styles.inputText, !selectedValue && { color: '#999' }]}>{selectedLabel}</Text>
              <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
            </View>
          </PixelBox>
        </Pressable>

        {isOpen && (
            <View style={styles.dropdownListAbsolute}>
              <PixelBox isDropdownList style={{ backgroundColor: CARD_BG }}>
                {/* ✅ 깊이(maxHeight) 240 고정 */}
                <View style={{ maxHeight: 240 }}>
                  <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
                    <View style={styles.listContent}>
                      {items.map((item: any, index: number) => {
                        const isDisconnectItem = item.value === 'none';
                        return (
                            <View key={item.value}>
                              {isDisconnectItem && hasSeparateItem && <View style={styles.thickDivider} />}
                              <Pressable
                                  style={[styles.listItem, !item.active && styles.listItemDisabled]}
                                  onPress={() => { if (item.active) { onSelect(item.value); setIsOpen(false); }}}
                              >
                                <Text style={[styles.itemLabel, isDisconnectItem && { color: '#E04B4B' }]}>{item.label}</Text>
                                {item.statusText && (
                                    <Text style={[styles.itemStatus, item.active ? { color: '#75A743' } : { color: '#E04B4B' }]}>
                                      {item.statusText}
                                    </Text>
                                )}
                              </Pressable>
                              {!isDisconnectItem && index < items.length - 1 && items[index + 1].value !== 'none' && (
                                  <View style={styles.divider} />
                              )}
                            </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              </PixelBox>
            </View>
        )}
      </View>
  );
}

function PixelInput({ value, onChangeText, placeholder, editable = true }: any) {
  return (
      <PixelBox>
        <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            editable={editable}
            placeholderTextColor="#999"
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
        />
      </PixelBox>
  );
}

function PixelButton({ text, onPress }: any) {
  const v = useRef(new Animated.Value(0)).current;
  const pressIn = () => Animated.timing(v, { toValue: 1, duration: 60, useNativeDriver: false }).start();
  const pressOut = () => Animated.timing(v, { toValue: 0, duration: 80, useNativeDriver: false }).start();

  return (
      <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
        <Animated.View style={[
          styles.saveBtn,
          {
            borderBottomWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            borderRightWidth: v.interpolate({ inputRange: [0, 1], outputRange: [4, 2] }) as any,
            marginTop: v.interpolate({ inputRange: [0, 1], outputRange: [20, 22] }) as any,
            marginBottom: v.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) as any,
          }
        ]}>
          <Text style={styles.saveBtnText}>{text}</Text>
        </Animated.View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_COLOR },
  fixedHeader: { marginTop: Platform.OS === "android" ? 60 : 20, marginBottom: 20, alignItems: "center" },
  headerTitle: { fontSize: 30, fontFamily: "NeoDunggeunmoPro-Regular", color: "rgba(36,46,19,0.9)" },
  scrollContent: { paddingHorizontal: 30, paddingBottom: 40, paddingTop: 10 },
  label: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular', marginBottom: 8, color: "rgba(36,46,19,0.9)" },
  inputInner: { width: '100%', height: '100%', justifyContent: 'center' },
  textInput: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular', color: 'rgba(36,46,19,0.9)', width: '100%', height: '100%' },
  dropdownInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '100%' },
  inputText: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular' },
  arrow: { fontSize: 14, color: BORDER_COLOR },
  dropdownListAbsolute: { position: 'absolute', top: 52, left: 0, right: 0, zIndex: 9999 },
  listContent: { width: '100%', backgroundColor: CARD_BG },
  listItem: { paddingVertical: 14, paddingHorizontal: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listItemDisabled: { opacity: 0.3 },
  divider: { height: 1, backgroundColor: '#DDD', marginHorizontal: 10 },
  thickDivider: { height: 3, backgroundColor: BORDER_COLOR },
  itemLabel: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular', color: 'rgba(36,46,19,0.9)' },
  itemStatus: { fontSize: 14, fontFamily: 'NeoDunggeunmoPro-Regular' },
  saveBtn: { backgroundColor: GREEN_BTN, height: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(36,46,19,0.9)'},
  saveBtnText: { color: '#FFF', fontSize: 20, fontFamily: 'NeoDunggeunmoPro-Regular' },
  cancelText: { fontFamily: 'NeoDunggeunmoPro-Regular', textDecorationLine: 'underline', color: '#555', fontSize: 16 },
  pixelBoxContainer: { position: "relative", marginHorizontal: PIXEL * 2, marginVertical: PIXEL, backgroundColor: CARD_BG, borderWidth: 2, borderColor: BORDER_COLOR },
  pixelBgUnderlay: { position: "absolute", top: 0, bottom: 0, left: -PIXEL, right: -PIXEL, backgroundColor: CARD_BG, zIndex: 0 },
  cardInner: { paddingHorizontal: 15, height: 50, justifyContent: 'center', zIndex: 10 },
  shadeLeft: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#000", zIndex: 1 },
  shadeRight: { position: "absolute", top: 0, bottom: 0, backgroundColor: "#000", zIndex: 1 },
  pixelTop: { position: "absolute", top: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
  pixelBottom: { position: "absolute", bottom: -PIXEL, left: PIXEL, right: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
  pixelLeft: { position: "absolute", top: PIXEL, bottom: PIXEL, left: -PIXEL * 2, width: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
  pixelRight: { position: "absolute", top: PIXEL, bottom: PIXEL, right: -PIXEL * 2, width: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 5 },
  pixelCornerTL1: { position: "absolute", top: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerTL2: { position: "absolute", top: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerTR1: { position: "absolute", top: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerTR2: { position: "absolute", top: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerBL1: { position: "absolute", bottom: 0, left: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerBL2: { position: "absolute", bottom: -PIXEL, left: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerBR1: { position: "absolute", bottom: 0, right: -PIXEL, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
  pixelCornerBR2: { position: "absolute", bottom: -PIXEL, right: 0, width: PIXEL, height: PIXEL, backgroundColor: BORDER_COLOR, zIndex: 6 },
});