import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 앱이 포그라운드(실행 중) 상태일 때도 알림을 화면에 띄우도록 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * 사용자에게 알림 권한을 요청합니다.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

/**
 * 특정 Todo/Routine에 대해 로컬 알림을 예약합니다.
 * @param todoId 일정/루틴 ID
 * @param title 알림 제목
 * @param body 알림 상세 내용
 * @param dateStr 일정/루틴 기준 날짜 (YYYY-MM-DD)
 * @param timeStr 일정/루틴 기준 시간 (HH:MM:SS)
 * @param offsetMinutes 기준 시간 몇 분 전에 알림을 울릴지 (예: 5, 10, 30, 60, 1440 등)
 */
export async function scheduleTodoNotification(
  todoId: number,
  title: string,
  body: string,
  dateStr: string,
  timeStr: string | null,
  offsetMinutes: number
): Promise<string | null> {
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log("Notification permission not granted");
      return null;
    }

    // 먼저 기존에 예약된 알림이 있다면 안전하게 취소
    await cancelTodoNotification(todoId);

    // 날짜 및 시간 파싱
    const parts = dateStr.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const targetDate = new Date(year, month, day);

    if (timeStr) {
      const timeParts = timeStr.split(":");
      targetDate.setHours(parseInt(timeParts[0], 10));
      targetDate.setMinutes(parseInt(timeParts[1], 10));
      targetDate.setSeconds(0);
    } else {
      // 시간 미지정 시 오전 9시 기준으로 예약
      targetDate.setHours(9);
      targetDate.setMinutes(0);
      targetDate.setSeconds(0);
    }

    // 알림 시점 계산 (기준 시간 - offsetMinutes)
    const alarmTimeMs = targetDate.getTime() - offsetMinutes * 60 * 1000;
    let alarmDate = new Date(alarmTimeMs);

    // 현재 시간보다 과거인 경우 처리
    if (alarmDate.getTime() <= Date.now()) {
      // 만약 일정 기준 시간(targetDate) 자체가 이미 완전히 지난 과거라면 예약하지 않음
      if (targetDate.getTime() <= Date.now()) {
        console.log("Both alarm time and target date are in the past, skipping:", alarmDate.toString());
        return null;
      }
      
      // 일정 자체는 미래인데 알림 시점만 과거가 된 경우,
      // 사용자가 방금 등록하여 바로 확인/테스트할 수 있도록 현재 시간 기준 5초 뒤에 즉시 울리도록 예약
      console.log("Alarm time was in the past but target date is in the future. Adjusting alarm to 5 seconds from now.");
      alarmDate = new Date(Date.now() + 5000);
    }

    // 안드로이드 채널 설정
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("pet-diary-alarms", {
        name: "반려동물 다이어리 알람",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#E07A5F",
      });
    }

    const identifier = `todo_alarm_${todoId}`;
    
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `🐾 ${title}`,
        body: body || "오늘 예정된 일정이 있습니다. 확인해 보세요!",
        sound: true,
        android: {
          channelId: "pet-diary-alarms",
        },
      },
      trigger: alarmDate,
    });

    console.log(`Successfully scheduled notification ${identifier} for ${alarmDate.toString()}`);
    return identifier;
  } catch (error) {
    console.error("Failed to schedule notification:", error);
    return null;
  }
}

/**
 * 특정 Todo/Routine에 대해 예약된 로컬 알림을 취소합니다.
 */
export async function cancelTodoNotification(todoId: number): Promise<void> {
  try {
    const identifier = `todo_alarm_${todoId}`;
    await Notifications.cancelScheduledNotificationAsync(identifier);
    console.log(`Cancelled scheduled notification ${identifier}`);
  } catch (error) {
    console.error(`Failed to cancel notification for todo ${todoId}:`, error);
  }
}
