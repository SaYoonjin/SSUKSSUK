import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';

const TOMATO_IMG = require('../assets/tomato_normal.png');

type Plant = {
  id: string;
  type: string;
  nickname: string;
  isSelected: boolean;
  image: any;
};

export default function PlantListScreen({ navigation }: any) {
  const [plants, setPlants] = useState<Plant[]>([
    {
      id: '1',
      type: '토마토',
      nickname: '토토',
      isSelected: false,
      image: TOMATO_IMG,
    },
    { id: '2', type: '상추', nickname: '츄츄', isSelected: true, image: null },
    {
      id: '3',
      type: '토마토',
      nickname: '투투',
      isSelected: false,
      image: TOMATO_IMG,
    },
  ]);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleSelectPlant = (id: string) => {
    setPlants(prev => prev.map(p => ({ ...p, isSelected: p.id === id })));
  };

  const handleMenuPress = (id: string) => {
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleDelete = (id: string) => {
    Alert.alert('삭제', '정말로 삭제하시겠습니까?', [
      { text: '취소' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => setPlants(prev => prev.filter(p => p.id !== id)),
      },
    ]);
    setActiveMenuId(null);
  };

  const handleEdit = (plant: Plant) => {
    setActiveMenuId(null);
    navigation.navigate('PlantAddEdit', { mode: 'edit', plantData: plant });
  };

  return (
      <TouchableWithoutFeedback onPress={() => setActiveMenuId(null)}>
        <View style={styles.screen}>
          {/* 상단 고정: ScrollView 밖 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>나의 식물</Text>
          </View>

          {/* 스크롤 영역 */}
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.gridContainer}>
              {plants.map(plant => (
                  <View key={plant.id} style={styles.cardWrapper}>
                    <PixelCard>
                      <View style={styles.cardHeader}>
                        <View style={styles.nameRow}>
                          <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: plant.isSelected
                                      ? '#75A743'
                                      : '#CCC',
                                },
                              ]}
                          />
                          <Text style={styles.plantNickname}>{plant.nickname}</Text>
                        </View>
                        <Pressable
                            onPress={e => {
                              e.stopPropagation();
                              handleMenuPress(plant.id);
                            }}
                            hitSlop={10}
                        >
                          <Text style={styles.menuDots}>•••</Text>
                        </Pressable>
                      </View>

                      <View style={styles.imageContainer}>
                        {plant.image ? (
                            <Image
                                source={plant.image}
                                style={styles.plantImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <Text style={styles.emojiText}>🌱</Text>
                        )}
                      </View>

                      <Pressable
                          onPress={() => handleSelectPlant(plant.id)}
                          disabled={plant.isSelected}
                          style={[
                            styles.selectBtn,
                            plant.isSelected && styles.selectBtnActive,
                          ]}
                      >
                        <Text
                            style={[
                              styles.selectBtnText,
                              plant.isSelected && styles.disabledText,
                            ]}
                        >
                          {plant.isSelected ? '선택됨' : '선택하기'}
                        </Text>
                      </Pressable>

                      {activeMenuId === plant.id && (
                          <View style={styles.popupMenu}>
                            <Pressable
                                onPress={() => handleEdit(plant)}
                                style={styles.menuItem}
                            >
                              <Text style={styles.menuText}>수정하기</Text>
                            </Pressable>
                            <View style={styles.menuDivider} />
                            <Pressable
                                onPress={() => handleDelete(plant.id)}
                                style={styles.menuItem}
                            >
                              <Text style={[styles.menuText, styles.deleteText]}>
                                삭제하기
                              </Text>
                            </Pressable>
                          </View>
                      )}
                    </PixelCard>
                  </View>
              ))}
            </View>

            <View style={styles.addButtonContainer}>
              <Pressable
                  onPress={() =>
                      navigation.navigate('PlantAddEdit', { mode: 'add' })
                  }
              >
                <PixelCard compact style={styles.addButtonCard}>
                  <Text style={styles.addButtonText}>+ 식물 추가</Text>
                </PixelCard>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
  );
}

