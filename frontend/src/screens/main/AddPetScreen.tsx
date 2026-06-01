import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  Platform,
} from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { fileApi } from "../../api/file";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PetRequest } from "../../types";
import DateTimePicker from "@react-native-community/datetimepicker";
import { commonStyles } from "../../styles/theme";

const THEME_COLORS = [
  "#4A90E2", // 파랑
  "#FF5A5F", // 빨강
  "#53D769", // 초록
  "#FF9500", // 주황
  "#AF52DE", // 보라
  "#00C7BE", // 청록
  "#FF2D55", // 분홍
  "#5856D6", // 네이비
  "#FFCC00", // 노랑
  "#30B0C7", // 하늘
  "#A2845E", // 갈색
  "#8E8E93", // 회색
];

export const AddPetScreen = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [petType, setPetType] = useState<"DOG" | "CAT">("DOG");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [petTheme, setPetTheme] = useState("#4A90E2");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [isNeutered, setIsNeutered] = useState(false);
  const [allergies, setAllergies] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [adoptionDate, setAdoptionDate] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [microchipNumber, setMicrochipNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const [showBirthPicker, setShowBirthPicker] = useState(false);
  const [showAdoptionPicker, setShowAdoptionPicker] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const navigation = useNavigation();
  const route = useRoute<any>();
  const petId = route.params?.petId; // 수정 모드 시 넘어오는 ID
  const isEditMode = !!petId;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "권한 필요",
        "프로필 사진을 선택하려면 갤러리 접근 권한이 필요합니다.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // 수정 모드일 때 기존 펫 데이터를 백엔드에서 실시간 패치하여 자동완성
  useEffect(() => {
    if (isEditMode) {
      const fetchEditPetData = async () => {
        try {
          setLoading(true);
          const editPet = await petApi.getPetDetail(petId);
          setName(editPet.name || "");
          setBreed(editPet.breed || "");
          setPetType((editPet.petType as any) || "DOG");
          setPetTheme(editPet.petTheme || "#4A90E2");
          setGender((editPet.gender as any) || "MALE");
          setIsNeutered(editPet.isNeutered || false);
          setAllergies(editPet.allergies || "");
          setBirthDate(editPet.birthDate || "");
          setAdoptionDate(editPet.adoptionDate || "");
          setCurrentWeight(editPet.latestWeight ? editPet.latestWeight.toString() : "");
          setMicrochipNumber(editPet.microchipNumber || "");
          setNotes(editPet.notes || "");
          if (editPet.profileImageUrl) {
            setProfileImage(editPet.profileImageUrl);
          }
        } catch (error) {
          console.error("Failed to load pet detail for edit:", error);
          Alert.alert("오류", "기존 반려동물 정보를 가져오지 못했습니다.");
        } finally {
          setLoading(false);
        }
      };
      fetchEditPetData();
    }
  }, [petId]);

  const handleRegister = async () => {
    if (!name || !userId) {
      Alert.alert("입력 오류", "아이의 이름은 필수 항목입니다.");
      return;
    }

    setLoading(true);
    try {
      // 기존 업로드된 이미지인 경우(http로 시작) 재업로드를 패스함
      let uploadedImageUrl = profileImage && profileImage.startsWith("http") ? profileImage : undefined;

      if (profileImage && !profileImage.startsWith("http")) {
        console.log("Uploading image...", profileImage);
        const uploadResult = await fileApi.uploadFile(profileImage);
        uploadedImageUrl = uploadResult.url;
        console.log("Upload success:", uploadedImageUrl);
      }

      const petData: PetRequest = {
        name,
        breed,
        birthDate: birthDate || undefined,
        isNeutered,
        currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
        profileImageUrl: uploadedImageUrl,
        petType,
        petTheme,
        gender,
        allergies: allergies || undefined,
        adoptionDate: adoptionDate || undefined,
        microchipNumber: microchipNumber || undefined,
        notes: notes || undefined,
      };

      if (isEditMode) {
        console.log("Updating pet...", petData);
        await petApi.updatePet(petId, petData);
        Alert.alert("성공", "반려동물 정보가 성공적으로 수정되었습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      } else {
        console.log("Registering pet...", petData);
        await petApi.registerPet(userId, petData);
        Alert.alert("성공", "반려동물이 성공적으로 등록되었습니다.", [
          { text: "확인", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      console.error("Failed to register/update pet:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "알 수 없는 오류가 발생했습니다.";
      Alert.alert("처리 실패", `오류 내용: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const onBirthChange = (event: any, selectedDate?: Date) => {
    setShowBirthPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setBirthDate(formattedDate);
    }
  };

  const onAdoptionChange = (event: any, selectedDate?: Date) => {
    setShowAdoptionPicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setAdoptionDate(formattedDate);
    }
  };

  const formatDateToKorean = (dateStr: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${year}년 ${month}월 ${day}일`;
  };

  const calculateAge = (birthDateStr: string) => {
    if (!birthDateStr) return "";
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? ` (${age}살)` : " (1살 미만)";
  };

  return (
    <View style={styles.container}>
      {/* 프리미엄 상단 헤더 */}
      <View style={commonStyles.header}>
        <View style={commonStyles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={commonStyles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E1E1E" />
          </TouchableOpacity>
          <Text style={commonStyles.headerTitle}>{isEditMode ? "반려동물 정보 수정" : "반려동물 등록"}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. 사진 추가 영역 */}
        <View style={styles.imagePickerSection}>
          <TouchableOpacity style={styles.photoBox} onPress={pickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.selectedPhoto} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color="#4A90E2" />
                <Text style={styles.photoPlaceholderText}>사진 추가</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 2. 반려동물 종류 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>반려동물 종류</Text>
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentButton, petType === "DOG" && styles.segmentButtonActive]}
              onPress={() => setPetType("DOG")}
            >
              {petType === "DOG" && <Ionicons name="checkmark" size={16} color="#1E1E1E" style={{ marginRight: 4 }} />}
              <Text style={[styles.segmentText, petType === "DOG" && styles.segmentTextActive]}>🐕 강아지</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, petType === "CAT" && styles.segmentButtonActive]}
              onPress={() => setPetType("CAT")}
            >
              {petType === "CAT" && <Ionicons name="checkmark" size={16} color="#1E1E1E" style={{ marginRight: 4 }} />}
              <Text style={[styles.segmentText, petType === "CAT" && styles.segmentTextActive]}>🐈 고양이</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 이름 입력 */}
        <View style={styles.inputCard}>
          <Ionicons name="paw" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="이름 * (필수 입력)"
            placeholderTextColor="#A2A2A2"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* 4. 품종 입력 */}
        <View style={styles.inputCard}>
          <Ionicons name="shapes-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="품종을 입력하세요"
            placeholderTextColor="#A2A2A2"
            value={breed}
            onChangeText={setBreed}
          />
        </View>

        {/* 5. 반려동물 테마 컬러 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>대표 테마 색상</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPalette}>
            {THEME_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorCircle, { backgroundColor: color }]}
                onPress={() => setPetTheme(color)}
                activeOpacity={0.8}
              >
                {petTheme === color && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6. 성별 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>성별</Text>
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentButton, gender === "MALE" && styles.segmentButtonActive]}
              onPress={() => setGender("MALE")}
            >
              {gender === "MALE" && <Ionicons name="checkmark" size={16} color="#1E1E1E" style={{ marginRight: 4 }} />}
              <Text style={[styles.segmentText, gender === "MALE" && styles.segmentTextActive]}>남아</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, gender === "FEMALE" && styles.segmentButtonActive]}
              onPress={() => setGender("FEMALE")}
            >
              {gender === "FEMALE" && <Ionicons name="checkmark" size={16} color="#1E1E1E" style={{ marginRight: 4 }} />}
              <Text style={[styles.segmentText, gender === "FEMALE" && styles.segmentTextActive]}>♀ 여아</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 7. 중성화 수술 여부 */}
        <View style={styles.switchCard}>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>중성화 수술 여부</Text>
            <Text style={styles.switchSubTitle}>중성화 또는 난소 제거 수술을 받았나요?</Text>
          </View>
          <Switch
            trackColor={{ false: "#D1D1D6", true: "#E07A2F" }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#D1D1D6"
            onValueChange={setIsNeutered}
            value={isNeutered}
          />
        </View>

        {/* 9. 알레르기 입력 */}
        <View style={styles.inputCard}>
          <Ionicons name="warning-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="알레르기 정보"
            placeholderTextColor="#A2A2A2"
            value={allergies}
            onChangeText={setAllergies}
          />
        </View>

        {/* 10. 생년월일 카드 */}
        <TouchableOpacity 
          style={styles.dateCard} 
          onPress={() => setShowBirthPicker(true)}
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons name="cake-variant-outline" size={22} color="#E07A5F" style={styles.dateIcon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>생년월일</Text>
            <Text style={[styles.dateValue, !birthDate && styles.placeholderText]}>
              {birthDate ? `${formatDateToKorean(birthDate)}${calculateAge(birthDate)}` : "생년월일을 선택해 주세요"}
            </Text>
          </View>
          <View style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={22} color="#3C2F2F" />
          </View>
        </TouchableOpacity>

        {/* 11. 입양일 카드 */}
        <TouchableOpacity 
          style={styles.dateCard} 
          onPress={() => setShowAdoptionPicker(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="heart-outline" size={22} color="#FF5A5F" style={styles.dateIcon} />
          <View style={styles.dateTextContainer}>
            <Text style={styles.dateLabel}>입양일 (선택 사항)</Text>
            <Text style={[styles.dateValue, !adoptionDate && styles.placeholderText]}>
              {adoptionDate ? formatDateToKorean(adoptionDate) : "미설정 (선택 사항)"}
            </Text>
          </View>
          <View style={styles.calendarButton}>
            <Ionicons name="calendar-outline" size={22} color="#3C2F2F" />
          </View>
        </TouchableOpacity>

        {/* 12. 현재 몸무게 */}
        <View style={styles.inputCard}>
          <MaterialCommunityIcons name="scale-bathroom" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="현재 몸무게 (kg)"
            placeholderTextColor="#A2A2A2"
            value={currentWeight}
            onChangeText={setCurrentWeight}
            keyboardType="numeric"
          />
        </View>

        {/* 13. 마이크로칩 번호 */}
        <View style={styles.inputCard}>
          <Ionicons name="hardware-chip-outline" size={20} color="#7F7F7F" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="내장형 마이크로칩 번호"
            placeholderTextColor="#A2A2A2"
            value={microchipNumber}
            onChangeText={setMicrochipNumber}
          />
        </View>

        {/* 14. 메모 */}
        <View style={[styles.inputCard, styles.notesCard]}>
          <Ionicons name="reader-outline" size={20} color="#7F7F7F" style={[styles.inputIcon, styles.notesIcon]} />
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="특이사항 및 메모 (성격 등)"
            placeholderTextColor="#A2A2A2"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* 15. 최종 등록/수정 버튼 */}
        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.registerButtonText}>
              {isEditMode ? "정보 수정 완료하기" : "반려동물 등록하기"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {showBirthPicker && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate) : new Date()}
          mode="date"
          display="default"
          onChange={onBirthChange}
          maximumDate={new Date()}
          locale="ko-KR"
        />
      )}

      {showAdoptionPicker && (
        <DateTimePicker
          value={adoptionDate ? new Date(adoptionDate) : new Date()}
          mode="date"
          display="default"
          onChange={onAdoptionChange}
          maximumDate={new Date()}
          locale="ko-KR"
        />
      )}
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
  imagePickerSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  photoBox: {
    width: 130,
    height: 130,
    borderRadius: 28,
    backgroundColor: "#E2EEFF", // 시안 연파랑 배경
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C5DCFF",
  },
  selectedPhoto: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoPlaceholderText: {
    color: "#4A90E2",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 12,
  },
  segmentContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5ECE2",
    borderRadius: 16,
    overflow: "hidden",
    height: 52,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  segmentButtonActive: {
    backgroundColor: "#FFE5D9", // 활성화 살구색 배경
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#7F7F7F",
  },
  segmentTextActive: {
    color: "#1E1E1E",
    fontWeight: "700",
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F5F2", // 포근한 연베이지 톤
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 16,
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
  colorPalette: {
    paddingVertical: 4,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  switchCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3ECE5", // 한 단계 딥한 베이지 톤
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 24,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#3C2F2F",
    marginBottom: 4,
  },
  switchSubTitle: {
    fontSize: 12,
    color: "#8E7D7D",
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3ECE5",
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 70,
    marginBottom: 16,
  },
  dateIcon: {
    marginRight: 16,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: "#8E7D7D",
    marginBottom: 4,
    fontWeight: "600",
  },
  dateValue: {
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "bold",
  },
  placeholderText: {
    color: "#A2A2A2",
    fontWeight: "normal",
  },
  dateInput: {
    fontSize: 16,
    color: "#3C2F2F",
    fontWeight: "bold",
    padding: 0,
  },
  calendarButton: {
    padding: 8,
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
  registerButton: {
    backgroundColor: "#E07A2F", // 시안의 오렌지색 등록 버튼
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#E07A2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
});
