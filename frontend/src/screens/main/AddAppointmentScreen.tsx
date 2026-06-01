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
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { todoApi } from "../../api/todo";
import { PetResponse, TodoRequest } from "../../types";
import { commonStyles } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import { scheduleTodoNotification } from "../../utils/notification";

// 7종 일정 타입 사양 정의
const APPOINTMENT_TYPES = [
  { key: "VETERINARY", label: "진료", icon: "hospital-building", lib: "MaterialCommunityIcons" },
  { key: "GROOMING", label: "미용", icon: "cut", lib: "Ionicons" },
  { key: "CHECK_UP", label: "검진", icon: "stethoscope", lib: "MaterialCommunityIcons" },
  { key: "MEDICATION", label: "투약", icon: "pill", lib: "MaterialCommunityIcons" },
  { key: "TRAINING", label: "훈련", icon: "school-outline", lib: "Ionicons" },
  { key: "OTHER", label: "기타", icon: "calendar-outline", lib: "Ionicons" },
  { key: "CUSTOM", label: "직접 입력", icon: "pencil-outline", lib: "Ionicons" },
];

export const AddAppointmentScreen = () => {
  const navigation = useNavigation();
  const userId = useAuthStore((state) => state.userId);

  // 데이터 상태
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [appointmentType, setAppointmentType] = useState("VETERINARY");
  const [customTitle, setCustomTitle] = useState(""); // 직접 입력용
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [time, setTime] = useState<Date>(new Date());
  const [location, setLocation] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");

  // UI 보조 상태
  const [loading, setLoading] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // 시각 유효성 경고 상태 (시안 3 구현용)
  const [titleError, setTitleError] = useState(false);

  const [useAlarm, setUseAlarm] = useState(false);
  const [alarmOption, setAlarmOption] = useState("30"); // "5", "10", "30", "60", "1440", "CUSTOM"
  const [customAlarmMinutes, setCustomAlarmMinutes] = useState("");

  const getOffsetMinutes = () => {
    if (!useAlarm) return 0;
    if (alarmOption === "CUSTOM") {
      const parsed = parseInt(customAlarmMinutes, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return parseInt(alarmOption, 10);
  };

  // 1. 마운트 시 반려동물 목록 로드
  useEffect(() => {
    if (userId) {
      const fetchPets = async () => {
        try {
          const petList = await petApi.getUserPets(userId);
          setPets(petList);
          if (petList.length > 0) {
            setSelectedPet(petList[0]);
          }
        } catch (error) {
          console.error("Failed to fetch pets for appointment:", error);
          Alert.alert("오류", "반려동물 목록을 불러오지 못했습니다.");
        }
      };
      fetchPets();
    }
  }, [userId]);

  // 피커 날짜/시간 변경 처리
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  // 날짜/시간 한글 포맷팅 헬퍼
  const formatDateToKorean = (d: Date) => {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const formatTimeToKorean = (t: Date) => {
    let hours = t.getHours();
    const minutes = t.getMinutes();
    const ampm = hours >= 12 ? "오후" : "오전";
    hours = hours % 12;
    hours = hours ? hours : 12; // 0시일 때는 12시로 표시
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    return `${ampm} ${hours}:${minutesStr}`;
  };

  // 2. 최종 일정 등록 실행 (유효성 검사 완비)
  const handleCreateAppointment = async () => {
    // 1) 시각 유효성 검사 (시안 3과 100% 동일 구현)
    if (appointmentType !== "CUSTOM" && !title.trim()) {
      setTitleError(true);
      return;
    }
    if (appointmentType === "CUSTOM" && !customTitle.trim()) {
      setTitleError(true);
      return;
    }
    setTitleError(false);

    if (!selectedPet) {
      Alert.alert("입력 오류", "일정을 등록할 반려동물을 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      // API 전송용 시간 포맷 추출 (HH:mm:ss)
      const hours = time.getHours();
      const minutes = time.getMinutes();
      const timeStr = `${hours < 10 ? `0${hours}` : hours}:${
        minutes < 10 ? `0${minutes}` : minutes
      }:00`;

      // API 전송용 날짜 포맷 추출 (YYYY-MM-DD)
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dateStr = `${year}-${month < 10 ? `0${month}` : month}-${
        day < 10 ? `0${day}` : day
      }`;

      const offset = getOffsetMinutes();
      const alarmTag = offset > 0 ? ` [알림:O:${offset}]` : "";
      const displayTitle = appointmentType === "CUSTOM" ? customTitle : title;

      // Todo DTO 조립
      const todoData: TodoRequest = {
        title: `${displayTitle} [${APPOINTMENT_TYPES.find((t) => t.key === appointmentType)?.label}]${alarmTag}${
          notes ? ` (${notes})` : ""
        }`, // DTO에 notes가 없으므로 제목 괄호로 병합 저장
        frequency: "NONE", // 단발성 일정
        dueDate: dateStr,
        targetTime: timeStr as any,
      };

      if (selectedPet.id) {
        const newTodoId = await todoApi.createTodo(selectedPet.id, todoData);

        if (offset > 0 && newTodoId) {
          const typeLabel = APPOINTMENT_TYPES.find((t) => t.key === appointmentType)?.label || "일정";
          await scheduleTodoNotification(
            newTodoId,
            `[${typeLabel}] ${displayTitle}`,
            notes,
            dateStr,
            timeStr,
            offset
          );
        }

        Alert.alert("성공", "새로운 일정이 성공적으로 등록되었습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Failed to register appointment:", error);
      const serverError = error.response?.data;
      const errorMsg = serverError 
        ? `상세 에러: ${JSON.stringify(serverError)}` 
        : `에러 메시지: ${error.message}`;
      Alert.alert("등록 실패", `일정을 등록하는 도중 서버 오류가 발생했습니다.\n\n${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // 아이콘 동적 렌더링 헬퍼
  const renderIcon = (type: typeof APPOINTMENT_TYPES[0], color: string, size = 18) => {
    if (type.lib === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={type.icon as any} size={size} color={color} />;
    }
    return <Ionicons name={type.icon as any} size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      {/* 1. 프리미엄 상단 공통 헤더 */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>새로운 일정</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 2. 반려동물 선택 셀 (Pet *) */}
        <Text style={styles.label}>Pet *</Text>
        <TouchableOpacity
          style={styles.petSelector}
          activeOpacity={0.8}
          onPress={() => setShowPetModal(true)}
        >
          <View style={styles.petSelectorLeft}>
            <View style={[styles.petIconCircle, { backgroundColor: (selectedPet?.petTheme || "#E07A2F") + "15" }]}>
              {selectedPet?.petType === "CAT" ? (
                <Text style={styles.petTypeEmoji}>🐈</Text>
              ) : (
                <Text style={styles.petTypeEmoji}>🐕</Text>
              )}
            </View>
            <Text style={styles.petSelectorText}>
              {selectedPet ? selectedPet.name : "반려동물을 선택하세요"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8E7D7D" />
        </TouchableOpacity>

        {/* 3. 일정 타입 7종 선택 그리드 (Type) */}
        <Text style={styles.label}>Type</Text>
        <View style={styles.typeGrid}>
          {APPOINTMENT_TYPES.map((type) => {
            const isSelected = appointmentType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeBadge,
                  isSelected && styles.typeBadgeSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setAppointmentType(type.key)}
              >
                {isSelected ? (
                  <Ionicons name="checkmark" size={14} color="#E07A2F" style={{ marginRight: 4 }} />
                ) : null}
                {renderIcon(type, isSelected ? "#E07A2F" : "#8E7D7D")}
                <Text
                  style={[
                    styles.typeBadgeText,
                    isSelected && styles.typeBadgeTextSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {appointmentType === "CUSTOM" && (
          <View style={styles.customInputContainer}>
            <TextInput
              style={styles.customInput}
              placeholder="직접 입력할 제목을 입력하세요"
              placeholderTextColor="#A2A2A2"
              value={customTitle}
              onChangeText={setCustomTitle}
            />
          </View>
        )}

        {/* 4. 제목 입력 (Title *) - 시안 3 에러 피드백 탑재 */}
        <View
          style={[
            styles.inputCard,
            titleError && styles.inputCardError, // 에러 발생 시 빨간색 테두리 적용
          ]}
        >
          <MaterialCommunityIcons
            name="format-text"
            size={22}
            color="#7F7F7F"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="제목 * (필수 입력)"
            placeholderTextColor="#A2A2A2"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setTitleError(false); // 타이핑 치면 에러 리셋
            }}
          />
        </View>
        {titleError ? (
          <Text style={styles.errorText}>일정 제목을 입력해주세요</Text>
        ) : null}

        {/* 5. 2열 대칭 날짜 & 시간 선택 카드 (Date, Time) */}
        <View style={styles.dateTimeRow}>
          <TouchableOpacity
            style={styles.dateTimeCard}
            activeOpacity={0.9}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={22} color="#E07A5F" style={styles.cardIcon} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardLabel}>Date</Text>
              <Text style={styles.cardValue}>{formatDateToKorean(date)}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateTimeCard}
            activeOpacity={0.9}
            onPress={() => setShowTimePicker(true)}
          >
            <Ionicons name="time-outline" size={22} color="#E07A5F" style={styles.cardIcon} />
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardLabel}>Time</Text>
              <Text style={styles.cardValue}>{formatTimeToKorean(time)}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 6. 장소 입력 카드 (Location) */}
        <View style={styles.inputCard}>
          <Ionicons name="location-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="장소 (선택 사항)"
            placeholderTextColor="#A2A2A2"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* 7. 진행 시간 입력 카드 (Duration) */}
        <View style={styles.inputCard}>
          <Ionicons name="timer-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="진행 시간 (분 단위)"
            placeholderTextColor="#A2A2A2"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
        </View>

        {/* 8. 메모 입력 카드 (Notes) */}
        <View style={[styles.inputCard, styles.notesCard]}>
          <Ionicons name="reader-outline" size={20} color="#7F7F7F" style={[styles.inputIcon, styles.notesIcon]} />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="특이사항 및 메모"
            placeholderTextColor="#A2A2A2"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 9. 사전 알림 설정 구역 */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleCardLeft}>
            <Ionicons name="notifications-outline" size={22} color="#E07A2F" style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.toggleCardTitle}>알림 설정</Text>
              <Text style={styles.toggleCardSub}>일정 시작 전에 푸시 알림을 받습니다</Text>
            </View>
          </View>
          <Switch
            value={useAlarm}
            onValueChange={setUseAlarm}
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

        {/* 10. 주황색 고정 등록 버튼 */}
        <TouchableOpacity
          style={styles.createButton}
          activeOpacity={0.8}
          onPress={handleCreateAppointment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createButtonText}>일정 등록하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* A. 날짜 피커 모달 */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          locale="ko-KR"
        />
      )}

      {/* B. 시간 피커 모달 */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
          locale="ko-KR"
        />
      )}

      {/* C. 반려동물 선택 하단 모달 바텀 시트 */}
      <Modal
        visible={showPetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPetModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPetModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.bottomSheetContainer}>
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
                    <View style={[styles.petIconCircle, { backgroundColor: (pet.petTheme || "#E07A2F") + "15" }]}>
                      {pet.petType === "CAT" ? (
                        <Text style={styles.petTypeEmoji}>🐈</Text>
                      ) : (
                        <Text style={styles.petTypeEmoji}>🐕</Text>
                      )}
                    </View>
                    <Text style={styles.petListItemText}>{pet.name}</Text>
                    {selectedPet?.id === pet.id && (
                      <Ionicons name="checkmark-circle" size={22} color="#E07A2F" style={{ marginLeft: "auto" }} />
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
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 10,
    marginTop: 6,
  },
  petSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFE5D9" + "35", // 은은한 살구 오렌지 배경
    borderWidth: 1,
    borderColor: "#FFE5D9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 20,
  },
  customInputContainer: {
    marginTop: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  customInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#F7F5F2",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  petSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  petIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  petTypeEmoji: {
    fontSize: 18,
  },
  petSelectorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3C2F2F",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.2,
    borderColor: "#E5ECE2",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 10,
  },
  typeBadgeSelected: {
    backgroundColor: "#FFE5D9", // 활성화 배경색
    borderColor: "#E07A2F", // 활성화 주황 테두리
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E7D7D",
    marginLeft: 6,
  },
  typeBadgeTextSelected: {
    color: "#E07A2F",
    fontWeight: "700",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2", // 포근한 연베이지
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#F7F5F2",
  },
  inputCardError: {
    borderColor: "#FF5A5F", // 시안 3 에러 테두리색
    backgroundColor: "#FFF8F8",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#3C2F2F",
    height: "100%",
  },
  errorText: {
    color: "#FF5A5F",
    fontSize: 12,
    marginLeft: 8,
    marginTop: -10,
    marginBottom: 14,
    fontWeight: "600",
  },
  dateTimeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dateTimeCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBF7",
    borderWidth: 1.2,
    borderColor: "#FFE5D9",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    marginRight: 8,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#8E7D7D",
    marginBottom: 2,
    fontWeight: "600",
  },
  cardValue: {
    fontSize: 14,
    color: "#3C2F2F",
    fontWeight: "bold",
  },
  notesCard: {
    height: 120,
    alignItems: "flex-start",
    paddingVertical: 16,
  },
  notesIcon: {
    marginTop: 2,
  },
  notesInput: {
    height: "100%",
  },
  notificationBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5D9" + "25",
    borderWidth: 1,
    borderColor: "#FFE5D9" + "65",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    marginTop: 8,
  },
  notificationBoxText: {
    flex: 1,
    fontSize: 13,
    color: "#E07A2F",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#E07A2F", // 시안 오렌지색
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E07A2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginTop: 10,
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
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
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2D9D0",
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 16,
    textAlign: "center",
  },
  petListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F5F2",
  },
  petListItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3C2F2F",
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FDFBF7",
    borderWidth: 1.2,
    borderColor: "#FFD9C2",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  toggleCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  toggleCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 2,
  },
  toggleCardSub: {
    fontSize: 12,
    color: "#8E7D7D",
  },
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
