import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WeatherResponse {
    temp: number;
    icon: string;
    description: string;
    timezone: string;
}

export function useWeather(onTimeZoneDetected?: (tz: string) => void, language?: string, owmApiKey?: string) {
    const [weather, setWeather] = useState({ temp: 0, icon: "Sun", description: "Loading...", timezone: "" });
    const onTimeZoneDetectedRef = useRef(onTimeZoneDetected);
    useEffect(() => { onTimeZoneDetectedRef.current = onTimeZoneDetected; }, [onTimeZoneDetected]);

    const fetchWeather = useCallback(async () => {
        try {
            // Rust 백엔드를 통해 날씨 및 타임존 데이터를 가져옵니다 (CORS 우회)
            const data = await invoke<WeatherResponse>("get_weather_data", { lang: language ?? "en", owmApiKey: owmApiKey ?? "" });

            const { temp, icon, description, timezone } = data;

            setWeather({
                temp: Math.round(temp),
                icon,
                description: description || timezone,
                timezone,
            });

            // 콜백으로 타임존 정보 전달 (초기 로드 시 AppSettings에 저장)
            if (onTimeZoneDetectedRef.current) {
                onTimeZoneDetectedRef.current(timezone);
            }
        } catch (error) {
            console.error("Weather fetch failed via Rust:", error);
        }
    }, [language, owmApiKey]);

    useEffect(() => {
        fetchWeather();
        const timer = setInterval(fetchWeather, 30 * 60 * 1000); // 30분마다 갱신
        return () => clearInterval(timer);
    }, [fetchWeather]);

    return { weather };
}
