// Google OAuth 관련 유틸리티

import { invoke } from "@tauri-apps/api/core";

export interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
}

// Tauri 백엔드에서 로컬 서버로 OAuth 콜백 자동 캡처
export async function googleOAuthLogin(lang?: string): Promise<GoogleTokens | null> {
    try {
        const result = await invoke<GoogleTokens>("google_oauth_login", { lang });
        return result;
    } catch (error) {
        console.error("Google OAuth login failed:", error);
        return null;
    }
}

export async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
    try {
        const accessToken = await invoke<string>("google_refresh_token", { refreshToken });
        return accessToken;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
    }
}
