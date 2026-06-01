import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { todoApi } from "../../api/todo";
import { PetResponse, TodoRequest } from "../../types";
import { commonStyles } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { scheduleTodoNotification, cancelTodoNotification } from "../../utils/notification";

// ─── 루틴 타입 목록 ──────────────────────────────────────────────────────────
const ROUTINE_TYPES = [
  { key: "BATH", label: "목욕", icon: "water-outline", lib: "Ionicons" },
  { key: "EAR_CLEANING", label: "귀 청소", icon: "ear-outline", lib: "Ionicons" },
  { key: "TEETH_CLEANING", label: "양치질", icon: "happy-outline", lib: "Ionicons" },
  { key: "BRUSHING", label: "빗질", icon: "brush-outline", lib: "Ionicons" },
  { key: "NAIL_TRIMMING", label: "발톱 정리", icon: "cut-outline", lib: "Ionicons" },
  { key: "CUSTOM", label: "직접 입력", icon: "create-outline", lib: "Ionicons" },
];

const FREQUENCY_TABS = [
  { key: "DAILY", label: "매일" },
  { key: "WEEKLY", label: "매주" },
  { key: "MONTHLY", label: "매월" },
];

const DAYS_OF_WEEK = [
  { key: "월", label: "월" },
  { key: "화", label: "화" },
  { key: "수", label: "수" },
  { key: "목", label: "목" },
  { key: "금", label: "금" },
  { key: "토", label: "토" },
  { key: "일", label: "일" },
];

// ─── 타이틀 파싱 헬퍼 ────────────────────────────────────────────────────────
const parseRoutineTitle = (rawTitle: string) => {
  let title = rawTitle || "";
  let typeKey = "CUSTOM";
  let customLabel = "";
  let days: string[] = [];
  let showInCalendar = false;
  let useAlarm = false;
  let alarmOption = "30";
  let customAlarmMinutes = "";

  // [알림:O:분] 파싱
  const alarmMatch = title.match(/\[알림:O:(\d+)\]/);
  if (alarmMatch) {
    useAlarm = true;
    const offset = alarmMatch[1];
    if (["5", "10", "30", "60", "1440"].includes(offset)) {
      alarmOption = offset;
    } else {
      alarmOption = "CUSTOM";
      customAlarmMinutes = offset;
    }
    title = title.replace(` [알림:O:${offset}]`, "").replace(`[알림:O:${offset}]`, "").trim();
  }

  // [캘린더] 태그 여부 확인
  if (title.includes("[캘린더]")) {
    showInCalendar = true;
    title = title.replace(" [캘린더]", "").replace("[캘린더]", "").trim();
  }

  // [루틴:월,화,수] 또는 [루틴] 형식 파싱
  const tagMatch = title.match(/\[루틴(?::([^\]]+))?\]/);
  if (tagMatch) {
    if (tagMatch[1]) {
      days = tagMatch[1].split(",").filter(Boolean);
    }
    title = title.replace(tagMatch[0], "").trim();
  } else {
    // 구형 포맷 지원: [목욕] 같은 타입 라벨
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

  return { title: title.trim(), typeKey, customLabel: customLabel || title.trim(), notes, days, showInCalendar, useAlarm, alarmOption, customAlarmMinutes };
};

