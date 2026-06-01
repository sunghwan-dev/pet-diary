import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { commonStyles } from '../../styles/theme';
import { petApi } from '../../api/pet';
import { PetResponse } from '../../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

export const HomeScreen = () => {
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const userId = useAuthStore((state) => state.userId);
  const logout = useAuthStore((state) => state.logout);
  const navigation = useNavigation<StackNavigationProp<any>>();

  const fetchPets = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await petApi.getUserPets(userId);
      setPets(data);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      fetchPets();
    }, [fetchPets])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPets();
  };

  const renderPetItem = ({ item }: { item: PetResponse }) => (
    <TouchableOpacity 
      style={[
        styles.petCard,
        { borderColor: item.petTheme || "#FDFBF7", borderWidth: 2 } // 대표 테마 색상을 카드 테두리 색상으로 적용
      ]}
      onPress={() => navigation.navigate('PetDetail', { petId: item.id || 0, petName: item.name || '' })}
    >
      <View style={styles.petInfo}>
        <View style={[
          styles.imagePlaceholder,
          { borderColor: item.petTheme || "#F3ECE5", borderWidth: 2 } // 프로필 이미지 주변에도 은은한 테마색 테두리 적용
        ]}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.petImage} />
          ) : (
            <Text style={[styles.imageText, { color: item.petTheme || "#8E7D7D" }]}>{(item.name || "").charAt(0)}</Text>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petBreed}>{item.breed || '품종 미지정'}</Text>
          {item.latestWeight ? (
            <Text style={styles.petWeight}>{item.latestWeight} kg</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={20} color={item.petTheme || "#A2A2A2"} />
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E07A5F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 프리미엄 상단 헤더 */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>나의 반려동물</Text>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => (item.id || 0).toString()}
        renderItem={renderPetItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E07A5F" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image 
              source={require('../../../assets/empty_pets.png')} 
              style={styles.emptyIllustration} 
              resizeMode="contain"
            />
            <Text style={styles.emptyTitle}>등록된 반려동물이 없습니다</Text>
            <Text style={styles.emptySubText}>첫 번째 우리 아이를 등록해서{"\n"}일기를 시작해 보세요!</Text>
            
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => navigation.navigate('AddPet')}
            >
              <Ionicons name="add" size={18} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.emptyButtonText}>우리 아이 등록하기</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddPet')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#1E1E1E" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 깔끔한 화이트 톤 배경
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 100, // 하단 내비바와 FAB 높이를 고려한 마진
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#C4A48A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FDFBF7',
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3ECE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  imageText: {
    fontSize: 20,
    color: '#8E7D7D',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3C2F2F',
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 14,
    color: '#8E7D7D',
    marginBottom: 2,
  },
  petWeight: {
    fontSize: 14,
    color: '#E07A5F',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyIllustration: {
    width: 260,
    height: 260,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E1E1E',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    color: '#8E7D7D',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: '#E07A2F', // 따뜻하고 선명한 오렌지색
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 14, // 둥근 라운드 처리
    shadowColor: '#E07A2F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 104 : 88, // 하단 내비게이션 바 바로 위에 예쁘게 띄우기
    width: 56,
    height: 56,
    borderRadius: 18, // 둥근 모서리 사각형 (시안의 FAB 재현)
    backgroundColor: '#FFE5D9', // 연한 살구색
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#C4A48A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
