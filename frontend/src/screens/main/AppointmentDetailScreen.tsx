import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { todoApi } from "../../api/todo";
import { PetResponse, TodoResponse } from "../../types";
import { commonStyles } from "../../styles/theme";
import { DetailHeader } from "../../components/DetailHeader";
import { cancelTodoNotification } from "../../utils/notification";

// 7종 일정 타입 정보 정의
const APPOINTMENT_TYPES = [
  { key: "VETERINARY", label: "진료", icon: "hospital-building", lib: "MaterialCommunityIcons", color: "#FF8A8A", bg: "#FFF0F0" },
  { key: "GROOMING", label: "미용", icon: "cut", lib: "Ionicons", color: "#FF5E7E", bg: "#FFF0F2" },
  { key: "CHECK_UP", label: "검진", icon: "stethoscope", lib: "MaterialCommunityIcons", color: "#20B2AA", bg: "#E6F7F6" },
  { key: "MEDICATION", label: "투약", icon: "pill", lib: "MaterialCommunityIcons", color: "#FFA500", bg: "#FFF5E6" },
  { key: "TRAINING", label: "훈련", icon: "school-outline", lib: "Ionicons", color: "#9370DB", bg: "#F5F0FA" },
  { key: "OTHER", label: "기타", icon: "calendar-outline", lib: "Ionicons", color: "#7F7F7F", bg: "#F2F2F2" },
];

