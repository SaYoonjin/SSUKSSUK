import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';

export default function PlantAddEditScreen({ route, navigation }: any) {
  const { mode, plantData } = route.params || { mode: 'add' };
  const isEdit = mode === 'edit';

  const [type, setType] = useState(isEdit ? plantData.type : '');
  const [nickname, setNickname] = useState(isEdit ? plantData.nickname : '');
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);

  const plantTypes = ['토마토', '상추', '고추', '바질'];

  // 전체 디바이스 목록
  const allDevices = [
    { id: 'dev1', name: '디바이스 1', status: 'unavailable' },
    { id: 'dev2', name: '디바이스 2', status: 'unavailable' },
    { id: 'dev3', name: '디바이스 3', status: 'available' },
    { id: 'none', name: '연결 해제', status: 'available' },
  ];

  // [수정 포인트 1] 추가 모드일 때는 '연결 해제'를 목록에서 제외
  const displayedDevices = isEdit
    ? allDevices
    : allDevices.filter(d => d.id !== 'none');

  const handleSave = () => {
    console.log('Saved:', { type, nickname, selectedDevice });
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEdit ? '식물 수정하기' : '식물 추가하기'}
          </Text>
        </View>

        {/* 1. 식물 종류 (zIndex: 3000) */}
        <View style={{ zIndex: 3000, marginBottom: 20 }}>
          <Text style={styles.label}>식물 종류</Text>
          {isEdit ? (
            <PixelInput
              value={type}
              editable={false}
              style={{ backgroundColor: '#fafaf6' }}
            />
          ) : (
            <PixelDropdown
              placeholder="식물 종류 선택"
              items={plantTypes.map(t => ({
                label: t,
                value: t,
                active: true,
              }))}
              selectedValue={type}
              onSelect={(val: string) => setType(val)}
            />
          )}
        </View>

        {/* 2. 식물 닉네임 (zIndex: 2000) */}
        <View style={{ zIndex: 2000, marginBottom: 20 }}>
          <Text style={styles.label}>식물 닉네임</Text>
          <PixelInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="예: 토토"
          />
        </View>

        {/* 3. 디바이스 선택 (zIndex: 1000) */}
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
              statusText:
                d.id === 'none'
                  ? ''
                  : d.status === 'available'
                  ? '선택 가능'
                  : '선택 불가능',
            }))}
            // 수정 모드일 때만 분리선 기능 활성화
            hasSeparateItem={isEdit}
          />
        </View>

        {/* 저장 버튼 */}
        <View style={{ zIndex: 0 }}>
          <Pressable onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>
              {isEdit ? '수정하기' : '추가하기'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigation.goBack()}
            style={{ marginTop: 20, alignItems: 'center' }}
          >
            <Text
              style={{
                fontFamily: 'NeoDunggeunmoPro-Regular',
                textDecorationLine: 'underline',
                color: '#555',
              }}
            >
              취소
            </Text>
          </Pressable>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ---------------- 컴포넌트들 ----------------

function PixelInput({
  value,
  onChangeText,
  placeholder,
  editable = true,
  style,
}: any) {
  return (
    <View style={[styles.pixelContainer, style]}>
      <BorderPixels />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        editable={editable}
        placeholderTextColor="#999"
        // [수정 포인트 2] 한글 입력을 위한 필수 속성들
        autoCorrect={false} // 자동 수정 끄기 (자소 분리 방지)
        spellCheck={false} // 맞춤법 검사 끄기
        autoCapitalize="none" // 자동 대문자 끄기
        autoComplete="off" // 자동 완성 끄기
        textContentType="none"
      />
    </View>
  );
}

function PixelDropdown({
  items,
  selectedValue,
  onSelect,
  placeholder,
  hasSeparateItem,
}: any) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel =
    items.find((i: any) => i.value === selectedValue)?.label || placeholder;

  return (
    <View style={{ position: 'relative' }}>
      <Pressable onPress={() => setIsOpen(!isOpen)}>
        <View style={styles.pixelContainer}>
          <BorderPixels />
          <View style={styles.dropdownInner}>
            <Text
              style={[styles.inputText, !selectedValue && { color: '#999' }]}
            >
              {selectedLabel}
            </Text>
            <Text style={styles.arrow}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </View>
      </Pressable>

      {isOpen && (
        <View style={styles.dropdownListAbsolute}>
          <BorderPixels />
          <View style={styles.listContent}>
            {items.map((item: any, index: number) => {
              const isDisconnectItem = item.value === 'none';

              return (
                <View key={item.value}>
                  {isDisconnectItem && hasSeparateItem && (
                    <View style={styles.thickDivider} />
                  )}

                  <Pressable
                    style={[
                      styles.listItem,
                      !item.active && styles.listItemDisabled,
                    ]}
                    onPress={() => {
                      if (item.active) {
                        onSelect(item.value);
                        setIsOpen(false);
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.itemLabel,
                        // 연결 해제일 때 빨간색 글씨
                        isDisconnectItem && { color: '#E04B4B' },
                      ]}
                    >
                      {item.label}
                    </Text>

                    {item.statusText ? (
                      <Text
                        style={[
                          styles.itemStatus,
                          item.active
                            ? { color: '#75A743' }
                            : { color: '#E04B4B' },
                        ]}
                      >
                        {item.statusText}
                      </Text>
                    ) : null}
                  </Pressable>

                  {!isDisconnectItem &&
                    index < items.length - 1 &&
                    items[index + 1].value !== 'none' && (
                      <View style={styles.divider} />
                    )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const BorderPixels = () => (
  <>
    <View style={styles.borderTop} />
    <View style={styles.borderBottom} />
    <View style={styles.borderLeft} />
    <View style={styles.borderRight} />
    <View style={styles.cornerTL} />
    <View style={styles.cornerTR} />
    <View style={styles.cornerBL} />
    <View style={styles.cornerBR} />
  </>
);

const BG_COLOR = '#EDEDE9';
const GREEN_BTN = '#2E5A35';
const PIXEL = 4;
const BORDER_COLOR = '#000';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_COLOR },
  container: { padding: 30, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontFamily: 'NeoDunggeunmoPro-Regular' },
  label: {
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    marginBottom: 8,
  },

  pixelContainer: {
    height: 50,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },
  textInput: {
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#000',
    padding: 0,
    height: '100%',
  },
  dropdownInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular' },
  arrow: { fontSize: 14 },

  dropdownListAbsolute: {
    position: 'absolute',
    top: 54,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    elevation: 10,
    zIndex: 9999,
  },
  listContent: { padding: 4 },
  listItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listItemDisabled: { opacity: 0.5 },

  divider: { height: 1, backgroundColor: '#EEE', marginHorizontal: 4 },
  thickDivider: {
    height: 2,
    backgroundColor: '#000',
    marginHorizontal: 0,
    marginVertical: 0,
  },

  itemLabel: {
    fontSize: 18,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#000',
  },
  itemStatus: { fontSize: 14, fontFamily: 'NeoDunggeunmoPro-Regular' },

  saveBtn: {
    marginTop: 20,
    backgroundColor: GREEN_BTN,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'NeoDunggeunmoPro-Regular',
  },

  borderTop: {
    position: 'absolute',
    top: 0,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  borderLeft: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    left: 0,
    width: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  borderRight: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    right: 0,
    width: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
});