function PixelCard({ children, style, compact }: any) {
  return (
      <View style={[styles.cardContainer, style]}>
        <View style={styles.borderTop} />
        <View style={styles.borderBottom} />
        <View style={styles.borderLeft} />
        <View style={styles.borderRight} />
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
        <View style={[styles.cardInner, compact && styles.cardInnerCompact]}>
          {children}
        </View>
      </View>
  );
}

const BG_COLOR = '#EDEDE9';
const PIXEL = 4;
const BORDER_COLOR = '#300e08';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG_COLOR },
  header: { marginTop: 60, marginBottom: 20, alignItems: 'center' },
  headerTitle: {
    fontSize: 30,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: 'rgba(36,46,19,0.9)',
  },
  scrollContent: { paddingHorizontal: 22, paddingBottom: 40 },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: { width: '48%', marginBottom: 20 },

  cardContainer: { position: 'relative', padding: 4 },
  cardInner: {
    backgroundColor: '#f6f6f6',
    padding: 12,
    alignItems: 'center',
    minHeight: 160,
  },
  cardInnerCompact: {
    minHeight: 0,
    paddingVertical: 14,
    justifyContent: 'center',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  plantNickname: { fontSize: 18, fontFamily: 'NeoDunggeunmoPro-Regular' , color:"rgba(36,46,19,0.9)"},
  menuDots: {
    fontSize: 14,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#300e08',
  },

  imageContainer: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  plantImage: { width: '100%', height: '100%' },

  emojiText: { fontSize: 40 },
  disabledText: { color: '#AAA' },
  deleteText: { color: '#E04B4B' },

  selectBtn: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#300e08',
    backgroundColor: '#f6f6f6',
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  selectBtnActive: {
    backgroundColor: '#f6f6f6',
    borderColor: '#AAA',
    borderBottomWidth: 2,
    borderRightWidth: 2,
    marginTop: 2,
  },
  selectBtnText: {
    fontSize: 14,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#300e08',
  },

  popupMenu: {
    position: 'absolute',
    top: 30,
    right: 10,
    width: 90,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#300e08',
    zIndex: 99,
    elevation: 5,
  },
  menuItem: { paddingVertical: 8, alignItems: 'center' },
  menuText: {
    fontSize: 12,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    color: '#300e08',
  },
  menuDivider: { height: 1, backgroundColor: '#EEE', width: '100%' },

  addButtonContainer: { marginTop: 10 },
  addButtonCard: { width: '100%' },
  addButtonText: {
    fontSize: 20,
    fontFamily: 'NeoDunggeunmoPro-Regular',
    textAlign: 'center',
  },

  borderTop: {
    position: 'absolute',
    top: 0,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: "#300e08",
  },
  borderBottom: {
    position: 'absolute',
    bottom: 0,
    left: PIXEL,
    right: PIXEL,
    height: PIXEL,
    backgroundColor: "#300e08",
  },
  borderLeft: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    left: 0,
    width: PIXEL,
    backgroundColor: "#300e08",
  },
  borderRight: {
    position: 'absolute',
    top: PIXEL,
    bottom: PIXEL,
    right: 0,
    width: PIXEL,
    backgroundColor: "#300e08",
  },
  cornerTL: {
    position: 'absolute',
    top: PIXEL,
    left: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: "#300e08",
  },
  cornerTR: {
    position: 'absolute',
    top: PIXEL,
    right: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: "#300e08",
  },
  cornerBL: {
    position: 'absolute',
    bottom: PIXEL,
    left: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: "#300e08",
  },
  cornerBR: {
    position: 'absolute',
    bottom: PIXEL,
    right: PIXEL,
    width: PIXEL,
    height: PIXEL,
    backgroundColor: BORDER_COLOR,
  },
});
