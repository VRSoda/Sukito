// 타임존 관련 유틸리티 함수들
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

// 현재 시간을 특정 타임존으로 변환
export function getCurrentTimeInZone(timezone: string): Date {
    return toZonedTime(new Date(), timezone);
}

// 타임존에 맞는 포맷으로 시간 표시
export function formatTimeInZone(date: Date, timezone: string, format: string): string {
    return formatInTimeZone(date, timezone, format);
}

// 오늘 날짜를 타임존 기준으로 가져오기
export function getTodayDateInZone(timezone: string): string {
    const now = getCurrentTimeInZone(timezone);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// 오늘 요일을 타임존 기준으로 가져오기 (0=일요일)
export function getTodayDayInZone(timezone: string): number {
    const now = getCurrentTimeInZone(timezone);
    return now.getDay();
}

// 자정까지의 시간 체크
export function isMidnight(timezone: string): boolean {
    const timeStr = formatTimeInZone(new Date(), timezone, "HH:mm");
    return timeStr === "00:00";
}
