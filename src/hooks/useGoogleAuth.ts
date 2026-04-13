// Google 인증 Hook

import { useCallback, useState } from "react";
import { AppSettings } from "../types";
import { googleOAuthLogin } from "../utils/google-auth";
import { TRANSLATIONS } from "../constants";

interface UseGoogleAuthProps {
    lang?: string;
    onSettingsUpdate: (settings: Partial<AppSettings>) => void;
    onSyncGoogle: (accessToken: string) => void;
    onError?: (msg: string) => void;
}

export function useGoogleAuth({ lang, onSettingsUpdate, onSyncGoogle, onError }: UseGoogleAuthProps) {
    const [isSyncing, setIsSyncing] = useState(false);
    const t = TRANSLATIONS[(lang as keyof typeof TRANSLATIONS) || "ko"];

    // Google 로그인 - 브라우저 팝업 → 자동 콜백 캡처
    const handleGoogleLogin = useCallback(async () => {
        try {
            setIsSyncing(true);
            const tokens = await googleOAuthLogin(lang);

            if (tokens?.access_token) {
                onSettingsUpdate({
                    isGoogleConnected: true,
                    googleAccessToken: tokens.access_token,
                    googleRefreshToken: tokens.refresh_token || "",
                });
                onSyncGoogle(tokens.access_token);
            } else {
                onError?.(t.syncFailed);
            }
        } catch (error) {
            console.error("Google login failed:", error);
            onError?.(t.syncFailed);
        } finally {
            setIsSyncing(false);
        }
    }, [onSettingsUpdate, onSyncGoogle, t]);

    // Google 로그아웃
    const handleGoogleLogout = useCallback(async () => {
        onSettingsUpdate({
            isGoogleConnected: false,
            googleAccessToken: "",
            googleRefreshToken: "",
        });
    }, [onSettingsUpdate]);

    return { isSyncing, handleGoogleLogin, handleGoogleLogout };
}
