import React, { useState } from "react";
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
} from "react-native";
import { useAuthStore } from "../../store/useAuthStore";
import { petApi } from "../../api/pet";
import { fileApi } from "../../api/file";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";

export const AddPetScreen = () => {
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [currentWeight, setCurrentWeight] = useState("");
  const [isNeutered, setIsNeutered] = useState<boolean | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const userId = useAuthStore((state) => state.userId);
  const navigation = useNavigation();

  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "권한 필요",
        "프로필 사진을 선택하려면 갤러리 접근 권한이 필요합니다.",
      );
      return;
    }

    // 이미지 선택 및 자동 최적화 (1:1 크롭, 압축)
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

  const handleRegister = async () => {
    if (!name || !userId) {
      Alert.alert("오류", "반려동물 이름은 필수 입력 사항입니다.");
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = undefined;

      // 이미지가 선택되어 있다면 서버에 먼저 업로드
      if (profileImage) {
        console.log('Uploading image...', profileImage);
        const uploadResult = await fileApi.uploadFile(profileImage);
        uploadedImageUrl = uploadResult.url;
        console.log('Upload success:', uploadedImageUrl);
      }

      const petData: PetRequest = {
        name,
        breed,
        birthDate: birthDate || undefined,
        isNeutered: isNeutered === null ? undefined : isNeutered,
        currentWeight: currentWeight ? parseFloat(currentWeight) : undefined,
        profileImageUrl: uploadedImageUrl,
      };

      console.log('Registering pet...', petData);
      await petApi.registerPet(userId, petData);
      Alert.alert('성공', '반려동물이 성공적으로 등록되었습니다.', [
        { text: '확인', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('Failed to register pet:', error);
      console.error('Error detail:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류가 발생했습니다.';
      Alert.alert('등록 실패', `오류 내용: ${errorMsg}`);
    } finally {
      setLoading(false);
    }

  };

  return React.createElement(
    ScrollView,
    { style: styles.container, contentContainerStyle: styles.content },
    React.createElement(Text, { style: styles.title }, "새 아이 등록하기"),
    React.createElement(
      View,
      { style: styles.imagePickerContainer },
      React.createElement(
        TouchableOpacity,
        { style: styles.imagePicker, onPress: pickImage },
        profileImage
          ? React.createElement(Image, {
              source: { uri: profileImage },
              style: styles.selectedImage,
            })
          : React.createElement(
              View,
              { style: styles.imagePlaceholder },
              React.createElement(
                Text,
                { style: styles.imagePlaceholderText },
                "사진 추가",
              ),
            ),
      ),
    ),
    React.createElement(
      View,
      { style: styles.inputGroup },
      React.createElement(Text, { style: styles.label }, "이름 *"),
      React.createElement(TextInput, {
        style: styles.input,
        placeholder: "아이의 이름을 입력하세요",
        value: name,
        onChangeText: setName,
      }),
    ),
    React.createElement(
      View,
      { style: styles.inputGroup },
      React.createElement(Text, { style: styles.label }, "품종"),
      React.createElement(TextInput, {
        style: styles.input,
        placeholder: "예: 푸들, 말티즈, 코리안숏헤어 등",
        value: breed,
        onChangeText: setBreed,
      }),
    ),
    React.createElement(
      View,
      { style: styles.inputGroup },
      React.createElement(Text, { style: styles.label }, "생일 (YYYY-MM-DD)"),
      React.createElement(TextInput, {
        style: styles.input,
        placeholder: "2023-01-01",
        value: birthDate,
        onChangeText: setBirthDate,
        keyboardType: "numeric",
      }),
    ),
    React.createElement(
      View,
      { style: styles.inputGroup },
      React.createElement(Text, { style: styles.label }, "현재 몸무게 (kg)"),
      React.createElement(TextInput, {
        style: styles.input,
        placeholder: "0.0",
        value: currentWeight,
        onChangeText: setCurrentWeight,
        keyboardType: "numeric",
      }),
    ),
    React.createElement(
      View,
      { style: styles.inputGroup },
      React.createElement(Text, { style: styles.label }, "중성화 여부"),
      React.createElement(
        View,
        { style: styles.row },
        React.createElement(
          TouchableOpacity,
          {
            style: [styles.radio, isNeutered === true && styles.radioActive],
            onPress: () => setIsNeutered(true),
          },
          React.createElement(
            Text,
            {
              style: [
                styles.radioText,
                isNeutered === true && styles.radioTextActive,
              ],
            },
            "했음",
          ),
        ),
        React.createElement(
          TouchableOpacity,
          {
            style: [styles.radio, isNeutered === false && styles.radioActive],
            onPress: () => setIsNeutered(false),
          },
          React.createElement(
            Text,
            {
              style: [
                styles.radioText,
                isNeutered === false && styles.radioTextActive,
              ],
            },
            "안 했음",
          ),
        ),
      ),
    ),
    React.createElement(
      TouchableOpacity,
      {
        style: styles.button,
        onPress: handleRegister,
        disabled: loading,
      },
      loading
        ? React.createElement(ActivityIndicator, { color: "#fff" })
        : React.createElement(Text, { style: styles.buttonText }, "등록 완료"),
    ),
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  imagePickerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  imagePicker: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F0F3F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E1E8EE",
    overflow: "hidden",
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#95A5A6",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#2C3E50",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  row: {
    flexDirection: "row",
  },
  radio: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
    marginRight: 10,
  },
  radioActive: {
    backgroundColor: "#4A90E2",
    borderColor: "#4A90E2",
  },
  radioText: {
    color: "#7F8C8D",
    fontSize: 16,
  },
  radioTextActive: {
    color: "#fff",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#4A90E2",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
