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
        const clientId = settings.googleClientId || "";
        const clientSecret = settings.googleClientSecret || "";
        if (!clientId || !clientSecret) {
            onError?.("Google Client ID와 Client Secret을 설정에서 먼저 입력해 주세요.");
            return;
        }
        try {
            setIsSyncing(true);
            const tokens = await googleOAuthLogin(clientId, clientSecret);

            if (tokens?.access_token) {
                onSettingsUpdate({
                    isGoogleConnected: true,
                    googleAccessToken: tokens.access_token,
                    googleRefreshToken: tokens.refresh_token || "",
                });
                onSyncGoogle(tokens.access_token);
            } else {
                alert("❌ Google 로그인 실패");
            }
        } catch (error) {
            console.error("Google login failed:", error);
            onError?.("Google 로그인에 실패했어요.");
        } finally {
            setIsSyncing(false);
        }
    }, [settings.googleClientId, settings.googleClientSecret, onSettingsUpdate, onSyncGoogle]);

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
