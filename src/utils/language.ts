import { invoke } from "@tauri-apps/api/core";

export type SupportedLanguage = "ko" | "ja" | "en";

export async function getSystemLanguage(): Promise<SupportedLanguage> {
    try {
        const lang = await invoke<string>("get_system_language");
        return lang as SupportedLanguage;
    } catch {
        return "en";
    }
}

// 언어 코드를 표시 이름으로 변환
export function getLanguageName(lang: SupportedLanguage): string {
    const names = {
        ko: "한국어",
        ja: "日本語",
        en: "English",
    };
    return names[lang];
}
