// Google 인증 Hook

import { useCallback, useState } from "react";
import { AppSettings } from "../types";
import { googleOAuthLogin } from "../utils/google-auth";

interface UseGoogleAuthProps {
    settings: AppSettings;
    onSettingsUpdate: (settings: Partial<AppSettings>) => void;
    onSyncGoogle: (accessToken: string) => void;
    onError?: (msg: string) => void;
}

export function useGoogleAuth({ settings, onSettingsUpdate, onSyncGoogle, onError }: UseGoogleAuthProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    // Google 로그인 - 브라우저 팝업 → 자동 콜백 캡처
    const handleGoogleLogin = useCallback(async () => {
        try {
            setIsSyncing(true);
            const tokens = await googleOAuthLogin();

            if (tokens?.access_token) {
                onSettingsUpdate({
                    isGoogleConnected: true,
                    googleAccessToken: tokens.access_token,
                    googleRefreshToken: tokens.refresh_token || "",
                });
                onSyncGoogle(tokens.access_token);
            } else {
                onError?.("Google 로그인에 실패했어요.");
            }
        } catch (error) {
            console.error("Google login failed:", error);
            onError?.("Google 로그인에 실패했어요.");
        } finally {
            setIsSyncing(false);
        }
    }, [onSettingsUpdate, onSyncGoogle]);

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
