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
import { useRoute, useNavigation } from "@react-navigation/native";
import { medicalApi } from "../../api/medical";
import { commonStyles } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";

const MEDICAL_TYPES = [
  { key: "VACCINE", label: "예방접종", emoji: "💉" },
  { key: "MEDICATION", label: "투약", emoji: "💊" },
  { key: "TREATMENT", label: "진료", emoji: "🏥" },
  { key: "SURGERY", label: "수술", emoji: "🔪" },
  { key: "CHECKUP", label: "검진", emoji: "🩺" },
  { key: "EXAM", label: "검사", emoji: "🔬" },
  { key: "ALLERGY", label: "알레르기", emoji: "🤧" },
  { key: "CONDITION", label: "질환", emoji: "📋" },
  { key: "OTHER", label: "기타", emoji: "📝" },
];

export const EditMedicalRecordScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { record } = route.params;

  // 데이터 상태
  const [selectedType, setSelectedType] = useState(record.type || "OTHER");
  const [title, setTitle] = useState(record.title || "");
  const [reason, setReason] = useState(record.reason || "");
  
  const [date, setDate] = useState<Date>(record.date ? new Date(record.date) : new Date());
  
  const [nextDueDate, setNextDueDate] = useState<Date | null>(
    record.nextDueDate ? new Date(record.nextDueDate) : null
  );
  const [showNextDueDate, setShowNextDueDate] = useState(!!record.nextDueDate);

  const [cost, setCost] = useState(record.cost ? String(record.cost) : "");
  const [notes, setNotes] = useState(record.notes || "");

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);

  const [titleError, setTitleError] = useState(false);
  const [reasonError, setReasonError] = useState(false);

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

  const formatDateToKorean = (d: Date) => {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleUpdateRecord = async () => {
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

    setLoading(true);
    try {
      const toDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
      };

      const parsedCost = cost ? parseInt(cost.replace(/[^0-9]/g, ""), 10) : 0;
      const typeLabel = MEDICAL_TYPES.find((t) => t.key === selectedType)?.label || "기타";

      const logData: any = {
        visitDate: toDateString(date),
        purpose: selectedType === "MEDICATION" ? title : `${typeLabel} - ${title}`,
        diagnosis: reason,
        vetNotes: notes || undefined,
        nextVisitDate: showNextDueDate && nextDueDate ? toDateString(nextDueDate) : undefined,
        expenseAmount: parsedCost > 0 ? parsedCost : undefined,
      };

      await medicalApi.updateMedicalRecord(record.id, selectedType, logData);

      Alert.alert("성공", "진료 기록이 성공적으로 수정되었습니다.", [
        {
          text: "확인",
          onPress: () => {
            // 중첩된 내비게이션(TabNavigator)의 MedicalTab 탭으로 안전하게 이동
            navigation.navigate("Home", { screen: "MedicalTab" });
          },
        },
      ]);
    } catch (error) {
      console.error("Failed to update medical record:", error);
      Alert.alert("수정 실패", "기록을 수정하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="close" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>진료 기록 수정</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
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
            placeholder="제목 입력"
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
            placeholder="원인 또는 진단명 입력"
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

        {/* 다음 예정일 */}
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
          onPress={handleUpdateRecord}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>기록 수정 완료</Text>
          )}
        </TouchableOpacity>

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
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3C2F2F",
    marginTop: 20,
    marginBottom: 8,
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
});
