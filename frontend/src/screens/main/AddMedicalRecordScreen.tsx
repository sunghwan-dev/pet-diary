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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { medicalApi } from "../../api/medical";
import { PetResponse, MedicalLogRequest, MedicationRequest } from "../../types";
import { commonStyles } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";

// 진료/예방접종 타입 9종 정의
const MEDICAL_TYPES = [
  { key: "VACCINE", label: "예방접종", emoji: "💉", color: "#FF8A8A", bg: "#FFF0F0" },
  { key: "MEDICATION", label: "투약", emoji: "💊", color: "#FFA500", bg: "#FFF5E6" },
  { key: "TREATMENT", label: "진료", emoji: "🏥", color: "#20B2AA", bg: "#E6F7F6" },
  { key: "SURGERY", label: "수술", emoji: "🔪", color: "#E05A5A", bg: "#FFF0F0" },
  { key: "CHECKUP", label: "검진", emoji: "🩺", color: "#9370DB", bg: "#F5F0FA" },
  { key: "EXAM", label: "검사", emoji: "🔬", color: "#4A9EE0", bg: "#EAF4FF" },
  { key: "ALLERGY", label: "알레르기", emoji: "🤧", color: "#E07A2F", bg: "#FFF4EE" },
  { key: "CONDITION", label: "질환", emoji: "📋", color: "#4ABFA0", bg: "#E8FAF6" },
  { key: "OTHER", label: "기타", emoji: "📝", color: "#7F7F7F", bg: "#F2F2F2" },
];

