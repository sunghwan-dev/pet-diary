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
import { medicalApi } from "../../api/medical";
import { commonStyles } from "../../styles/theme";
import { DetailHeader } from "../../components/DetailHeader";

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

export const MedicalRecordDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { record } = route.params;

  const typeInfo = MEDICAL_TYPES_CONFIG[record.type] || MEDICAL_TYPES_CONFIG.OTHER;

  const formatDateString = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  };

  const formatCost = (val?: number) => {
    if (val === undefined || val === null) return "정보 없음";
    return `${val.toLocaleString()} 원`;
  };

  const handleDelete = () => {
    Alert.alert(
      "기록 삭제",
      "이 진료 기록을 정말로 삭제하시겠습니까?\n삭제 후에는 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (record.type === "MEDICATION") {
                await medicalApi.deleteMedication(record.id);
              } else {
                await medicalApi.deleteMedicalLog(record.id);
              }
              Alert.alert("성공", "기록이 정상적으로 삭제되었습니다.", [
                { text: "확인", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Failed to delete medical record:", error);
              Alert.alert("실패", "삭제 도중 서버 오류가 발생했습니다.");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <DetailHeader
        title="진료 기록 상세"
        onBackPress={() => navigation.goBack()}
        rightButtons={[
          {
            name: "pencil",
            lib: "Ionicons",
            onPress: () => navigation.navigate("EditMedicalRecord", { record }),
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
        {/* 상단 간략 프로필 */}
        <View style={styles.profileRow}>
          <View style={[styles.avatarCircle, { backgroundColor: typeInfo.bg }]}>
            <Text style={styles.avatarEmoji}>{typeInfo.emoji}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.recordTitle}>{record.title}</Text>
            <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
          </View>
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
              <Text style={styles.detailValue}>{record.petName}</Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* 방문 날짜 */}
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="calendar" size={18} color="#E07A2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>방문 날짜</Text>
              <Text style={styles.detailValue}>{formatDateString(record.date)}</Text>
            </View>
          </View>

          {record.nextDueDate && (
            <>
              <View style={styles.separator} />
              {/* 다음 예정일 */}
              <View style={styles.detailRow}>
                <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
                  <Ionicons name="time" size={18} color="#E07A2F" />
                </View>
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>다음 예정일</Text>
                  <Text style={styles.detailValue}>{formatDateString(record.nextDueDate)}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* 두 번째 그룹 카드 (Reason/Diagnosis) */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="card" size={18} color="#E07A2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>원인 / 진단명</Text>
              <Text style={styles.detailValue}>{record.reason || "상세 사유 없음"}</Text>
            </View>
          </View>
        </View>

        {/* 비용 카드 (있을 경우만 표시) */}
        {record.cost !== undefined && record.cost !== null && record.cost > 0 && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
                <Ionicons name="cash" size={18} color="#E07A2F" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>진료비 / 약값</Text>
                <Text style={styles.detailValue}>{formatCost(record.cost)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* 세 번째 그룹 카드 (Notes) */}
        {record.notes && record.notes.trim() !== "" ? (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
                <Ionicons name="document-text" size={18} color="#E07A2F" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>상세 메모</Text>
                <Text style={styles.detailValue}>{record.notes}</Text>
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
