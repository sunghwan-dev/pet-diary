import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { todoApi } from "../../api/todo";
import { petApi } from "../../api/pet";
import { useAuthStore } from "../../store/useAuthStore";
import { commonStyles } from "../../styles/theme";
import { cancelTodoNotification } from "../../utils/notification";

// ── 루틴 타입 목록 (아이콘/이모지 매핑) ─────────────────────────────────────
const ROUTINE_TYPES = [
  { key: "BATH", label: "목욕", emoji: "🛁", color: "#4A9EE0", bg: "#EAF4FF" },
  { key: "EAR_CLEANING", label: "귀 청소", emoji: "👂", color: "#E07A2F", bg: "#FFF4EE" },
  { key: "TEETH_CLEANING", label: "양치질", emoji: "🦷", color: "#4ABFA0", bg: "#E8FAF6" },
  { key: "BRUSHING", label: "빗질", emoji: "🪮", color: "#9370DB", bg: "#F5F0FA" },
  { key: "NAIL_TRIMMING", label: "발톱 정리", emoji: "✂️", color: "#E05A5A", bg: "#FFF0F0" },
  { key: "CUSTOM", label: "직접 입력", emoji: "✏️", color: "#8E7D7D", bg: "#F7F5F2" },
];

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "매일",
  WEEKLY: "매주",
  MONTHLY: "매월",
  YEARLY: "매년",
  NONE: "반복 없음",
};

const formatAlarmOffset = (useAlarm: boolean, offset: number) => {
  if (!useAlarm || offset <= 0) return "비활성화됨";
  if (offset === 1440) return "1일 전";
  if (offset === 60) return "1시간 전";
  return `${offset}분 전`;
};

// ── 루틴 타이틀 파싱 헬퍼 ───────────────────────────────────────────────────
const parseRoutineTitle = (rawTitle: string) => {
  let title = rawTitle || "";
  let typeKey = "CUSTOM";
  let days: string[] = [];
  let useAlarm = false;
  let alarmOffset = 0;
  let showInCalendar = false;

  // [알림:O:분] 파싱
  const alarmMatch = title.match(/\[알림:O:(\d+)\]/);
  if (alarmMatch) {
    useAlarm = true;
    alarmOffset = parseInt(alarmMatch[1], 10);
    title = title.replace(` [알림:O:${alarmMatch[1]}]`, "").replace(`[알림:O:${alarmMatch[1]}]`, "").trim();
  }

  // [캘린더] 파싱
  if (title.includes("[캘린더]")) {
    showInCalendar = true;
    title = title.replace(" [캘린더]", "").replace("[캘린더]", "").trim();
  }

  // [루틴:월,화,수] 형식 파싱 (한글 요일 키)
  const tagMatch = title.match(/\[루틴(?::([^\]]+))?\]/);
  if (tagMatch) {
    if (tagMatch[1]) {
      days = tagMatch[1].split(",").filter(Boolean);
    }
    title = title.replace(tagMatch[0], "").trim();
  } else {
    const typeMatch = title.match(/\[(.*?)\]/);
    if (typeMatch) {
      const label = typeMatch[1];
      const found = ROUTINE_TYPES.find((t) => t.label === label);
      if (found) typeKey = found.key;
      title = title.replace(`[${label}]`, "").replace(` [${label}]`, "").trim();
    }
  }

  // 제목에서 루틴 유형 역매핑
  if (typeKey === "CUSTOM") {
    const matched = ROUTINE_TYPES.find((t) => t.label !== "직접 입력" && title.startsWith(t.label));
    if (matched) {
      typeKey = matched.key;
      title = title.replace(matched.label, "").trim();
    }
  }

  const notesMatch = title.match(/\((.*?)\)$/);
  let notes = "";
  if (notesMatch) {
    notes = notesMatch[1];
    title = title.replace(` (${notes})`, "").replace(`(${notes})`, "").trim();
  }

  return { title: title.trim(), typeKey, notes, days, useAlarm, alarmOffset, showInCalendar };
};

// ── 날짜 포맷 ────────────────────────────────────────────────────────────────
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

