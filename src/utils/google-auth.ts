// Google OAuth 관련 유틸리티

import { invoke } from "@tauri-apps/api/core";

export interface GoogleTokens {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
}

// Tauri 백엔드에서 로컬 서버로 OAuth 콜백 자동 캡처
export async function googleOAuthLogin(clientId: string, clientSecret: string): Promise<GoogleTokens | null> {
    try {
        const result = await invoke<GoogleTokens>("google_oauth_login", { clientId, clientSecret });
        return result;
    } catch (error) {
        console.error("Google OAuth login failed:", error);
        return null;
    }
}

// Rust 백엔드에서 리프레시 토큰으로 새 액세스 토큰 획득
export async function refreshGoogleToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string | null> {
    try {
        const accessToken = await invoke<string>("google_refresh_token", { refreshToken, clientId, clientSecret });
        return accessToken;
    } catch (error) {
        console.error("Failed to refresh token:", error);
        return null;
    }
}
