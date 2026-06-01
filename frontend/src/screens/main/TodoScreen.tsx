import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { commonStyles } from "../../styles/theme";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { todoApi } from "../../api/todo";
import { PetResponse, TodoResponse } from "../../types";
import { cancelTodoNotification } from "../../utils/notification";

type TabType = "CALENDAR" | "ROUTINES";

interface CalendarDay {
  day: number;
  isCurrentMonth: boolean;
  date: Date;
}

const APPOINTMENT_TYPES = [
  { key: "VETERINARY", label: "진료", icon: "hospital-building", lib: "MaterialCommunityIcons", color: "#FF8A8A", bg: "#FFF0F0" },
  { key: "GROOMING", label: "미용", icon: "cut", lib: "Ionicons", color: "#FF5E7E", bg: "#FFF0F2" },
  { key: "CHECK_UP", label: "검진", icon: "stethoscope", lib: "MaterialCommunityIcons", color: "#20B2AA", bg: "#E6F7F6" },
  { key: "MEDICATION", label: "투약", icon: "pill", lib: "MaterialCommunityIcons", color: "#FFA500", bg: "#FFF5E6" },
  { key: "TRAINING", label: "훈련", icon: "school-outline", lib: "Ionicons", color: "#9370DB", bg: "#F5F0FA" },
  { key: "OTHER", label: "기타", icon: "calendar-outline", lib: "Ionicons", color: "#7F7F7F", bg: "#F2F2F2" },
];

const ROUTINE_TYPE_CONFIG = [
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

const parseRoutineTitle = (rawTitle: string) => {
  let title = rawTitle || "";
  let typeKey = "CUSTOM";

  // 알림 태그 제거
  const alarmMatch = title.match(/\[알림:O:\d+\]/);
  if (alarmMatch) {
    title = title.replace(` ${alarmMatch[0]}`, "").replace(alarmMatch[0], "").trim();
  }

  // 캘린더 태그 제거
  if (title.includes("[캘린더]")) {
    title = title.replace(" [캘린더]", "").replace("[캘린더]", "").trim();
  }

  // 루틴 태그 제거
  const tagMatch = title.match(/\[루틴(?::([^\]]+))?\]/);
  if (tagMatch) {
    title = title.replace(tagMatch[0], "").trim();
  }

  const typeMatch = title.match(/\[(.*?)\]/);
  if (typeMatch) {
    const label = typeMatch[1];
    const found = ROUTINE_TYPE_CONFIG.find((t) => t.label === label);
    if (found) typeKey = found.key;
    title = title.replace(`[${label}]`, "").replace(` [${label}]`, "");
  }
  const notesMatch = title.match(/\((.*?)\)$/);
  let notes = "";
  if (notesMatch) {
    notes = notesMatch[1];
    title = title.replace(` (${notes})`, "").replace(`(${notes})`, "");
  }
  return { title: title.trim(), typeKey, notes };
};

