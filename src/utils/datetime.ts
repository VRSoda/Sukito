// 날짜/시간 관련 유틸리티 함수들

import { format, addDays, startOfMonth, getDay, differenceInWeeks } from "date-fns";
import { ko, ja, enUS, type Locale } from "date-fns/locale";

type SupportedLocale = "ko" | "ja" | "en";

export const LOCALE_MAP: Record<SupportedLocale, Locale> = {
    ko,
    ja,
    en: enUS,
};

/**
 * 주의 일요일(weekStart)로부터 목요일을 구하고,
 * 그 목요일이 속한 달의 주차를 반환합니다.
 * (주 시작: 일요일, 달 귀속 기준: 목요일)
 */
function getThursdayInfo(weekStart: Date): { thursday: Date; weekNum: number } {
    // 이 주의 목요일 (일요일 + 4일)
    const thursday = addDays(weekStart, 4);

    // 목요일이 속한 달의 1일
    const monthStart = startOfMonth(thursday);

    // 해당 달의 첫 번째 목요일까지 남은 날 수
    const daysToFirstThursday = (4 - getDay(monthStart) + 7) % 7;
    const firstThursday = addDays(monthStart, daysToFirstThursday);

    // 첫 번째 주의 일요일
    const firstWeekStart = addDays(firstThursday, -4);

    // 주차 = 첫 주 일요일로부터 몇 주 지났는지 + 1
    const weekNum = differenceInWeeks(weekStart, firstWeekStart) + 1;

    return { thursday, weekNum };
}

// 월 레이블 가져오기 (목요일 기준 달)
export function getMonthLabel(weekStart: Date, language: SupportedLocale): string {
    const { thursday } = getThursdayInfo(weekStart);
    const month = format(thursday, "M");
    const labels: Record<string, string> = {
        ko: `${month}월`,
        ja: `${month}月`,
        en: monthNames[Number.parseInt(month) - 1],
    };
    return labels[language] || `${month}`;
}

// 주 텍스트 가져오기 (목요일 기준 달의 주차)
export function getWeekText(weekStart: Date, language: SupportedLocale): string {
    const { weekNum } = getThursdayInfo(weekStart);
    const labels: Record<string, string> = {
        ko: `${weekNum}주차`,
        ja: `第${weekNum}週`,
        en: `Week ${weekNum}`,
    };
    return labels[language] || `Week ${weekNum}`;
}

// 목요일 날짜 반환 (Header 월 표시용)
export function getThursdayOfWeek(weekStart: Date): Date {
    return addDays(weekStart, 4);
}

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ISO 형식으로 날짜 포맷
export function formatDateISO(date: Date): string {
    return format(date, "yyyy-MM-dd");
}

// HH:mm 형식으로 시간 포맷
export function formatTimeHHMM(date: Date): string {
    return format(date, "HH:mm");
}
