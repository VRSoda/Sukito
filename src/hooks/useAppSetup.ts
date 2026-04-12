// 앱 초기화 Hook

import { useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../types";
import { logDetailedError } from "../utils/error-handling";
import { refreshGoogleToken } from "../utils/google-auth";

interface UseAppSetupProps {
    onLoadTasks: () => Promise<any>;
    onSettingsLoaded: (settings: Partial<AppSettings>) => void;
    onGoogleSync: (accessToken: string) => void;
}

export function useAppSetup({ onLoadTasks, onSettingsLoaded, onGoogleSync }: UseAppSetupProps) {
    const initializeApp = useCallback(async () => {
        try {
            await onLoadTasks();

            const saved = localStorage.getItem("glassy_settings");
            if (!saved) return;

            const parsed: AppSettings = JSON.parse(saved);
            onSettingsLoaded(parsed);

            if (parsed.alwaysOnTop) {
                await invoke("set_always_on_top", { alwaysOnTop: true });
            }

            // Google 연동 상태라면 토큰 갱신 후 동기화
            if (parsed.isGoogleConnected && parsed.googleRefreshToken) {
                const newToken = await refreshGoogleToken(parsed.googleRefreshToken);
                if (newToken) {
                    // 갱신된 토큰을 저장하고 동기화
                    onSettingsLoaded({ googleAccessToken: newToken });
                    onGoogleSync(newToken);
                } else {
                    // 갱신 실패 시 연결 해제
                    onSettingsLoaded({ isGoogleConnected: false, googleAccessToken: "", googleRefreshToken: "" });
                }
            }
        } catch (error) {
            logDetailedError("App initialization", error);
        }
    }, [onLoadTasks, onSettingsLoaded, onGoogleSync]);

    useEffect(() => {
        initializeApp();
    }, []);

    return { initializeApp };
}