export const TodoScreen = () => {
  const navigation = useNavigation<any>();
  const userId = useAuthStore((state) => state.userId);

  const [activeTab, setActiveTab] = useState<TabType>("CALENDAR");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // 모달 제어 상태
  const [showBottomSheet, setShowBottomSheet] = useState(false); // FAB 바텀 시트
  const [showTodoModal, setShowTodoModal] = useState(false);     // 날짜 클릭 일정 목록 바텀 시트

  // 데이터 상태
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. 데이터 로드 및 병합 헬퍼
  const fetchAllData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const petList = await petApi.getUserPets(userId);
      setPets(petList);

      const allTodos: any[] = [];
      await Promise.all(
        petList.map(async (pet) => {
          if (pet.id) {
            const petTodos = await todoApi.getPetTodos(pet.id);
            const mapped = petTodos.map((todo) => ({
              ...todo,
              petId: pet.id,
              petName: pet.name,
              petTheme: pet.petTheme || "#E07A2F",
              petType: pet.petType,
            }));
            allTodos.push(...mapped);
          }
        })
      );
      setTodos(allTodos);
    } catch (error) {
      console.error("Failed to load todos on main screen:", error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 화면 진입/포커스 시 실시간 리프레시 연동
  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  // 캘린더 월 변경 연산
  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  // 월간 달력 날짜 목록 연산 함수
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();

    const daysList: CalendarDay[] = [];

    // 1. 이전 달 잔여일
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysList.push({
        day: prevLastDate - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevLastDate - i),
      });
    }

    // 2. 이번 달
    for (let i = 1; i <= lastDate; i++) {
      daysList.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i),
      });
    }

    // 3. 다음 달 (42칸 기준 6주)
    const remainingCells = 42 - daysList.length;
    for (let i = 1; i <= remainingCells; i++) {
      daysList.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
      });
    }

    return daysList;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const isSameDay = (dateA: Date, dateB: Date) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const formatDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return `${y}-${m < 10 ? `0${m}` : m}-${day < 10 ? `0${day}` : day}`;
  };

  const isTodoVisibleInCalendar = (t: any) => {
    if (t.frequency && t.frequency !== "NONE") {
      return t.title && t.title.includes("[캘린더]");
    }
    return true;
  };

  // 날짜별 테마 도트 추출
  const getDotsForDate = (date: Date) => {
    const dateStr = formatDateString(date);
    const dateTodos = todos.filter((t) => t.dueDate === dateStr && isTodoVisibleInCalendar(t));
    
    // 중복 제거된 고유 펫 테마 색상 리스트
    const uniqueThemes = Array.from(
      new Set(dateTodos.map((t) => t.petTheme).filter(Boolean))
    );
    return uniqueThemes;
  };

  // 날짜 선택 시 처리
  const handleDateSelect = (dayObj: CalendarDay) => {
    setSelectedDate(dayObj.date);
    if (!dayObj.isCurrentMonth) {
      setCurrentDate(new Date(dayObj.date.getFullYear(), dayObj.date.getMonth(), 1));
    }
    // 날짜 클릭 시 시안 2에 명시된 일정 목록 바텀 시트를 띄움
    setShowTodoModal(true);
  };

  // 타이틀 정밀 파싱 헬퍼 (대괄호 타입, 소괄호 메모 분리 복원)
  const parseTodoTitle = (rawTitle: string) => {
    let title = rawTitle || "";
    let typeLabel = "일정";
    let typeKey = "OTHER";
    let notes = "";

    // 알림 태그 제거
    const alarmMatch = title.match(/\[알림:O:\d+\]/);
    if (alarmMatch) {
      title = title.replace(` ${alarmMatch[0]}`, "").replace(alarmMatch[0], "").trim();
    }

    if (title.includes("[캘린더]")) {
      title = title.replace(" [캘린더]", "").replace("[캘린더]", "").trim();
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

    // 혹시라도 대괄호나 소괄호가 더 남아있는 경우 정리
    if (title.includes("[루틴")) {
      title = title.replace(/\[루틴.*?\]/, "").trim();
    }

    return { title: title.trim(), typeLabel, typeKey, notes };
  };

  // 시간 포맷 가드
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

  // 2. 일정 완료 여부 토글 API 호출
  const handleToggleTodo = async (todoId: number) => {
    try {
      await todoApi.toggleTodo(todoId);

      const targetTodo = todos.find((t) => t.id === todoId);
      if (targetTodo && !targetTodo.isCompleted) {
        await cancelTodoNotification(todoId);
      }

      // 로컬 상태 동기 업데이트
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId ? { ...t, isCompleted: !t.isCompleted } : t
        )
      );
    } catch (error) {
      console.error("Failed to toggle todo status:", error);
      Alert.alert("실패", "일정 상태를 변경하지 못했습니다.");
    }
  };

  // 선택된 날짜에 대응하는 일정 필터링
  const selectedDateStr = formatDateString(selectedDate);
  const selectedDateTodos = todos.filter((t) => t.dueDate === selectedDateStr && isTodoVisibleInCalendar(t));

  return (
    <View style={styles.container}>
      {/* 1. 프리미엄 상단 공통 헤더 */}
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>할 일 관리</Text>
      </View>

      {/* 2. 주황색 포인트 탭 바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("CALENDAR")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "CALENDAR" && styles.tabTextActive,
            ]}
          >
            달력
          </Text>
          {activeTab === "CALENDAR" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabButton}
          onPress={() => setActiveTab("ROUTINES")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "ROUTINES" && styles.tabTextActive,
            ]}
          >
            루틴
          </Text>
          {activeTab === "ROUTINES" && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* 3. 탭별 메인 콘텐츠 */}
      {activeTab === "CALENDAR" ? (
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.calendarContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 달력 컨트롤 헤더 (이전달/다음달 화살표) */}
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back-outline" size={20} color="#1E1E1E" />
            </TouchableOpacity>
            
            <Text style={styles.monthTitle}>
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </Text>
            
            <TouchableOpacity onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward-outline" size={20} color="#1E1E1E" />
            </TouchableOpacity>
          </View>

          {/* 캘린더 요일 정렬 */}
          <View style={styles.weekRow}>
            {weekDays.map((w, index) => (
              <Text
                key={w}
                style={[
                  styles.weekText,
                  index === 0 && styles.sundayText,
                  index === 6 && styles.saturdayText,
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* 캘린더 월간 그리드 일자 렌더링 */}
          {loading && todos.length === 0 ? (
            <ActivityIndicator color="#E07A2F" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.gridContainer}>
              {calendarDays.map((dayObj, index) => {
                const isSelected = isSameDay(dayObj.date, selectedDate);
                const isToday = isSameDay(dayObj.date, new Date());
                const isSunday = index % 7 === 0;
                const isSaturday = index % 7 === 6;
                
                // 날짜별 등록 펫 도트 테마 컬러 배열
                const dots = getDotsForDate(dayObj.date);

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.gridCell}
                    onPress={() => handleDateSelect(dayObj)}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isSelected && styles.dayCircleSelected,
                        !isSelected && isToday && styles.dayCircleToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !dayObj.isCurrentMonth && styles.dayTextInactive,
                          isSelected && styles.dayTextSelected,
                          !isSelected && isToday && styles.dayTextToday,
                          !isSelected && dayObj.isCurrentMonth && isSunday && styles.sundayText,
                          !isSelected && dayObj.isCurrentMonth && isSaturday && styles.saturdayText,
                        ]}
                      >
                        {dayObj.day}
                      </Text>
                    </View>

                    {/* 펫 테마 색상 둥근 도트 마커 렌더링 (시안 1) */}
                    <View style={styles.dotsRow}>
                      {dots.slice(0, 3).map((color, dotIdx) => (
                        <View
                          key={dotIdx}
                          style={[
                            styles.dot,
                            { backgroundColor: color },
                            isSelected && { borderColor: "#FFFFFF" }
                          ]}
                        />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : (
        /* 루틴 탭 - 등록된 루틴 목록 */
        (() => {
          const routines = todos.filter((t) => t.frequency && t.frequency !== "NONE");
          if (routines.length === 0) {
            return (
              <ScrollView
                contentContainerStyle={styles.routineEmptyContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.emptyCard}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="repeat-outline" size={56} color="#E07A5F" />
                  </View>
                  <Text style={styles.emptyTitle}>아직 등록된 루틴이 없습니다</Text>
                  <Text style={styles.emptySubText}>
                    목욕, 빗질, 귀 청소와 같이{"\n"} 주기적인 돌봄 루틴을 만들어{"\n"}우리
                    아이들의 건강을 꼼꼼하게 지켜주세요!
                  </Text>
                </View>
              </ScrollView>
            );
          }
          return (
            <ScrollView
              contentContainerStyle={styles.routineListContainer}
              showsVerticalScrollIndicator={false}
            >
              {routines.map((routine) => {
                const { title, typeKey } = parseRoutineTitle(routine.title || "");
                const typeConfig =
                  ROUTINE_TYPE_CONFIG.find((t) => t.key === typeKey) ??
                  ROUTINE_TYPE_CONFIG[ROUTINE_TYPE_CONFIG.length - 1];
                const freqLabel = FREQUENCY_LABEL[routine.frequency] ?? routine.frequency;
                return (
                  <TouchableOpacity
                    key={routine.id}
                    style={styles.routineCard}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate("RoutineDetail", { todoId: routine.id })}
                  >
                    <View style={[styles.routineIconBox, { backgroundColor: typeConfig.bg }]}>
                      <Text style={styles.routineEmoji}>{typeConfig.emoji}</Text>
                    </View>
                    <View style={styles.routineInfoCol}>
                      <Text style={styles.routineTitle} numberOfLines={1}>{title}</Text>
                      <View style={styles.routineMetaRow}>
                        <Ionicons name="paw" size={12} color="#8E7D7D" style={{ marginRight: 3 }} />
                        <Text style={styles.routineMetaText}>{routine.petName}</Text>
                        <Ionicons name="repeat" size={12} color="#8E7D7D" style={{ marginLeft: 10, marginRight: 3 }} />
                        <Text style={styles.routineMetaText}>{freqLabel}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#CBC0B5" />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          );
        })()
      )}

      {/* 4. 살구색 둥글둥글한 + FAB (할 일/루틴 추가 버튼) */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setShowBottomSheet(true)}
      >
        <Ionicons name="add" size={28} color="#1E1E1E" />
      </TouchableOpacity>

      {/* 5. FAB 메뉴 하단 바텀 시트 */}
      <Modal
        visible={showBottomSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowBottomSheet(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheetContainer}>
                <View style={styles.sheetHandle} />

                <TouchableOpacity
                  style={styles.sheetItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowBottomSheet(false);
                    navigation.navigate("AddAppointment");
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color="#3C2F2F"
                    style={styles.sheetIcon}
                  />
                  <Text style={styles.sheetText}>새로운 일정</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setShowBottomSheet(false);
                    navigation.navigate("AddRoutine");
                  }}
                >
                  <Ionicons
                    name="repeat-outline"
                    size={22}
                    color="#3C2F2F"
                    style={styles.sheetIcon}
                  />
                  <Text style={styles.sheetText}>새로운 루틴</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* 6. 날짜 클릭 시 일정 목록 출력 하단 바텀 시트 (시안 2 & 3) */}
      <Modal
        visible={showTodoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTodoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowTodoModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.todoBottomSheetContainer}>
                <View style={styles.sheetHandle} />

                {/* 모달 헤더 날짜 표시 */}
                <View style={styles.todoModalHeader}>
                  <Ionicons name="calendar" size={20} color="#E07A2F" style={{ marginRight: 8 }} />
                  <Text style={styles.todoModalHeaderDate}>
                    {selectedDate.getFullYear()}/{selectedDate.getMonth() + 1}/{selectedDate.getDate()}
                  </Text>
                </View>

                {/* 일정 카드 목록 스크롤 뷰 */}
                <ScrollView 
                  style={styles.todoListScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {selectedDateTodos.length === 0 ? (
                    <View style={styles.noTodoContainer}>
                      <Text style={styles.noTodoText}>선택한 날짜에 일정이 없습니다.</Text>
                    </View>
                  ) : (
                    selectedDateTodos.map((todo) => {
                      const { title, typeLabel, typeKey } = parseTodoTitle(todo.title);
                      const typeConfig = APPOINTMENT_TYPES.find((t) => t.key === typeKey) || APPOINTMENT_TYPES[6];

                      return (
                        <TouchableOpacity
                          key={todo.id}
                          style={styles.todoCard}
                          activeOpacity={0.9}
                          onPress={() => {
                            setShowTodoModal(false);
                            navigation.navigate("AppointmentDetail", { todoId: todo.id });
                          }}
                        >
                          {/* A. 체크박스 영역 (터치 버블링 방지) */}
                          <TouchableOpacity
                            style={styles.checkboxContainer}
                            activeOpacity={0.7}
                            onPress={() => handleToggleTodo(todo.id)}
                          >
                            {todo.isCompleted ? (
                              <Ionicons name="checkmark-circle" size={26} color="#E07A2F" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={26} color="#CBC0B5" />
                            )}
                          </TouchableOpacity>

                          {/* B. 파스텔 둥근 일정 타입 아이콘 */}
                          <View style={[styles.cardTypeIconBg, { backgroundColor: typeConfig.bg }]}>
                            {typeConfig.lib === "MaterialCommunityIcons" ? (
                              <MaterialCommunityIcons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
                            ) : (
                              <Ionicons name={typeConfig.icon as any} size={20} color={typeConfig.color} />
                            )}
                          </View>

                          {/* C. 상세 정보 (제목, 펫이름, 시간) */}
                          <View style={styles.cardInfoCol}>
                            <Text 
                              style={[
                                styles.cardTodoTitle,
                                todo.isCompleted && styles.cardTodoTitleCompleted
                              ]}
                              numberOfLines={1}
                            >
                              {title}
                            </Text>
                            <View style={styles.cardInfoSubRow}>
                              <View style={styles.infoSubItem}>
                                <Ionicons name="paw" size={12} color="#8E7D7D" style={{ marginRight: 3 }} />
                                <Text style={styles.infoSubText}>{todo.petName}</Text>
                              </View>
                              <View style={[styles.infoSubItem, { marginLeft: 10 }]}>
                                <Ionicons name="time-outline" size={12} color="#8E7D7D" style={{ marginRight: 3 }} />
                                <Text style={styles.infoSubText}>{formatTargetTime(todo.targetTime)}</Text>
                              </View>
                            </View>
                          </View>

                          {/* D. 일정 타입 뱃지 */}
                          <View style={[styles.cardBadge, { backgroundColor: typeConfig.bg }]}>
                            <Text style={[styles.cardBadgeText, { color: typeConfig.color }]}>
                              {typeLabel}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE1",
    height: 48,
    backgroundColor: "#FFFFFF",
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E7D7D",
  },
  tabTextActive: {
    color: "#E07A2F",
    fontWeight: "bold",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: "40%",
    height: 3,
    backgroundColor: "#E07A2F",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentScroll: {
    flex: 1,
  },
  calendarContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  arrowButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FDFBF7",
  },
  monthTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#3C2F2F",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  weekText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  sundayText: {
    color: "#FF5A5F",
  },
  saturdayText: {
    color: "#4A90E2",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "14.28%",
    aspectRatio: 0.85, // 점 마커 공간 확보를 위해 비율 소폭 조정
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 4,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCircleSelected: {
    backgroundColor: "#E07A2F",
  },
  dayCircleToday: {
    backgroundColor: "#FFE5D9",
  },
  dayText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3C2F2F",
  },
  dayTextInactive: {
    color: "#CBC0B5",
  },
  dayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  dayTextToday: {
    color: "#E07A2F",
    fontWeight: "bold",
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    height: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: 1,
  },
  routineListContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  routineCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
  },
  routineIconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  routineEmoji: {
    fontSize: 26,
  },
  routineInfoCol: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 5,
  },
  routineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routineMetaText: {
    fontSize: 12,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  routineEmptyContainer: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFE5D9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: "#A08E8E",
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: Platform.OS === "ios" ? 104 : 88,
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FFE5D9",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#C4A48A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  bottomSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  todoBottomSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    height: "60%", // 날짜별 일정이 여러 개일 수 있으므로 60% 높이 지정
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2D9D0",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  sheetIcon: {
    marginRight: 16,
  },
  sheetText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2F2F",
  },
  todoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    paddingLeft: 4,
  },
  todoModalHeaderDate: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3C2F2F",
  },
  todoListScroll: {
    flex: 1,
  },
  noTodoContainer: {
    paddingVertical: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  noTodoText: {
    fontSize: 15,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  todoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2", // 시안 고유의 포근한 연베이지 카드 배경
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTypeIconBg: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardInfoCol: {
    flex: 1,
    justifyContent: "center",
  },
  cardTodoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 4,
  },
  cardTodoTitleCompleted: {
    color: "#CBC0B5",
    textDecorationLine: "line-through",
  },
  cardInfoSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoSubItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoSubText: {
    fontSize: 12,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  cardBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
});

