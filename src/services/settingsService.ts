// 설정 저장/로드 서비스

import { AppSettings } from "../types";
import { SOUNDS } from "../constants";
import { getSystemLanguage } from "../utils/language";

const SETTINGS_KEY = "glassy_settings";

// 기본 설정 반환
export async function getDefaultSettings(): Promise<AppSettings> {
    return {
        language: await getSystemLanguage(),
        userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        opacity: 0.6,
        selectedSound: SOUNDS[0].file,
        alarmVolume: 0.5,
        isGoogleConnected: false,
        googleAccessToken: "",
        googleRefreshToken: "",
        owmApiKey: "",
        alwaysOnTop: false,
        autostart: false,
        isLocked: false,
    };
}

// localStorage에서 설정 로드
export function loadSettingsFromStorage(): AppSettings | null {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return null;
        }
    }
    return null;
}

// localStorage에 설정 저장
export function saveSettingsToStorage(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// 모든 설정 삭제
export function clearSettings(): void {
    localStorage.removeItem(SETTINGS_KEY);
}

// 타임존 업데이트
export function updateTimezoneInSettings(settings: AppSettings, timezone: string): AppSettings {
    return { ...settings, userTimeZone: timezone };
}
