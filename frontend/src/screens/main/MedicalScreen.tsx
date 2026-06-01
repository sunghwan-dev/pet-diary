import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonStyles } from "../../styles/theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { medicalApi } from "../../api/medical";
import { PetResponse } from "../../types";

const MEDICAL_TYPES_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  VACCINE: { emoji: "💉", label: "Vaccine", color: "#E05A5A", bg: "#FFEBE0" },
  MEDICATION: { emoji: "💊", label: "Medication", color: "#FFA500", bg: "#FFF5E6" },
  TREATMENT: { emoji: "🏥", label: "Treatment", color: "#20B2AA", bg: "#E6F7F6" },
  SURGERY: { emoji: "🔪", label: "Surgery", color: "#E05A5A", bg: "#FFF0F0" },
  CHECKUP: { emoji: "🩺", label: "Check-up", color: "#9370DB", bg: "#F5F0FA" },
  EXAM: { emoji: "🔬", label: "Exam", color: "#4A9EE0", bg: "#EAF4FF" },
  ALLERGY: { emoji: "🤧", label: "Allergy", color: "#E07A2F", bg: "#FFF4EE" },
  CONDITION: { emoji: "📋", label: "Condition", color: "#4ABFA0", bg: "#E8FAF6" },
  OTHER: { emoji: "📝", label: "Other", color: "#7F7F7F", bg: "#F2F2F2" },
};

export const MedicalScreen = () => {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.userId);

  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 반려동물 목록 조회
  const fetchPetsAndRecords = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const petList = await petApi.getUserPets(userId);
      setPets(petList);
      
      if (petList.length > 0) {
        // 이미 선택된 동물이 있다면 유지하고 없으면 첫번째 선택
        const currentPet = selectedPet && petList.find(p => p.id === selectedPet.id) 
          ? selectedPet 
          : petList[0];
        
        setSelectedPet(currentPet);
        if (currentPet.id) {
          const recs = await medicalApi.getPetMedicalRecords(currentPet.id);
          setRecords(recs);
        }
      } else {
        setSelectedPet(null);
        setRecords([]);
      }
    } catch (error) {
      console.error("Failed to load medical records:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPet]);

  // 포커스 시 로드
  useFocusEffect(
    useCallback(() => {
      fetchPetsAndRecords();
    }, [fetchPetsAndRecords])
  );

  // 반려동물 탭 변경 시
  const handlePetChange = async (pet: PetResponse) => {
    setSelectedPet(pet);
    if (pet.id) {
      setLoading(true);
      try {
        const recs = await medicalApi.getPetMedicalRecords(pet.id);
        setRecords(recs);
      } catch (error) {
        console.error("Failed to change pet for medical records:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>건강 및 진료</Text>
      </View>

      {/* 반려동물 가로 필터 탭 */}
      {pets.length > 1 && (
        <View style={styles.petTabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.petTabScroll}>
            {pets.map((pet) => {
              const isSelected = selectedPet?.id === pet.id;
              const petColor = pet.petTheme || "#E07A2F";
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petTab,
                    isSelected && { backgroundColor: petColor + "15", borderColor: petColor },
                  ]}
                  onPress={() => handlePetChange(pet)}
                >
                  <Text style={[styles.petTabText, isSelected && { color: petColor, fontWeight: "700" }]}>
                    {pet.petType === "CAT" ? "🐈 " : "🐕 "}
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E07A5F" />
        </View>
      ) : records.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyCard}>
            <Ionicons name="medical-outline" size={64} color="#FFB593" style={styles.icon} />
            <Text style={styles.emptyTitle}>진료 및 예방접종 기록이 없습니다</Text>
            <Text style={styles.emptySubText}>우리 아이의 예방접종일과 병원 방문 일정을 꼼꼼하게 기록해 보세요.</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddMedicalRecord")}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>기록 추가하기</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {records.map((record) => {
              const typeInfo = MEDICAL_TYPES_CONFIG[record.type] || MEDICAL_TYPES_CONFIG.OTHER;
              return (
                <TouchableOpacity
                  key={record.id}
                  style={styles.recordCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("MedicalRecordDetail", { record })}
                >
                  <View style={[styles.typeIconContainer, { backgroundColor: typeInfo.bg }]}>
                    <Text style={styles.typeEmoji}>{typeInfo.emoji}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{record.title}</Text>
                    <Text style={styles.cardReason} numberOfLines={1}>
                      {record.reason || "상세 사유 없음"}
                    </Text>
                    <View style={styles.cardMetaRow}>
                      <Text style={styles.metaPetName}>🐾 {record.petName}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: typeInfo.bg }]}>
                        <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                          {typeInfo.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardDate}>
                      📅 {formatDateString(record.date)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fabButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddMedicalRecord")}
          >
            <Ionicons name="add" size={28} color="#3C2F2F" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  petTabContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE1",
    backgroundColor: "#fff",
  },
  petTabScroll: {
    paddingHorizontal: 20,
  },
  petTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    marginRight: 8,
    backgroundColor: "#F7F5F2",
  },
  petTabText: {
    fontSize: 14,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    width: "100%",
    shadowColor: "#C4A48A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5,
    marginBottom: 24,
  },
  icon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C2F2F",
    textAlign: "center",
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#A08E8E",
    textAlign: "center",
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: "#E07A5F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 50,
    shadowColor: "#E07A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  fabButton: {
    position: "absolute",
    right: 24,
    bottom: Platform.OS === "ios" ? 100 : 84, // 탭바 높이 위로 띄움
    backgroundColor: "#FFE5D9",
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#C4A48A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  recordCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#C4A48A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F5ECE1",
  },
  typeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  typeEmoji: {
    fontSize: 26,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
  },
  cardReason: {
    fontSize: 13,
    color: "#8E7D7D",
    marginTop: 2,
    fontWeight: "500",
  },
  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  metaPetName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E7D7D",
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardDate: {
    fontSize: 11,
    color: "#A2A2A2",
    fontWeight: "500",
    marginTop: 6,
  },
});