export const EditRoutineScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const userId = useAuthStore((state) => state.userId);
  const { todoId } = route.params;

  // ─── 데이터 상태 ─────────────────────────────────────────────────────────────
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [routineType, setRoutineType] = useState("BATH");
  const [customLabel, setCustomLabel] = useState("");
  const [frequency, setFrequency] = useState("WEEKLY");
  const [everyN, setEveryN] = useState("1");
  const [selectedDays, setSelectedDays] = useState<string[]>(["월"]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [preferredTime, setPreferredTime] = useState<Date | null>(null);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showInCalendar, setShowInCalendar] = useState(false);
  const [useAlarm, setUseAlarm] = useState(false);
  const [alarmOption, setAlarmOption] = useState("30"); // "5", "10", "30", "60", "1440", "CUSTOM"
  const [customAlarmMinutes, setCustomAlarmMinutes] = useState("");
  const [notes, setNotes] = useState("");

  const getOffsetMinutes = () => {
    if (!useAlarm) return 0;
    if (alarmOption === "CUSTOM") {
      const parsed = parseInt(customAlarmMinutes, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return parseInt(alarmOption, 10);
  };

  // ─── UI 상태 ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customLabelError, setCustomLabelError] = useState(false);

  // ─── 기존 데이터 로드 ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const petList = await petApi.getUserPets(userId);
        setPets(petList);

        // 원본 Todo 찾기
        let originalTodo: any = null;
        let originalPet: PetResponse | null = null;

        for (const pet of petList) {
          if (pet.id) {
            const petTodos = await todoApi.getPetTodos(pet.id);
            const match = petTodos.find((t) => t.id === todoId);
            if (match) {
              originalTodo = match;
              originalPet = pet;
              break;
            }
          }
        }

        if (originalTodo && originalPet) {
          setSelectedPet(originalPet);

          // 타이틀 파싱 (요일 포함)
          const parsed = parseRoutineTitle(originalTodo.title || "");
          setRoutineType(parsed.typeKey);
          if (parsed.typeKey === "CUSTOM") {
            setCustomLabel(parsed.customLabel);
          }
          setNotes(parsed.notes);
          if (parsed.days.length > 0) {
            setSelectedDays(parsed.days);
          }
          setShowInCalendar(parsed.showInCalendar);
          setUseAlarm(parsed.useAlarm);
          setAlarmOption(parsed.alarmOption);
          setCustomAlarmMinutes(parsed.customAlarmMinutes);

          // 빈도
          if (originalTodo.frequency && originalTodo.frequency !== "NONE") {
            setFrequency(originalTodo.frequency);
          }

          // 시작일
          if (originalTodo.dueDate) {
            setStartDate(new Date(originalTodo.dueDate));
          }

          // 설정 시간
          if (originalTodo.targetTime) {
            const t: any = originalTodo.targetTime;
            const newTime = new Date();
            if (typeof t === "string") {
              const parts = t.split(":");
              if (parts.length >= 2) {
                newTime.setHours(parseInt(parts[0], 10));
                newTime.setMinutes(parseInt(parts[1], 10));
              }
            } else if (typeof t === "object") {
              newTime.setHours(t.hour ?? 0);
              newTime.setMinutes(t.minute ?? 0);
            }
            setPreferredTime(newTime);
          }
        } else {
          Alert.alert("오류", "수정할 루틴 정보를 찾지 못했습니다.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Failed to load routine for editing:", error);
        Alert.alert("오류", "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [todoId, userId]);

  // ─── 요일 토글 ───────────────────────────────────────────────────────────────
  const toggleDay = (dayKey: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  // ─── 아이콘 렌더 헬퍼 ────────────────────────────────────────────────────────
  const renderIcon = (type: (typeof ROUTINE_TYPES)[0], color: string, size = 18) => {
    if (type.lib === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={type.icon as any} size={size} color={color} />;
    }
    return <Ionicons name={type.icon as any} size={size} color={color} />;
  };

  // ─── 날짜/시간 포맷 ──────────────────────────────────────────────────────────
  const formatDate = (d: Date) =>
    `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;

  const formatTime = (t: Date) => {
    const hours = t.getHours();
    const minutes = t.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    const h = hours % 12 || 12;
    const m = minutes < 10 ? `0${minutes}` : minutes;
    return `${ampm} ${h}:${m}`;
  };

  // ─── 수정 저장 핸들러 ─────────────────────────────────────────────────────────
  const handleUpdateRoutine = async () => {
    if (routineType === "CUSTOM" && !customLabel.trim()) {
      setCustomLabelError(true);
      return;
    }
    setCustomLabelError(false);

    if (!selectedPet?.id) {
      Alert.alert("입력 오류", "반려동물을 선택해 주세요.");
      return;
    }

    setSubmitLoading(true);
    try {
      const typeLabel =
        routineType === "CUSTOM"
          ? customLabel.trim()
          : ROUTINE_TYPES.find((t) => t.key === routineType)?.label ?? routineType;

      const dateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;

      let timeStr: string | undefined;
      if (preferredTime) {
        timeStr = `${String(preferredTime.getHours()).padStart(2, "0")}:${String(preferredTime.getMinutes()).padStart(2, "0")}:00`;
      }

      // 요일 정보를 [루틴:MON,TUE,WED] 형식으로 인코딩
      const daysTag = frequency === "WEEKLY" && selectedDays.length > 0
        ? `[루틴:${selectedDays.join(",")}]`
        : `[루틴]`;

      const offset = getOffsetMinutes();
      const alarmTag = offset > 0 ? ` [알림:O:${offset}]` : "";

      const todoData: TodoRequest = {
        title: `${typeLabel} ${daysTag}${showInCalendar ? " [캘린더]" : ""}${alarmTag}${notes ? ` (${notes})` : ""}`,
        frequency: frequency as any,
        dueDate: dateStr,
        targetTime: timeStr as any,
      };

      await todoApi.updateTodo(todoId, todoData);

      if (offset > 0 && timeStr) {
        await scheduleTodoNotification(
          todoId,
          `[루틴] ${typeLabel}`,
          notes,
          dateStr,
          timeStr,
          offset
        );
      } else {
        await cancelTodoNotification(todoId);
      }

      Alert.alert("성공", "루틴이 성공적으로 수정되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Failed to update routine:", error);
      Alert.alert("수정 실패", "루틴을 수정하는 중 오류가 발생했습니다.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E07A2F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 헤더 ── */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>루틴 수정</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── 반려동물 선택 ── */}
        <Text style={styles.sectionLabel}>반려동물 *</Text>
        <TouchableOpacity
          style={styles.petSelector}
          activeOpacity={0.8}
          onPress={() => setShowPetModal(true)}
        >
          <View style={styles.petSelectorLeft}>
            <View
              style={[
                styles.petIconCircle,
                { backgroundColor: (selectedPet?.petTheme || "#E07A2F") + "20" },
              ]}
            >
              <Text style={styles.petTypeEmoji}>
                {selectedPet?.petType === "CAT" ? "🐈" : "🐕"}
              </Text>
            </View>
            <Text style={styles.petSelectorText}>
              {selectedPet ? selectedPet.name : "반려동물을 선택하세요"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8E7D7D" />
        </TouchableOpacity>

        {/* ── 루틴 타입 ── */}
        <Text style={styles.sectionLabel}>루틴 유형</Text>
        <View style={styles.typeGrid}>
          {ROUTINE_TYPES.map((type) => {
            const isSelected = routineType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[styles.typeBadge, isSelected && styles.typeBadgeSelected]}
                activeOpacity={0.8}
                onPress={() => setRoutineType(type.key)}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={13} color="#E07A2F" style={{ marginRight: 3 }} />
                )}
                {renderIcon(type, isSelected ? "#E07A2F" : "#8E7D7D", 16)}
                <Text style={[styles.typeBadgeText, isSelected && styles.typeBadgeTextSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 직접 입력 필드 (CUSTOM 선택 시) ── */}
        {routineType === "CUSTOM" && (
          <View style={[styles.inputCard, customLabelError && styles.inputCardError]}>
            <Ionicons name="create-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="루틴 이름을 직접 입력하세요 *"
              placeholderTextColor="#A2A2A2"
              value={customLabel}
              onChangeText={(text) => {
                setCustomLabel(text);
                if (text.trim()) setCustomLabelError(false);
              }}
            />
          </View>
        )}
        {customLabelError && (
          <Text style={styles.errorText}>루틴 이름을 입력해 주세요</Text>
        )}

        {/* ── 반복 빈도 ── */}
        <Text style={styles.sectionLabel}>반복 빈도</Text>
        <View style={styles.freqTabRow}>
          {FREQUENCY_TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.freqTab, frequency === tab.key && styles.freqTabSelected]}
              activeOpacity={0.8}
              onPress={() => setFrequency(tab.key)}
            >
              {frequency === tab.key && (
                <Ionicons name="calendar" size={14} color="#E07A2F" style={{ marginRight: 4 }} />
              )}
              <Text style={[styles.freqTabText, frequency === tab.key && styles.freqTabTextSelected]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── 몇 주/일/월마다 ── */}
        {frequency === "MONTHLY" && (
          <View style={styles.everyRow}>
            <Text style={styles.everyLabel}>매월</Text>
            <View style={styles.everyInputWrap}>
              <TextInput
                style={styles.everyInput}
                keyboardType="numeric"
                value={everyN}
                onChangeText={setEveryN}
                maxLength={2}
              />
            </View>
            <Text style={styles.everyLabel}>일 마다</Text>
          </View>
        )}

        {/* ── 요일 선택 (WEEKLY일 때) ── */}
        {frequency === "WEEKLY" && (
          <>
            <Text style={styles.sectionLabel}>반복 요일</Text>
            <View style={styles.daysRow}>
              {DAYS_OF_WEEK.map((d) => {
                const isActive = selectedDays.includes(d.key);
                return (
                  <TouchableOpacity
                    key={d.key}
                    style={[styles.dayChip, isActive && styles.dayChipSelected]}
                    activeOpacity={0.8}
                    onPress={() => toggleDay(d.key)}
                  >
                    <Text style={[styles.dayChipText, isActive && styles.dayChipTextSelected]}>
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* ── 시작 날짜 ── */}
        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.8}
          onPress={() => setShowStartDatePicker(true)}
        >
          <View style={styles.infoCardIcon}>
            <Ionicons name="calendar-outline" size={22} color="#E07A2F" />
          </View>
          <View style={styles.infoCardText}>
            <Text style={styles.infoCardLabel}>시작 날짜</Text>
            <Text style={styles.infoCardValue}>{formatDate(startDate)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4B5B5" />
        </TouchableOpacity>

        {/* ── 설정 시간 ── */}
        <TouchableOpacity
          style={styles.infoCard}
          activeOpacity={0.8}
          onPress={() => setShowTimePicker(true)}
        >
          <View style={styles.infoCardIcon}>
            <Ionicons name="time-outline" size={22} color="#E07A2F" />
          </View>
          <View style={styles.infoCardText}>
            <Text style={styles.infoCardLabel}>설정 시간</Text>
            <Text style={[styles.infoCardValue, !preferredTime && styles.infoCardPlaceholder]}>
              {preferredTime ? formatTime(preferredTime) : "설정 안 함"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#C4B5B5" />
        </TouchableOpacity>

        {/* ── 종료일 토글 ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardLeft}>
            <Ionicons name="calendar-clear-outline" size={22} color="#E07A2F" style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.toggleCardTitle}>종료일 설정</Text>
              <Text style={styles.toggleCardSub}>
                {hasEndDate ? formatDate(endDate) : "무기한 반복"}
              </Text>
            </View>
          </View>
          <Switch
            value={hasEndDate}
            onValueChange={(v) => {
              setHasEndDate(v);
              if (v) setShowEndDatePicker(true);
            }}
            trackColor={{ false: "#E5E0DA", true: "#E07A2F" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── 캘린더에 표시 토글 ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardLeft}>
            <Ionicons name="calendar" size={22} color="#E07A2F" style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.toggleCardTitle}>캘린더에 표시</Text>
              <Text style={styles.toggleCardSub}>루틴을 일정으로 캘린더에 표시합니다</Text>
            </View>
          </View>
          <Switch
            value={showInCalendar}
            onValueChange={setShowInCalendar}
            trackColor={{ false: "#E5E0DA", true: "#E07A2F" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── 사전 알림 설정 구역 ── */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardLeft}>
            <Ionicons name="notifications-outline" size={22} color="#E07A2F" style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.toggleCardTitle}>알림 설정</Text>
              <Text style={styles.toggleCardSub}>루틴 시작 전에 푸시 알림을 받습니다</Text>
            </View>
          </View>
          <Switch
            value={useAlarm}
            onValueChange={(v) => {
              if (v && !preferredTime) {
                Alert.alert("알림 설정 불가", "알림을 설정하려면 먼저 '설정 시간'을 지정해 주세요.");
                return;
              }
              setUseAlarm(v);
            }}
            trackColor={{ false: "#E5E0DA", true: "#E07A2F" }}
            thumbColor="#FFFFFF"
          />
        </View>

        {useAlarm && (
          <View style={styles.alarmOptionsCard}>
            <Text style={styles.alarmLabel}>알림 시점 선택</Text>
            <View style={styles.alarmGrid}>
              {[
                { label: "5분 전", value: "5" },
                { label: "10분 전", value: "10" },
                { label: "30분 전", value: "30" },
                { label: "1시간 전", value: "60" },
                { label: "1일 전", value: "1440" },
                { label: "직접 입력", value: "CUSTOM" },
              ].map((opt) => {
                const isSelected = alarmOption === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.alarmBadge, isSelected && styles.alarmBadgeSelected]}
                    onPress={() => setAlarmOption(opt.value)}
                  >
                    <Text style={[styles.alarmBadgeText, isSelected && styles.alarmBadgeTextSelected]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {alarmOption === "CUSTOM" && (
              <View style={styles.customAlarmInputWrapper}>
                <TextInput
                  style={styles.customAlarmInput}
                  placeholder="알림을 보낼 시간(분 단위)을 직접 입력하세요"
                  placeholderTextColor="#A2A2A2"
                  keyboardType="number-pad"
                  value={customAlarmMinutes}
                  onChangeText={setCustomAlarmMinutes}
                />
                <Text style={styles.customAlarmInputSuffix}>분 전</Text>
              </View>
            )}
          </View>
        )}

        {/* ── 메모 ── */}
        <Text style={styles.sectionLabel}>메모</Text>
        <View style={[styles.inputCard, styles.notesCard]}>
          <Ionicons name="reader-outline" size={20} color="#7F7F7F" style={[styles.inputIcon, { marginTop: 2 }]} />
          <TextInput
            style={[styles.input, { height: "100%", textAlignVertical: "top" }]}
            placeholder="특이사항 및 메모"
            placeholderTextColor="#A2A2A2"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* ── 수정 버튼 ── */}
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={handleUpdateRoutine}
          disabled={submitLoading}
        >
          {submitLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>루틴 수정하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ── DateTimePicker: 시작일 ── */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setShowStartDatePicker(false);
            if (d) setStartDate(d);
          }}
          locale="ko-KR"
        />
      )}

      {/* ── DateTimePicker: 종료일 ── */}
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(_, d) => {
            setShowEndDatePicker(false);
            if (d) setEndDate(d);
          }}
          locale="ko-KR"
        />
      )}

      {/* ── DateTimePicker: 설정 시간 ── */}
      {showTimePicker && (
        <DateTimePicker
          value={preferredTime ?? new Date()}
          mode="time"
          display="default"
          onChange={(_, t) => {
            setShowTimePicker(false);
            if (t) setPreferredTime(t);
          }}
          locale="ko-KR"
        />
      )}

      {/* ── 반려동물 선택 모달 ── */}
      <Modal
        visible={showPetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPetModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPetModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheet}>
                <View style={styles.sheetHandle} />
                <Text style={styles.modalTitle}>반려동물 선택</Text>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petListItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedPet(pet);
                      setShowPetModal(false);
                    }}
                  >
                    <View
                      style={[
                        styles.petIconCircle,
                        { backgroundColor: (pet.petTheme || "#E07A2F") + "20" },
                      ]}
                    >
                      <Text style={styles.petTypeEmoji}>
                        {pet.petType === "CAT" ? "🐈" : "🐕"}
                      </Text>
                    </View>
                    <Text style={styles.petListItemText}>{pet.name}</Text>
                    {selectedPet?.id === pet.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#E07A2F"
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 24, paddingBottom: 60 },
  sectionLabel: {
    fontSize: 15, fontWeight: "700", color: "#3C2F2F", marginBottom: 10, marginTop: 8,
  },
  petSelector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFF4EE", borderWidth: 1, borderColor: "#FFD9C2",
    borderRadius: 16, paddingHorizontal: 16, height: 56, marginBottom: 20,
  },
  petSelectorLeft: { flexDirection: "row", alignItems: "center" },
  petIconCircle: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  petTypeEmoji: { fontSize: 18 },
  petSelectorText: { fontSize: 16, fontWeight: "700", color: "#3C2F2F" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 12, gap: 8 },
  typeBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF",
    borderWidth: 1.2, borderColor: "#E8E0DB", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  typeBadgeSelected: { backgroundColor: "#FFF4EE", borderColor: "#E07A2F" },
  typeBadgeText: { fontSize: 13, fontWeight: "600", color: "#8E7D7D", marginLeft: 5 },
  typeBadgeTextSelected: { color: "#E07A2F", fontWeight: "700" },
  inputCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#F7F5F2",
    borderRadius: 16, paddingHorizontal: 16, height: 54,
    marginBottom: 12, borderWidth: 1.5, borderColor: "#F7F5F2",
  },
  inputCardError: { borderColor: "#FF5A5F", backgroundColor: "#FFF8F8" },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: "#3C2F2F" },
  notesCard: { height: 100, alignItems: "flex-start", paddingVertical: 14, marginBottom: 20 },
  errorText: {
    color: "#FF5A5F", fontSize: 12, marginLeft: 8,
    marginTop: -6, marginBottom: 10, fontWeight: "600",
  },
  freqTabRow: { flexDirection: "row", marginBottom: 16, gap: 8 },
  freqTab: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 18,
    paddingVertical: 10, borderRadius: 12, backgroundColor: "#F7F5F2",
    borderWidth: 1.2, borderColor: "#E8E0DB",
  },
  freqTabSelected: { backgroundColor: "#FFF4EE", borderColor: "#E07A2F" },
  freqTabText: { fontSize: 14, fontWeight: "600", color: "#8E7D7D" },
  freqTabTextSelected: { color: "#E07A2F", fontWeight: "700" },
  everyRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
  everyLabel: { fontSize: 15, color: "#3C2F2F", fontWeight: "600" },
  everyInputWrap: {
    width: 52, height: 42, backgroundColor: "#F7F5F2",
    borderRadius: 12, borderWidth: 1.2, borderColor: "#E8E0DB",
    justifyContent: "center", alignItems: "center",
  },
  everyInput: {
    fontSize: 16, fontWeight: "700", color: "#3C2F2F",
    textAlign: "center", width: "100%",
  },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  dayChip: {
    width: 40, height: 40, borderRadius: 12, justifyContent: "center",
    alignItems: "center", backgroundColor: "#F7F5F2",
    borderWidth: 1.2, borderColor: "#E8E0DB",
  },
  dayChipSelected: { backgroundColor: "#FFF4EE", borderColor: "#E07A2F" },
  dayChipText: { fontSize: 13, fontWeight: "600", color: "#8E7D7D" },
  dayChipTextSelected: { color: "#E07A2F", fontWeight: "700" },
  infoCard: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#FDFBF7",
    borderWidth: 1.2, borderColor: "#FFD9C2", borderRadius: 16,
    paddingHorizontal: 16, height: 64, marginBottom: 12,
  },
  infoCardIcon: { marginRight: 14 },
  infoCardText: { flex: 1 },
  infoCardLabel: { fontSize: 11, color: "#8E7D7D", fontWeight: "600", marginBottom: 2 },
  infoCardValue: { fontSize: 14, color: "#3C2F2F", fontWeight: "700" },
  infoCardPlaceholder: { color: "#A2A2A2", fontWeight: "500" },
  toggleCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FDFBF7", borderWidth: 1.2, borderColor: "#FFD9C2",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  toggleCardLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  toggleCardTitle: { fontSize: 14, fontWeight: "700", color: "#3C2F2F", marginBottom: 2 },
  toggleCardSub: { fontSize: 12, color: "#8E7D7D" },
  createButton: {
    backgroundColor: "#E07A2F", height: 56, borderRadius: 16,
    justifyContent: "center", alignItems: "center",
    shadowColor: "#E07A2F", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 4, marginTop: 8,
  },
  createButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  bottomSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
  },
  sheetHandle: {
    width: 44, height: 5, borderRadius: 3, backgroundColor: "#E2D9D0",
    alignSelf: "center", marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18, fontWeight: "bold", color: "#3C2F2F",
    marginBottom: 16, textAlign: "center",
  },
  petListItem: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F7F5F2",
  },
  petListItemText: { fontSize: 16, fontWeight: "600", color: "#3C2F2F" },
  alarmOptionsCard: {
    backgroundColor: "#FAF6F0",
    borderWidth: 1.2,
    borderColor: "#EAE6DF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  alarmLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 10,
  },
  alarmGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  alarmBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F7F5F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EAE6DF",
  },
  alarmBadgeSelected: {
    backgroundColor: "#FFEBE0",
    borderColor: "#E07A2F",
  },
  alarmBadgeText: {
    fontSize: 13,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  alarmBadgeTextSelected: {
    color: "#E07A2F",
    fontWeight: "700",
  },
  customAlarmInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    paddingHorizontal: 12,
    height: 44,
    marginTop: 12,
  },
  customAlarmInput: {
    flex: 1,
    fontSize: 14,
    color: "#3C2F2F",
    fontWeight: "600",
  },
  customAlarmInputSuffix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E7D7D",
    marginLeft: 6,
  },
});
