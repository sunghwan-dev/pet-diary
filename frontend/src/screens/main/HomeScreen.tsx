import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuthStore } from '../../store/useAuthStore';
import { petApi } from '../../api/pet';
import { PetResponse } from '../../types';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

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
      style={styles.petCard}
      onPress={() => navigation.navigate('PetDetail', { petId: item.id, petName: item.name })}
    >
      <View style={styles.petInfo}>
        <View style={styles.imagePlaceholder}>
          {item.profileImageUrl ? (
            <Image source={{ uri: item.profileImageUrl }} style={styles.petImage} />
          ) : (
            <Text style={styles.imageText}>{item.name.charAt(0)}</Text>
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petBreed}>{item.breed || '품종 미지정'}</Text>
          {item.latestWeight && (
            <Text style={styles.petWeight}>{item.latestWeight} kg</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>우리 아이들</Text>
        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPetItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 반려동물이 없습니다.</Text>
            <Text style={styles.emptySubText}>첫 번째 아이를 등록해보세요!</Text>
          </View>
        }
      />

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('AddPet')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutText: {
    color: '#FF5A5F',
    fontSize: 14,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100,
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1E8EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  imageText: {
    fontSize: 24,
    color: '#7F8C8D',
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  petWeight: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#95A5A6',
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 36,
    color: '#fff',
    marginTop: -4,
  },
});
