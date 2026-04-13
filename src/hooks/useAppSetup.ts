// 앱 초기화 Hook

import { useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../types";
import { logDetailedError } from "../utils/error-handling";
import { refreshGoogleToken } from "../utils/google-auth";

const TOKEN_REFRESH_INTERVAL = 50 * 60 * 1000; // 50분 (Google 토큰 만료 1시간 전)

interface UseAppSetupProps {
    onLoadTasks: () => Promise<any>;
    onSettingsLoaded: (settings: Partial<AppSettings>) => void;
    onGoogleSync: (accessToken: string) => void;
    onAuthError?: () => void;
    onTokenRefreshed?: (token: string) => void;
}

export function useAppSetup({ onLoadTasks, onSettingsLoaded, onGoogleSync, onAuthError, onTokenRefreshed }: UseAppSetupProps) {
    const settingsRef = useRef<AppSettings | null>(null);

    const initializeApp = useCallback(async () => {
        try {
            await onLoadTasks();

            const saved = localStorage.getItem("glassy_settings");
            if (!saved) return;

            const parsed: AppSettings = JSON.parse(saved);
            settingsRef.current = parsed;
            onSettingsLoaded(parsed);

            if (parsed.alwaysOnTop) {
                await invoke("set_always_on_top", { alwaysOnTop: true });
            }

            // Google 연동 상태라면 토큰 갱신 후 동기화
            if (parsed.isGoogleConnected && parsed.googleRefreshToken) {
                const newToken = await refreshGoogleToken(parsed.googleRefreshToken);
                if (newToken) {
                    onSettingsLoaded({ googleAccessToken: newToken });
                    onTokenRefreshed?.(newToken);
                    onGoogleSync(newToken);
                } else {
                    onSettingsLoaded({ isGoogleConnected: false, googleAccessToken: "", googleRefreshToken: "" });
                    onAuthError?.();
                }
            }
        } catch (error) {
            logDetailedError("App initialization", error);
        }
    }, [onLoadTasks, onSettingsLoaded, onGoogleSync, onAuthError, onTokenRefreshed]);

    useEffect(() => {
        initializeApp();
    }, []);

    // 50분마다 proactive 토큰 갱신
    useEffect(() => {
        const interval = setInterval(async () => {
            const saved = localStorage.getItem("glassy_settings");
            if (!saved) return;
            const parsed: AppSettings = JSON.parse(saved);
            if (!parsed.isGoogleConnected || !parsed.googleRefreshToken) return;

            const newToken = await refreshGoogleToken(parsed.googleRefreshToken);
            if (newToken) {
                onSettingsLoaded({ googleAccessToken: newToken });
                onTokenRefreshed?.(newToken);
            } else {
                onSettingsLoaded({ isGoogleConnected: false, googleAccessToken: "", googleRefreshToken: "" });
                onAuthError?.();
            }
        }, TOKEN_REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    return { initializeApp };
}
