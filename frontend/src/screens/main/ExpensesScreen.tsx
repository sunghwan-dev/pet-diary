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
import { expenseApi } from "../../api/expense";
import { PetResponse } from "../../types";

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  FOOD: { emoji: "🍖", label: "사료/간식", color: "#E07A2F", bg: "#FFF4EE" },
  TOY: { emoji: "🧸", label: "장난감/용품", color: "#4ABFA0", bg: "#E8FAF6" },
  MEDICAL: { emoji: "🏥", label: "의료/병원", color: "#E05A5A", bg: "#FFF0F0" },
  GROOMING: { emoji: "✂️", label: "미용/목욕", color: "#9370DB", bg: "#F5F0FA" },
  OTHER: { emoji: "💵", label: "기타", color: "#7F7F7F", bg: "#F2F2F2" },
};

export const ExpensesScreen = () => {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.userId);

  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 반려동물 목록 및 지출내역 조회
  const fetchPetsAndExpenses = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const petList = await petApi.getUserPets(userId);
      setPets(petList);

      if (petList.length > 0) {
        const currentPet = selectedPet && petList.find(p => p.id === selectedPet.id)
          ? selectedPet
          : petList[0];

        setSelectedPet(currentPet);
        if (currentPet.id) {
          const exps = await expenseApi.getPetExpenses(currentPet.id);
          setExpenses(exps);
        }
      } else {
        setSelectedPet(null);
        setExpenses([]);
      }
    } catch (error) {
      console.error("Failed to load pet expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [userId, selectedPet]);

  useFocusEffect(
    useCallback(() => {
      fetchPetsAndExpenses();
    }, [fetchPetsAndExpenses])
  );

  const handlePetChange = async (pet: PetResponse) => {
    setSelectedPet(pet);
    if (pet.id) {
      setLoading(true);
      try {
        const exps = await expenseApi.getPetExpenses(pet.id);
        setExpenses(exps);
      } catch (error) {
        console.error("Failed to load expenses for pet:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert(
      "지출 내역 삭제",
      "이 지출 기록을 정말로 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(id);
              fetchPetsAndExpenses();
            } catch (error) {
              console.error("Failed to delete expense:", error);
              Alert.alert("실패", "지출 내역 삭제 도중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const getTotalAmount = () => {
    return expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>소비 지출</Text>
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
      ) : expenses.length === 0 ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.emptyCard}>
            <Ionicons name="wallet-outline" size={64} color="#FFB593" style={styles.icon} />
            <Text style={styles.emptyTitle}>기록된 지출 내역이 없습니다</Text>
            <Text style={styles.emptySubText}>
              사료, 장난감, 병원비 등 우리 아이들을 위해 쓴 비용을 체계적으로 관리해 보세요.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddExpense")}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>지출 기록 추가</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* 총 지출 대시보드 카드 */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>총 지출 금액 (Total Expenses)</Text>
            <Text style={styles.totalValue}>{getTotalAmount().toLocaleString()} 원</Text>
          </View>

          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {expenses.map((expense) => {
              const catInfo = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;
              return (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseCard}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("ExpenseDetail", { expense })}
                >
                  <View style={[styles.categoryIconCircle, { backgroundColor: catInfo.bg }]}>
                    <Text style={styles.categoryEmoji}>{catInfo.emoji}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardMemo}>{expense.memo || "지출 내역"}</Text>
                    <Text style={styles.cardPetName}>🐾 {expense.petName}</Text>
                    <Text style={styles.cardDate}>
                      📅 {formatDateString(expense.expenseDate)}
                    </Text>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.cardAmount}>{expense.amount?.toLocaleString()} 원</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fabButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("AddExpense")}
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
    paddingTop: 12,
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
  totalCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  totalValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#E07A5F",
    marginTop: 6,
  },
  expenseCard: {
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
  categoryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
  },
  cardMemo: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
  },
  cardPetName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E7D7D",
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    color: "#A2A2A2",
    fontWeight: "500",
    marginTop: 4,
  },
  cardRight: {
    alignItems: "flex-end",
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#E05A5A",
  },
  deleteButton: {
    padding: 6,
    marginTop: 4,
  },
  fabButton: {
    position: "absolute",
    right: 24,
    bottom: Platform.OS === "ios" ? 100 : 84,
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
});
