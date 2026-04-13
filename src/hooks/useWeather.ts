import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

interface WeatherResponse {
    temp: number;
    icon: string;
    description: string;
    timezone: string;
}

export function useWeather(
    onTimeZoneDetected?: (tz: string) => void,
    language?: string,
    owmApiKey?: string,
    onError?: (type: "missing" | "invalid") => void,
) {
    const [weather, setWeather] = useState({ temp: 0, icon: "Sun", description: "Loading...", timezone: "" });
    const onTimeZoneDetectedRef = useRef(onTimeZoneDetected);
    useEffect(() => { onTimeZoneDetectedRef.current = onTimeZoneDetected; }, [onTimeZoneDetected]);

    const fetchWeather = useCallback(async () => {
        if (!owmApiKey) {
            onError?.("missing");
            return;
        }
        try {
            const data = await invoke<WeatherResponse>("get_weather_data", { lang: language ?? "en", owmApiKey });
            const { temp, icon, description, timezone } = data;
            setWeather({ temp: Math.round(temp), icon, description: description || timezone, timezone });
            if (onTimeZoneDetectedRef.current) onTimeZoneDetectedRef.current(timezone);
        } catch (error: any) {
            const msg = String(error);
            if (msg.includes("401") || msg.includes("Invalid API key") || msg.includes("키 활성화")) {
                onError?.("invalid");
            }
            console.error("Weather fetch failed:", error);
        }
    }, [language, owmApiKey]);

    useEffect(() => {
        fetchWeather();
        const timer = setInterval(fetchWeather, 30 * 60 * 1000);
        return () => clearInterval(timer);
    }, [fetchWeather]);

    return { weather };
}
