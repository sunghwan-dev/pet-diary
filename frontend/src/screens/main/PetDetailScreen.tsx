import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import { petApi } from "../../api/pet";
import { PetResponse } from "../../types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { commonStyles } from "../../styles/theme";
import { DetailHeader } from "../../components/DetailHeader";

export const PetDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { petId } = route.params;

  const [pet, setPet] = useState<PetResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPetDetail = async () => {
    try {
      const data = await petApi.getPetDetail(petId);
      setPet(data);
    } catch (error) {
      console.error("Failed to fetch pet detail:", error);
      Alert.alert("오류", "반려동물 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchPetDetail();
    }, [petId])
  );

  const handleDelete = () => {
    Alert.alert(
      "반려동물 삭제",
      `정말로 ${pet?.name}의 정보를 삭제하시겠습니까?\n삭제된 정보는 복구할 수 없습니다.`,
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await petApi.deletePet(petId);
              Alert.alert("성공", "정보가 삭제되었습니다.", [
                { text: "확인", onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error("Failed to delete pet:", error);
              Alert.alert("실패", "삭제 도중 오류가 발생했습니다.");
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // 날짜 한국어 포맷팅 헬퍼
  const formatDateToKorean = (dateStr?: string) => {
    if (!dateStr) return "정보 없음";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return `${year}년 ${month}월 ${day}일`;
  };

  // 나이 계산 헬퍼
  const calculateAge = (birthDateStr?: string) => {
    if (!birthDateStr) return "정보 없음";
    const birthDate = new Date(birthDateStr);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age > 0 ? `${age}살` : "1살 미만";
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E07A2F" />
      </View>
    );
  }

  if (!pet) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>반려동물 정보를 찾을 수 없습니다.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>이전으로</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 대표 컬러 설정
  const activeColor = pet.petTheme || "#E07A2F";

  return (
    <View style={styles.container}>
      <DetailHeader
        title={pet?.name ?? "반려동물 상세"}
        onBackPress={() => navigation.goBack()}
        rightButtons={[
          { name: "pencil", lib: "Ionicons", onPress: () => navigation.navigate("AddPet", { petId: pet.id }) },
          { name: "trash-can-outline", lib: "MaterialCommunityIcons", onPress: handleDelete, color: "#FF5A5F" },
        ]}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 2. 대형 프로필 사진 영역 */}
        <View style={styles.photoContainer}>
          {pet.profileImageUrl ? (
            <Image source={{ uri: pet.profileImageUrl }} style={styles.profilePhoto} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: activeColor + "15" }]}>
              <Ionicons name="paw" size={80} color={activeColor} />
            </View>
          )}
        </View>

        {/* 3. 신상 타이틀 및 한글 종류 뱃지 */}
        <View style={styles.titleSection}>
          <View style={styles.nameContainer}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petBreed}>{pet.breed || "품종 미지정"}</Text>
          </View>
          
          <View style={[styles.typeBadge, { backgroundColor: activeColor + "20" }]}>
            {pet.petType === "CAT" ? (
              <Text style={[styles.typeBadgeText, { color: activeColor }]}>🐈 고양이</Text>
            ) : (
              <Text style={[styles.typeBadgeText, { color: activeColor }]}>🐕 강아지</Text>
            )}
          </View>
        </View>

        {/* 4. 나이 & 성별 2열 카드 그리드 */}
        <View style={styles.gridSection}>
          <View style={[styles.infoCard, { borderColor: activeColor + "30" }]}>
            <MaterialCommunityIcons name="cake-variant-outline" size={28} color={activeColor} style={styles.cardIcon} />
            <Text style={styles.cardValue}>{calculateAge(pet.birthDate)}</Text>
            <Text style={styles.cardLabel}>나이</Text>
          </View>

          <View style={[styles.infoCard, { borderColor: activeColor + "30" }]}>
            {pet.gender === "FEMALE" ? (
              <Ionicons name="female-outline" size={28} color="#FF5A5F" style={styles.cardIcon} />
            ) : (
              <Ionicons name="male-outline" size={28} color="#4A90E2" style={styles.cardIcon} />
            )}
            <Text style={styles.cardValue}>{pet.gender === "FEMALE" ? "여아" : "남아"}</Text>
            <Text style={styles.cardLabel}>성별</Text>
          </View>
        </View>

        {/* 5. 상세 정보 리스트 */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>상세 정보</Text>

          {/* 생년월일 */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="calendar-outline" size={20} color="#3C2F2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>생년월일</Text>
              <Text style={styles.detailValue}>{formatDateToKorean(pet.birthDate)}</Text>
            </View>
          </View>

          {/* 중성화 수술 */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="close-circle-outline" size={20} color="#3C2F2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>중성화 수술</Text>
              <Text style={styles.detailValue}>
                {pet.isNeutered === true ? "완료" : pet.isNeutered === false ? "미완료" : "정보 없음"}
              </Text>
            </View>
          </View>

          {/* 알레르기 */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="warning-outline" size={20} color="#3C2F2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>알레르기</Text>
              <Text style={styles.detailValue}>{pet.allergies || "없음"}</Text>
            </View>
          </View>

          {/* 마이크로칩 번호 */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="hardware-chip-outline" size={20} color="#3C2F2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>내장형 마이크로칩 번호</Text>
              <Text style={styles.detailValue}>{pet.microchipNumber || "등록되지 않음"}</Text>
            </View>
          </View>

          {/* 특이사항 및 메모 */}
          <View style={styles.detailRow}>
            <View style={[styles.detailIconContainer, { backgroundColor: "#F7F5F2" }]}>
              <Ionicons name="reader-outline" size={20} color="#3C2F2F" />
            </View>
            <View style={styles.detailTextContainer}>
              <Text style={styles.detailLabel}>특이사항 및 메모</Text>
              <Text style={[styles.detailValue, styles.notesValue]}>
                {pet.notes || "기록된 특이사항이 없습니다."}
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: "#8E7D7D",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#E07A2F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photoContainer: {
    width: "100%",
    height: 260,
    backgroundColor: "#FDFBF7",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  titleSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  nameContainer: {
    flex: 1,
    marginRight: 16,
  },
  petName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 6,
  },
  petBreed: {
    fontSize: 15,
    color: "#8E7D7D",
  },
  typeBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  gridSection: {
    flexDirection: "row",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  infoCard: {
    flex: 1,
    height: 110,
    backgroundColor: "#FDFBF7", // 2열 라운드 스퀘어 카드 배경
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    shadowColor: "#C4A48A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIcon: {
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3C2F2F",
    marginBottom: 2,
  },
  cardLabel: {
    fontSize: 11,
    color: "#8E7D7D",
    fontWeight: "600",
  },
  detailsSection: {
    paddingHorizontal: 24,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E1E1E",
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  detailTextContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#FDFBF7",
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#8E7D7D",
    marginBottom: 4,
    fontWeight: "600",
  },
  detailValue: {
    fontSize: 15,
    color: "#3C2F2F",
    fontWeight: "bold",
  },
  notesValue: {
    fontWeight: "normal",
    lineHeight: 22,
    color: "#5C4F4F",
  },
});