// ── 시간 포맷 ────────────────────────────────────────────────────────────────
const formatTargetTime = (targetTime: any) => {
  if (!targetTime) return "설정 안 함";
  if (typeof targetTime === "string") {
    const parts = targetTime.split(":");
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const ampm = hours >= 12 ? "오후" : "오전";
      const h = hours % 12 || 12;
      const m = minutes < 10 ? `0${minutes}` : minutes;
      return `${ampm} ${h}:${m}`;
    }
    return targetTime;
  }
  if (typeof targetTime === "object") {
    const h = targetTime.hour !== undefined ? targetTime.hour : 0;
    const m = targetTime.minute !== undefined ? targetTime.minute : 0;
    const ampm = h >= 12 ? "오후" : "오전";
    const hr = h % 12 || 12;
    const min = m < 10 ? `0${m}` : m;
    return `${ampm} ${hr}:${min}`;
  }
  return "설정 안 함";
};

export const RoutineDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId = useAuthStore((state) => state.userId);
  const { todoId } = route.params;

  const [routine, setRoutine] = useState<any>(null);
  const [petName, setPetName] = useState("-");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const todo = await todoApi.getTodo(todoId);
        setRoutine(todo);

        // 펫 이름 찾기
        const petList = await petApi.getUserPets(userId);
        for (const pet of petList) {
          if (pet.id) {
            const petTodos = await todoApi.getPetTodos(pet.id);
            if (petTodos.find((t) => t.id === todoId)) {
              setPetName(pet.name ?? "-");
              break;
            }
          }
        }
      } catch (e) {
        console.error("Failed to load routine:", e);
        Alert.alert("오류", "루틴 정보를 불러오지 못했습니다.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [todoId, userId]);

  const handleDelete = () => {
    Alert.alert("루틴 삭제", "이 루틴을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelTodoNotification(todoId);
            await todoApi.deleteTodo(todoId);
            navigation.goBack();
          } catch {
            Alert.alert("오류", "루틴을 삭제하지 못했습니다.");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07A2F" />
      </View>
    );
  }

  if (!routine) return null;

  const { title, typeKey, notes, days, useAlarm, alarmOffset, showInCalendar } = parseRoutineTitle(routine.title || "");
  const typeConfig =
    ROUTINE_TYPES.find((t) => t.key === typeKey) ?? ROUTINE_TYPES[ROUTINE_TYPES.length - 1];
  const freqLabel = FREQUENCY_LABEL[routine.frequency] ?? routine.frequency ?? "-";

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>루틴 상세</Text>
        </View>
        <View style={commonStyles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate("EditRoutine", { todoId })}
            style={commonStyles.backButton}
          >
            <Ionicons name="pencil" size={20} color="#1E1E1E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={commonStyles.backButton}>
            <Ionicons name="trash-outline" size={20} color="#1E1E1E" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 루틴 아이콘 + 제목 영역 ── */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIconBox, { backgroundColor: typeConfig.bg }]}>
            <Text style={styles.heroEmoji}>{typeConfig.emoji}</Text>
          </View>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{typeConfig.label}</Text>
          </View>
        </View>

        {/* ── 기본 정보 카드 ── */}
        <View style={styles.infoCard}>
          {/* 반려동물 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="paw" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>반려동물</Text>
              <Text style={styles.infoValue}>{petName}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 반복 빈도 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="repeat" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>반복 빈도</Text>
              <Text style={styles.infoValue}>
                {freqLabel}
                {days.length > 0
                  ? ` (${days.join(", ")})`
                  : ""}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 시작일 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar-outline" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>시작 날짜</Text>
              <Text style={styles.infoValue}>{formatDate(routine.dueDate)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 설정 시간 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="time-outline" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>설정 시간</Text>
              <Text style={styles.infoValue}>{formatTargetTime(routine.targetTime)}</Text>
            </View>
          </View>

          {/* 메모 (있을 때만) */}
          {notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconWrap}>
                  <Ionicons name="reader-outline" size={18} color="#E07A2F" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>메모</Text>
                  <Text style={styles.infoValue}>{notes}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* ── 알림/캘린더 설정 카드 ── */}
        <View style={styles.infoCard}>
          {/* 알림 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="notifications" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>알림</Text>
              <Text style={styles.infoValue}>
                {formatAlarmOffset(useAlarm, alarmOffset)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* 캘린더 표시 */}
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="calendar" size={18} color="#E07A2F" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>캘린더 표시</Text>
              <Text style={styles.infoValue}>
                {showInCalendar ? "활성화됨" : "비활성화됨"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  // 히어로 섹션
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  heroIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTextCol: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  // 정보 카드
  infoCard: {
    backgroundColor: "#F7F5F2",
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF4EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#8E7D7D",
    fontWeight: "600",
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 15,
    color: "#3C2F2F",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EDE8E3",
    marginLeft: 50,
  },
});
