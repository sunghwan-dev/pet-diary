import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { expenseApi } from "../../api/expense";
import { medicalApi } from "../../api/medical";
import { commonStyles } from "../../styles/theme";
import { DetailHeader } from "../../components/DetailHeader";

const CATEGORY_CONFIG: Record<string, { emoji: string; label: string; color: string; bg: string }> = {
  FOOD: { emoji: "🍖", label: "사료/간식", color: "#E07A2F", bg: "#FFF4EE" },
  TOY: { emoji: "🧸", label: "장난감/용품", color: "#4ABFA0", bg: "#E8FAF6" },
  MEDICAL: { emoji: "🏥", label: "의료/병원", color: "#E05A5A", bg: "#FFF0F0" },
  GROOMING: { emoji: "✂️", label: "미용/목욕", color: "#9370DB", bg: "#F5F0FA" },
  OTHER: { emoji: "💵", label: "기타", color: "#7F7F7F", bg: "#F2F2F2" },
};

export const ExpenseDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { expense } = route.params;

  const catInfo = CATEGORY_CONFIG[expense.category] || CATEGORY_CONFIG.OTHER;

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const handleDelete = () => {
    Alert.alert(
      "지출 기록 삭제",
      "이 지출 기록을 정말로 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              await expenseApi.deleteExpense(expense.id);
              Alert.alert("성공", "지출 내역이 정상적으로 삭제되었습니다.", [
                {
                  text: "확인",
                  onPress: () => {
                    navigation.navigate("Home", { screen: "ExpensesTab" });
                  },
                },
              ]);
            } catch (error) {
              console.error("Failed to delete expense:", error);
              Alert.alert("실패", "지출 내역 삭제 도중 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  const getNotes = () => {
    if (!expense.memo) return "정보 없음";
    if (expense.memo.includes(" - ")) {
      const parts = expense.memo.split(" - ", 2);
      return parts[1];
    }
    return "";
  };

  const getCleanTitle = () => {
    if (!expense.memo) return "지출 내역";
    if (expense.memo.includes(" - ")) {
      const parts = expense.memo.split(" - ", 2);
      return parts[0];
    }
    return expense.memo;
  };

  const handleEditPress = async () => {
    if (expense.category === "MEDICAL" && expense.medicalLogId) {
      try {
        const records = await medicalApi.getPetMedicalRecords(expense.petId);
        const matchedRecord = records.find((r) => r.id === expense.medicalLogId);
        if (matchedRecord) {
          navigation.navigate("EditMedicalRecord", { record: matchedRecord });
          return;
        }
      } catch (error) {
        console.error("Failed to fetch medical record for editing:", error);
      }
    }
    // 기본적으로 지출 수정 화면으로 이동
    navigation.navigate("EditExpense", { expense });
  };

  return (
    <View style={styles.container}>
      <DetailHeader
        title="지출 상세 정보"
        onBackPress={() => navigation.goBack()}
        rightButtons={[
          {
            name: "pencil-outline",
            lib: "MaterialCommunityIcons",
            onPress: handleEditPress,
            color: "#E07A5F",
          },
          {
            name: "trash-can-outline",
            lib: "MaterialCommunityIcons",
            onPress: handleDelete,
            color: "#FF5A5F",
          },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 상단 간략 요약 */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: catInfo.bg }]}>
            <Text style={styles.avatarEmoji}>{catInfo.emoji}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.recordTitle}>{getCleanTitle()}</Text>
            <Text style={[styles.typeText, { color: catInfo.color }]}>{catInfo.label}</Text>
          </View>
        </View>

        {/* 금액 하이라이트 */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>지출 금액</Text>
          <Text style={styles.amountValue}>{expense.amount?.toLocaleString()} 원</Text>
        </View>

        {/* 첫 번째 그룹 카드 (Pet / Date) */}
        <View style={styles.detailsCard}>
          {/* 반려동물 */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="paw" size={18} color="#E07A2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>반려동물</Text>
              <Text style={styles.detailValue}>{expense.petName}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* 결제일 */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="calendar" size={18} color="#E07A2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>결제 날짜</Text>
              <Text style={styles.detailValue}>{formatDateString(expense.expenseDate)}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* 카테고리 */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="grid" size={18} color="#E07A2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>카테고리</Text>
              <Text style={styles.detailValue}>{catInfo.label}</Text>
            </View>
          </View>
        </View>

        {/* 세 번째 그룹 카드 (Notes) */}
        {getNotes() ? (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
                <Ionicons name="document-text" size={18} color="#E07A2F" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>상세 메모</Text>
                <Text style={styles.detailValue}>{getNotes()}</Text>
              </View>
            </View>
          </View>
        ) : null}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBF7",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileText: {
    flex: 1,
  },
  recordTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3C2F2F",
  },
  typeText: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  amountCard: {
    backgroundColor: "#FFEBE0",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFB593",
  },
  amountLabel: {
    fontSize: 12,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  amountValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#3C2F2F",
    marginTop: 6,
  },
  detailsCard: {
    backgroundColor: "#FAF6F0",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EAE6DF",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "700",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#EAE6DF",
    marginVertical: 14,
  },
});
