// 주간 뷰 상태 관리 Hook

import { useState, useEffect, useCallback } from "react";
import { addWeeks, subWeeks, startOfWeek } from "date-fns";
import { SupportedLanguage } from "../utils/language";
import { getMonthLabel, getWeekText, getThursdayOfWeek } from "../utils/datetime";
import { getTimeProgress } from "../utils/timeProgress";

export function useWeekView(initialDate?: Date) {
    const [weekStart, setWeekStart] = useState<Date>(() =>
        startOfWeek(initialDate || new Date(), { weekStartsOn: 0 })
    );
    const [timeProgress, setTimeProgress] = useState({ day: 0, month: 0, year: 0 });

    const goToPreviousWeek = useCallback(() => {
        setWeekStart((prev) => subWeeks(prev, 1));
    }, []);

    const goToNextWeek = useCallback(() => {
        setWeekStart((prev) => addWeeks(prev, 1));
    }, []);

    const goToToday = useCallback(() => {
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
    }, []);

    // 시간 진행도 업데이트
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeProgress(getTimeProgress());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const getViewHeader = useCallback(
        (language: SupportedLanguage) => ({
            monthLabel: getMonthLabel(weekStart, language),
            weekText: getWeekText(weekStart, language),
            // Header의 월 이름 표시용 — 목요일 기준 달
            monthDate: getThursdayOfWeek(weekStart),
        }),
        [weekStart],
    );

    return {
        currentViewDate: weekStart,
        weekStart,
        timeProgress,
        goToPreviousWeek,
        goToNextWeek,
        goToToday,
        getViewHeader,
    };
}
