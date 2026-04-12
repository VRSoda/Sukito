// 설정 상태 관리 Hook

import { useState, useCallback, useEffect } from "react";
import { AppSettings } from "../types";
import { getDefaultSettings, loadSettingsFromStorage, saveSettingsToStorage, updateTimezoneInSettings } from "../services/settingsService";

const TEMP_DEFAULT: AppSettings = {
    language: "en",
    userTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    opacity: 0.6,
    selectedSound: "",
    isGoogleConnected: false,
    googleAccessToken: "",
    googleRefreshToken: "",
    googleClientId: "",
    googleClientSecret: "",
    owmApiKey: "",
    alwaysOnTop: false,
    autostart: false,
    isLocked: false,
};

export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage() || TEMP_DEFAULT);

    // 저장된 설정이 없을 때만 시스템 언어로 초기화
    useEffect(() => {
        if (loadSettingsFromStorage()) return;
        getDefaultSettings().then((defaults) => {
            setSettings(defaults);
        });
    }, []);

    // 설정 업데이트
    const updateSettings = useCallback(
        (newSettings: Partial<AppSettings>) => {
            setSettings((prev) => {
                const updated = { ...prev, ...newSettings };
                saveSettingsToStorage(updated);
                return updated;
            });
        },
        [],
    );

    // 타임존 업데이트
    const updateTimeZone = useCallback(
        (tz: string) => {
            setSettings((prev) => {
                const updated = updateTimezoneInSettings(prev, tz);
                saveSettingsToStorage(updated);
                return updated;
            });
        },
        [],
    );

    // 설정 리셋
    const resetSettings = useCallback(async () => {
        const defaults = await getDefaultSettings();
        setSettings(defaults);
        saveSettingsToStorage(defaults);
    }, []);

    return { settings, updateSettings, updateTimeZone, resetSettings };
}