export const AppointmentDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.userId);
  const { todoId } = route.params;

  const [todo, setTodo] = useState<TodoResponse | null>(null);
  const [pet, setPet] = useState<PetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. 단건 Todo 및 연관 펫 정보 탐색 로드
  const fetchDetailData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const petList = await petApi.getUserPets(userId);
      let foundTodo: TodoResponse | null = null;
      let foundPet: PetResponse | null = null;

      for (const p of petList) {
        if (p.id) {
          const petTodos = await todoApi.getPetTodos(p.id);
          const match = petTodos.find((t) => t.id === todoId);
          if (match) {
            foundTodo = match;
            foundPet = p;
            break;
          }
        }
      }

      if (foundTodo && foundPet) {
        setTodo(foundTodo);
        setPet(foundPet);
      } else {
        Alert.alert("오류", "일정 정보를 찾을 수 없습니다.");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to load appointment detail:", error);
      Alert.alert("오류", "일정 상세 정보를 불러오는 도중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailData();
  }, [todoId, userId]);

  // 포커스 시 화면 자동 갱신 (수정하고 돌아왔을 때 대비)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchDetailData();
    });
    return unsubscribe;
  }, [navigation, todoId, userId]);

  // 2. 일정 삭제 핸들러
  const handleDelete = () => {
    Alert.alert(
      "일정 삭제",
      "이 일정을 정말 삭제하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (todo?.id) {
                await cancelTodoNotification(todo.id);
                await todoApi.deleteTodo(todo.id);
                Alert.alert("성공", "일정이 삭제되었습니다.", [
                  { text: "확인", onPress: () => navigation.goBack() },
                ]);
              }
            } catch (error) {
              console.error("Failed to delete todo:", error);
              Alert.alert("오류", "일정을 삭제하지 못했습니다.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const formatAlarmOffset = (useAlarm: boolean, offset: number) => {
    if (!useAlarm || offset <= 0) return "비활성화됨";
    if (offset === 1440) return "1일 전";
    if (offset === 60) return "1시간 전";
    return `${offset}분 전`;
  };

  // 타이틀 정밀 파싱 헬퍼
  const parseTodoTitle = (rawTitle: string) => {
    let title = rawTitle || "";
    let typeLabel = "일정";
    let typeKey = "OTHER";
    let notes = "";
    let useAlarm = false;
    let alarmOffset = 0;

    // 알림 태그 제거 및 데이터화
    const alarmMatch = title.match(/\[알림:O:(\d+)\]/);
    if (alarmMatch) {
      useAlarm = true;
      alarmOffset = parseInt(alarmMatch[1], 10);
      title = title.replace(` [알림:O:${alarmMatch[1]}]`, "").replace(`[알림:O:${alarmMatch[1]}]`, "").trim();
    }

    const typeMatch = title.match(/\[(.*?)\]/);
    if (typeMatch) {
      typeLabel = typeMatch[1];
      const typeObj = APPOINTMENT_TYPES.find((t) => t.label === typeLabel);
      if (typeObj) {
        typeKey = typeObj.key;
      }
      title = title.replace(` [${typeLabel}]`, "");
    }

    const notesMatch = title.match(/\((.*?)\)$/);
    if (notesMatch) {
      notes = notesMatch[1];
      title = title.replace(` (${notes})`, "");
    }

    return { title, typeLabel, typeKey, notes, useAlarm, alarmOffset };
  };

  // 시간 포맷
  const formatTargetTime = (targetTime: any) => {
    if (!targetTime) return "시간 미정";
    if (typeof targetTime === "string") {
      const parts = targetTime.split(":");
      if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
      return targetTime;
    }
    if (typeof targetTime === "object") {
      const h = targetTime.hour !== undefined ? targetTime.hour : 0;
      const m = targetTime.minute !== undefined ? targetTime.minute : 0;
      return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}`;
    }
    return "시간 미정";
  };

  // 날짜 포맷팅 (D/M/YYYY 포맷 지원)
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-"); // YYYY-MM-DD
    if (parts.length === 3) {
      const year = parts[0];
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07A2F" />
      </View>
    );
  }

  if (!todo || !pet) {
    return null;
  }

  const { title, typeLabel, typeKey, notes, useAlarm, alarmOffset } = parseTodoTitle(todo.title || "");
  const typeConfig = APPOINTMENT_TYPES.find((t) => t.key === typeKey) || APPOINTMENT_TYPES[6];

  const isRoutine = todo.frequency && todo.frequency !== "NONE";

  return (
    <View style={styles.container}>
      <DetailHeader
        title={isRoutine ? "루틴 상세 정보" : "일정 상세 정보"}
        onBackPress={() => navigation.goBack()}
        rightButtons={[
          {
            name: 'pencil',
            lib: 'Ionicons',
            onPress: () => isRoutine
              ? navigation.navigate('EditRoutine', { todoId: todo.id })
              : navigation.navigate('EditAppointment', { todoId: todo.id }),
          },
          { name: 'trash-outline', lib: 'Ionicons', onPress: handleDelete, color: '#FF5A5F' },
        ]}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. 대형 일정 종류 원형 뱃지 및 타이틀 */}
        <View style={styles.badgeSection}>
          <View style={[styles.largeIconBg, { backgroundColor: typeConfig.bg }]}>
            {typeConfig.lib === "MaterialCommunityIcons" ? (
              <MaterialCommunityIcons name={typeConfig.icon as any} size={44} color={typeConfig.color} />
            ) : (
              <Ionicons name={typeConfig.icon as any} size={44} color={typeConfig.color} />
            )}
          </View>
          <Text style={styles.todoMainTitle}>{title}</Text>
          <Text style={styles.todoTypeSubText}>{typeLabel}</Text>
        </View>

        {/* 3. 카드 섹션 1 (상세 정보 내역) */}
        <View style={styles.detailCard}>
          {/* Pet 행 */}
          <View style={styles.detailRow}>
            <Ionicons name="paw" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Pet</Text>
              <Text style={styles.detailValue}>{pet.name}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Date 행 */}
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDueDate(todo.dueDate)}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Time 행 */}
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{formatTargetTime(todo.targetTime)}</Text>
            </View>
          </View>
          <View style={styles.divider} />

          {/* Duration 행 */}
          <View style={styles.detailRow}>
            <Ionicons name="timer-outline" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>30분</Text>
            </View>
          </View>
        </View>

        {/* 4. 카드 섹션 2 (특이사항 및 메모) */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="reader-outline" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{notes || "메모 없음"}</Text>
            </View>
          </View>
        </View>

        {/* 5. 카드 섹션 3 (알림 상태) */}
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Ionicons name="notifications-outline" size={20} color="#E07A5F" style={styles.detailIcon} />
            <View style={styles.detailInfo}>
              <Text style={styles.detailLabel}>Reminder</Text>
              <Text style={styles.detailValue}>{formatAlarmOffset(useAlarm, alarmOffset)}</Text>
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingTop: Platform.OS === "ios" ? 38 : 0,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5F2",
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E1E1E",
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIconButton: {
    padding: 8,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  badgeSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  largeIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#CBC0B5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  todoMainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 6,
    textAlign: "center",
  },
  todoTypeSubText: {
    fontSize: 14,
    color: "#8E7D7D",
    fontWeight: "bold",
  },
  detailCard: {
    backgroundColor: "#F7F5F2", // 시안 고유의 연베이지 둥근 카드 배경
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 16,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8E7D7D",
    fontWeight: "600",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2D9D0",
    marginVertical: 14,
    marginLeft: 36, // 아이콘 우측 정렬 유지용
  },
});