export const AddMedicalRecordScreen = () => {
  const navigation = useNavigation();
  const userId = useAuthStore((state) => state.userId);

  // 데이터 상태
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [selectedType, setSelectedType] = useState("VACCINE");

  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  
  // Next Due Date (선택 사항)
  const [nextDueDate, setNextDueDate] = useState<Date | null>(null);
  const [showNextDueDate, setShowNextDueDate] = useState(false);

  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");

  // UI 보조 상태
  const [loading, setLoading] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  // 유효성 에러 상태
  const [titleError, setTitleError] = useState(false);
  const [reasonError, setReasonError] = useState(false);

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
          console.error("Failed to fetch pets for medical record:", error);
          Alert.alert("오류", "반려동물 목록을 불러오지 못했습니다.");
        }
      };
      fetchPets();
    }
  }, [userId]);

  // 날짜 변경 처리
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const onNextDateChange = (event: any, selectedDate?: Date) => {
    setShowNextDatePicker(false);
    if (selectedDate) {
      setNextDueDate(selectedDate);
      setShowNextDueDate(true);
    }
  };

  // 날짜 한글 포맷팅 헬퍼
  const formatDateToKorean = (d: Date) => {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  // 2. 의료 기록 등록 저장 실행
  const handleSaveRecord = async () => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }

    if (!reason.trim()) {
      setReasonError(true);
      hasError = true;
    } else {
      setReasonError(false);
    }

    if (hasError) return;

    if (!selectedPet || !selectedPet.id) {
      Alert.alert("입력 오류", "기록을 저장할 반려동물을 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      // YYYY-MM-DD 포맷 변환 헬퍼
      const toDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
      };

      const parsedCost = cost ? parseInt(cost.replace(/[^0-9]/g, ""), 10) : 0;
      const typeLabel = MEDICAL_TYPES.find((t) => t.key === selectedType)?.label || "기타";

      if (selectedType === "MEDICATION") {
        // 투약(Medication)인 경우 Medication API 호출
        const medicationData: MedicationRequest = {
          name: `${title} (${reason})`,
          startDate: toDateString(date),
          endDate: showNextDueDate && nextDueDate ? toDateString(nextDueDate) : toDateString(date),
          expenseAmount: parsedCost > 0 ? parsedCost : undefined,
        };

        await medicalApi.recordMedication(selectedPet.id, medicationData);
      } else {
        // 그 외 모든 타입은 MedicalLog API 호출
        const logData: MedicalLogRequest = {
          visitDate: toDateString(date),
          purpose: `${typeLabel} - ${title}`,
          diagnosis: reason,
          vetNotes: notes || undefined,
          nextVisitDate: showNextDueDate && nextDueDate ? toDateString(nextDueDate) : undefined,
          expenseAmount: parsedCost > 0 ? parsedCost : undefined,
          // weightAtVisit은 선택 입력 사항이나 시안에 별도 인풋이 없으므로 일단 제외
        };

        await medicalApi.recordMedicalLog(selectedPet.id, logData);
      }

      Alert.alert("성공", "진료 및 예방접종 기록이 성공적으로 저장되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      console.error("Failed to save medical record:", error);
      Alert.alert("저장 실패", "기록을 저장하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>새 진료 기록</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 반려동물 선택 */}
        <Text style={styles.label}>반려동물 *</Text>
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

        {/* 타입 선택 */}
        <Text style={styles.label}>구분</Text>
        <View style={styles.typeGrid}>
          {MEDICAL_TYPES.map((type) => {
            const isSelected = selectedType === type.key;
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeBadge,
                  isSelected && styles.typeBadgeSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedType(type.key)}
              >
                {isSelected ? (
                  <Ionicons name="checkmark" size={14} color="#E07A2F" style={{ marginRight: 4 }} />
                ) : null}
                <Text style={{ marginRight: 4, fontSize: 14 }}>{type.emoji}</Text>
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

        {/* 제목 입력 */}
        <Text style={styles.label}>제목 *</Text>
        <View style={[styles.inputWrapper, titleError && styles.inputWrapperError]}>
          <Ionicons name="text-outline" size={20} color="#8E7D7D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="예: 종합백신 1차, 귓병 진료 등"
            placeholderTextColor="#A2A2A2"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setTitleError(false);
            }}
          />
        </View>
        {titleError && <Text style={styles.errorText}>제목을 입력해 주세요.</Text>}

        {/* 원인 및 진단명 */}
        <Text style={styles.label}>원인 / 진단명 *</Text>
        <View style={[styles.inputWrapper, reasonError && styles.inputWrapperError]}>
          <MaterialCommunityIcons name="card-plus-outline" size={20} color="#8E7D7D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="예: 예방접종 차 내원, 외이도염"
            placeholderTextColor="#A2A2A2"
            value={reason}
            onChangeText={(text) => {
              setReason(text);
              if (text.trim()) setReasonError(false);
            }}
          />
        </View>
        {reasonError && <Text style={styles.errorText}>원인 또는 진단명을 입력해 주세요.</Text>}

        {/* 날짜 선택 */}
        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          activeOpacity={0.8}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.pickerButtonLeft}>
            <Ionicons name="calendar-outline" size={20} color="#3C2F2F" style={styles.pickerIcon} />
            <View>
              <Text style={styles.pickerLabel}>날짜</Text>
              <Text style={styles.pickerValue}>{formatDateToKorean(date)}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 다음 예정일 (선택 사항) */}
        <Text style={styles.label}>다음 예정일 (선택)</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          activeOpacity={0.8}
          onPress={() => setShowNextDatePicker(true)}
        >
          <View style={styles.pickerButtonLeft}>
            <Ionicons name="time-outline" size={20} color="#3C2F2F" style={styles.pickerIcon} />
            <View>
              <Text style={styles.pickerLabel}>다음 예정일</Text>
              <Text style={styles.pickerValue}>
                {showNextDueDate && nextDueDate ? formatDateToKorean(nextDueDate) : "지정 안 함"}
              </Text>
            </View>
          </View>
          {showNextDueDate && (
            <TouchableOpacity
              onPress={() => {
                setNextDueDate(null);
                setShowNextDueDate(false);
              }}
              style={styles.clearNextDateButton}
            >
              <Ionicons name="close-circle" size={20} color="#8E7D7D" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* 비용 입력 */}
        <Text style={styles.label}>비용 (선택)</Text>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#8E7D7D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="비용 입력"
            placeholderTextColor="#A2A2A2"
            keyboardType="number-pad"
            value={cost ? `${parseInt(cost.replace(/[^0-9]/g, ""), 10).toLocaleString()} 원` : ""}
            onChangeText={(text) => {
              const numericValue = text.replace(/[^0-9]/g, "");
              setCost(numericValue);
            }}
          />
        </View>

        {/* 메모 입력 */}
        <Text style={styles.label}>메모 (선택)</Text>
        <View style={styles.textAreaWrapper}>
          <Ionicons name="menu-outline" size={20} color="#8E7D7D" style={styles.textAreaIcon} />
          <TextInput
            style={styles.textArea}
            placeholder="상세 내용을 적어주세요."
            placeholderTextColor="#A2A2A2"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        {/* 피커 모달 */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {showNextDatePicker && (
          <DateTimePicker
            value={nextDueDate || new Date()}
            mode="date"
            display="default"
            onChange={onNextDateChange}
          />
        )}

        {/* 저장 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSaveRecord}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>기록 저장하기</Text>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* 반려동물 선택 모달 */}
      <Modal
        visible={showPetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPetModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPetModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>반려동물 선택</Text>
              <ScrollView style={styles.modalScroll}>
                {pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petModalItem}
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
                    <Text style={styles.petModalItemText}>{pet.name}</Text>
                    {selectedPet?.id === pet.id && (
                      <Ionicons name="checkmark-circle" size={22} color="#E07A2F" style={{ marginLeft: "auto" }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

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
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C2F2F",
    marginTop: 20,
    marginBottom: 8,
  },
  petSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F5F2",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EAE6DF",
  },
  petSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  petIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  petTypeEmoji: {
    fontSize: 16,
  },
  petSelectorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: "#EAE6DF",
  },
  typeBadgeSelected: {
    backgroundColor: "#FFE5D9",
    borderColor: "#FFB593",
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E7D7D",
  },
  typeBadgeTextSelected: {
    color: "#E07A2F",
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    height: 56,
  },
  inputWrapperError: {
    borderColor: "#E05A5A",
    backgroundColor: "#FFF0F0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 12,
    color: "#E05A5A",
    marginTop: 4,
    marginLeft: 4,
  },
  pickerButton: {
    backgroundColor: "#FFEBE0",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerIcon: {
    marginRight: 12,
  },
  pickerLabel: {
    fontSize: 12,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  pickerValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
    marginTop: 2,
  },
  clearNextDateButton: {
    padding: 4,
  },
  textAreaWrapper: {
    flexDirection: "row",
    backgroundColor: "#F7F5F2",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    minHeight: 120,
  },
  textAreaIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#E07A5F",
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: "#E07A5F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "60%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 16,
    textAlign: "center",
  },
  modalScroll: {
    marginBottom: 20,
  },
  petModalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE1",
  },
  petModalItemText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
  },
});
