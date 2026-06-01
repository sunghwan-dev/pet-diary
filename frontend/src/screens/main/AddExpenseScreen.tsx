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
import { expenseApi } from "../../api/expense";
import { PetResponse, ExpenseRequest } from "../../types";
import { commonStyles } from "../../styles/theme";
import DateTimePicker from "@react-native-community/datetimepicker";

const EXPENSE_CATEGORIES = [
  { key: "FOOD", label: "사료/간식", emoji: "🍖" },
  { key: "TOY", label: "장난감/용품", emoji: "🧸" },
  { key: "MEDICAL", label: "의료/병원", emoji: "🏥" },
  { key: "GROOMING", label: "미용/목욕", emoji: "✂️" },
  { key: "OTHER", label: "기타", emoji: "💵" },
];

export const AddExpenseScreen = () => {
  const navigation = useNavigation();
  const userId = useAuthStore((state) => state.userId);

  // 데이터 상태
  const [pets, setPets] = useState<PetResponse[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetResponse | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("FOOD");

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [showPetModal, setShowPetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [titleError, setTitleError] = useState(false);
  const [amountError, setAmountError] = useState(false);

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
          console.error("Failed to fetch pets for expense:", error);
          Alert.alert("오류", "반려동물 목록을 불러오지 못했습니다.");
        }
      };
      fetchPets();
    }
  }, [userId]);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDateToKorean = (d: Date) => {
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  };

  const handleSaveExpense = async () => {
    let hasError = false;
    if (!title.trim()) {
      setTitleError(true);
      hasError = true;
    } else {
      setTitleError(false);
    }

    if (!amount.trim()) {
      setAmountError(true);
      hasError = true;
    } else {
      setAmountError(false);
    }

    if (hasError) return;

    if (!selectedPet || !selectedPet.id) {
      Alert.alert("입력 오류", "지출을 기록할 반려동물을 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const toDateString = (d: Date) => {
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        return `${year}-${month < 10 ? `0${month}` : month}-${day < 10 ? `0${day}` : day}`;
      };

      const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);

      const expenseData: ExpenseRequest = {
        category: selectedCategory,
        amount: parsedAmount,
        expenseDate: toDateString(date),
        memo: `${title}${notes ? ` - ${notes}` : ""}`,
      };

      await expenseApi.recordExpense(selectedPet.id, expenseData);

      Alert.alert("성공", "지출 내역이 성공적으로 등록되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Failed to save expense:", error);
      Alert.alert("등록 실패", "지출을 등록하는 도중 서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryLabel = EXPENSE_CATEGORIES.find(c => c.key === selectedCategory);

  return (
    <View style={styles.container}>
      {/* 상단 헤더 */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>소비 지출 등록</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 반려동물 선택 */}
        <Text style={styles.label}>반려동물 *</Text>
        <TouchableOpacity
          style={styles.selector}
          activeOpacity={0.8}
          onPress={() => setShowPetModal(true)}
        >
          <View style={styles.selectorLeft}>
            <View style={[styles.iconCircle, { backgroundColor: (selectedPet?.petTheme || "#E07A2F") + "15" }]}>
              {selectedPet?.petType === "CAT" ? (
                <Text style={styles.emoji}>🐈</Text>
              ) : (
                <Text style={styles.emoji}>🐕</Text>
              )}
            </View>
            <Text style={styles.selectorText}>
              {selectedPet ? selectedPet.name : "반려동물을 선택하세요"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8E7D7D" />
        </TouchableOpacity>

        {/* 카테고리 선택 */}
        <Text style={styles.label}>카테고리 *</Text>
        <TouchableOpacity
          style={styles.selector}
          activeOpacity={0.8}
          onPress={() => setShowCategoryModal(true)}
        >
          <View style={styles.selectorLeft}>
            <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
              <Text style={styles.emoji}>{currentCategoryLabel?.emoji}</Text>
            </View>
            <Text style={styles.selectorText}>
              {currentCategoryLabel?.label}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#8E7D7D" />
        </TouchableOpacity>

        {/* 지출명 입력 */}
        <Text style={styles.label}>지출명 *</Text>
        <View style={[styles.inputWrapper, titleError && styles.inputWrapperError]}>
          <Ionicons name="text-outline" size={20} color="#8E7D7D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="지출 항목을 입력해 주세요."
            placeholderTextColor="#A2A2A2"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (text.trim()) setTitleError(false);
            }}
          />
        </View>
        {titleError && <Text style={styles.errorText}>지출명을 입력해 주세요.</Text>}

        {/* 지출금액 입력 */}
        <Text style={styles.label}>금액 *</Text>
        <View style={[styles.inputWrapper, amountError && styles.inputWrapperError]}>
          <MaterialCommunityIcons name="cash-multiple" size={20} color="#8E7D7D" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="금액을 입력해 주세요."
            placeholderTextColor="#A2A2A2"
            keyboardType="number-pad"
            value={amount ? `${parseInt(amount.replace(/[^0-9]/g, ""), 10).toLocaleString()} 원` : ""}
            onChangeText={(text) => {
              const numeric = text.replace(/[^0-9]/g, "");
              setAmount(numeric);
              if (numeric.trim()) setAmountError(false);
            }}
          />
        </View>
        {amountError && <Text style={styles.errorText}>지출 금액을 입력해 주세요.</Text>}

        {/* 결제 날짜 선택 */}
        <Text style={styles.label}>날짜</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          activeOpacity={0.8}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.pickerButtonLeft}>
            <Ionicons name="calendar-outline" size={20} color="#3C2F2F" style={styles.pickerIcon} />
            <View>
              <Text style={styles.pickerLabel}>결제 날짜</Text>
              <Text style={styles.pickerValue}>{formatDateToKorean(date)}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#8E7D7D" />
        </TouchableOpacity>

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

        {/* 날짜 피커 모달 */}
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {/* 등록 버튼 */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          activeOpacity={0.8}
          onPress={handleSaveExpense}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>지출 기록 저장</Text>
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
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedPet(pet);
                      setShowPetModal(false);
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: (pet.petTheme || "#E07A2F") + "15" }]}>
                      {pet.petType === "CAT" ? (
                        <Text style={styles.emoji}>🐈</Text>
                      ) : (
                        <Text style={styles.emoji}>🐕</Text>
                      )}
                    </View>
                    <Text style={styles.modalItemText}>{pet.name}</Text>
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

      {/* 카테고리 선택 모달 */}
      <Modal
        visible={showCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>카테고리 선택</Text>
              <ScrollView style={styles.modalScroll}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={styles.modalItem}
                    onPress={() => {
                      setSelectedCategory(category.key);
                      setShowCategoryModal(false);
                    }}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: "#F7F5F2" }]}>
                      <Text style={styles.emoji}>{category.emoji}</Text>
                    </View>
                    <Text style={styles.modalItemText}>{category.label}</Text>
                    {selectedCategory === category.key && (
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
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F7F5F2",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#EAE6DF",
    marginBottom: 4,
  },
  selectorLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  emoji: {
    fontSize: 16,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
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
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F5ECE1",
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
  },
});
