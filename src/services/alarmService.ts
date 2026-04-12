// 알람 발송 서비스

import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { getCurrentWindow, UserAttentionType } from "@tauri-apps/api/window";

// 시스템 알림 권한 확인 및 요청
export async function requestNotificationPermission(): Promise<boolean> {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
        permissionGranted = (await requestPermission()) === "granted";
    }
    return permissionGranted;
}

// 시스템 알림 발송
export async function sendSystemNotification(title: string, body: string): Promise<void> {
    const permissionGranted = await requestNotificationPermission();
    if (permissionGranted) {
        sendNotification({ title, body });
    }
}

// 사용자 주의 요청 (창 깜빡임 등)
export async function requestUserAttention(): Promise<void> {
    const appWindow = getCurrentWindow();
    await appWindow.requestUserAttention(UserAttentionType.Critical);
}

// 알림 전체 프로세스 (깜빡임 + 소리 + 토스트)
export async function triggerFullNotification(title: string, body: string): Promise<void> {
    await Promise.all([requestUserAttention(), sendSystemNotification(title, body)]);
}
