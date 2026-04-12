import { useState, useCallback } from "react";
import axios from "axios";
import { format, addWeeks, parseISO, startOfWeek } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Task, AppSettings } from "../types";
import { DAYS } from "../constants";
import { logDetailedError } from "../utils/error-handling";
import { refreshGoogleToken } from "../utils/google-auth";

const GOOGLE_DAY_MAP: Record<string, string> = {
    Sun: "SU",
    Mon: "MO",
    Tue: "TU",
    Wed: "WE",
    Thu: "TH",
    Fri: "FR",
    Sat: "SA",
};

export function useGoogleSync(currentViewDate: Date, settings: AppSettings, onTokenRefreshed?: (token: string) => void) {
    const [isSyncing, setIsSyncing] = useState(false);
    const userTimeZone = settings.userTimeZone;

    const refreshAccessToken = useCallback(async () => {
        if (!settings.googleRefreshToken) return null;
        try {
            return await refreshGoogleToken(settings.googleRefreshToken, settings.googleClientId || "", settings.googleClientSecret || "");
        } catch (error) {
            logDetailedError("Refresh access token", error);
            return null;
        }
    }, [settings.googleRefreshToken, settings.googleClientId, settings.googleClientSecret]);

    // 401 시 자동으로 토큰 갱신 후 재시도하는 헬퍼
    const withTokenRefresh = useCallback(async <T>(fn: (token: string) => Promise<T>): Promise<T | null> => {
        const token = settings.googleAccessToken;
        if (!token) return null;
        try {
            return await fn(token);
        } catch (e: any) {
            if (e.response?.status === 401) {
                const newToken = await refreshGoogleToken(settings.googleRefreshToken || "", settings.googleClientId || "", settings.googleClientSecret || "");
                if (newToken) {
                    onTokenRefreshed?.(newToken);
                    return await fn(newToken);
                }
            }
            throw e;
        }
    }, [settings.googleAccessToken, settings.googleRefreshToken, onTokenRefreshed]);

    const syncWithGoogle = useCallback(
        async (token?: string) => {
            const accessToken = token || settings.googleAccessToken;
            if (!accessToken || !settings.isGoogleConnected) return null;

            setIsSyncing(true);
            try {
                const weekStart = startOfWeek(currentViewDate, { weekStartsOn: 0 });
                const timeMin = weekStart.toISOString();
                const timeMax = addWeeks(weekStart, 1).toISOString();

                const allEvents: { event: any; calendarName: string; calendarColor: string; isHolidayEvent: boolean }[] = [];
                let calendars: any[] = [];

                // 언어별 허용 공휴일 캘린더 prefix
                const holidayPrefix: Record<string, string> = { ko: "ko.", ja: "ja.", en: "en." };
                const allowedHolidayPrefix = holidayPrefix[settings.language] || "";

                const isHolidayCalendar = (id: string) => id.includes("#holiday@group.v.calendar.google.com");
                const isAllowedHoliday = (id: string) => isHolidayCalendar(id) && id.startsWith(allowedHolidayPrefix);

                // 모든 캘린더 목록 가져오기 시도 (실패 시 primary만 사용)
                try {
                    const calendarsResponse = await axios.get("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
                        params: { showHidden: false, minAccessRole: "reader" },
                        headers: { Authorization: `Bearer ${accessToken}` },
                    });
                    calendars = calendarsResponse.data.items || [];
                } catch (e: any) {
                    if (e.response?.status === 401) throw new Error("UNAUTHORIZED");
                    console.warn("CalendarList API failed, using primary calendar only", e);
                    calendars = [{ id: "primary", summary: "Primary", backgroundColor: "#4285f4" }];
                }

                // 각 캘린더에서 이벤트 가져오기 (언어에 맞지 않는 공휴일 캘린더 제외)
                for (const calendar of calendars) {
                    if (isHolidayCalendar(calendar.id) && !isAllowedHoliday(calendar.id)) continue;

                    try {
                        const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendar.id)}/events`, {
                            params: { timeMin, timeMax, singleEvents: true, orderBy: "startTime" },
                            headers: { Authorization: `Bearer ${accessToken}` },
                        });
                        const items = response.data.items || [];
                        const isHoliday = isAllowedHoliday(calendar.id);
                        for (const event of items) {
                            allEvents.push({
                                event,
                                calendarName: calendar.summary || "",
                                calendarColor: calendar.backgroundColor || "#4285f4",
                                isHolidayEvent: isHoliday,
                            });
                        }
                    } catch (e: any) {
                        if (e.response?.status === 401) throw new Error("UNAUTHORIZED");
                        console.warn(`Failed to sync calendar: ${calendar.id}`, e);
                    }
                }

                const googleEvents: Task[] = allEvents.map(({ event, calendarName, calendarColor, isHolidayEvent }) => {
                    const isRecurring = !!event.recurringEventId;
                    const masterId = event.recurringEventId || event.id;

                    const eventStart = event.start.dateTime || event.start.date;
                    const eventDate = parseISO(eventStart);
                    const zonedDate = toZonedTime(eventDate, userTimeZone);

                    return {
                        id: event.id,
                        googleEventId: masterId,
                        text: event.summary,
                        time: format(zonedDate, "HH:mm"),
                        date: format(zonedDate, "yyyy-MM-dd"),
                        day: DAYS[zonedDate.getDay()],
                        isRecurring,
                        recurrenceType: isRecurring ? "weekly" : undefined,
                        calendarName,
                        calendarColor,
                        isHolidayEvent,
                    };
                });
                return googleEvents;
            } catch (e: any) {
                if (e.response?.status === 401) throw new Error("UNAUTHORIZED");
                return null;
            } finally {
                setIsSyncing(false);
            }
        },
        [currentViewDate, settings.googleAccessToken, settings.isGoogleConnected, userTimeZone],
    );

    const createGoogleEvent = async (task: Task) => {
        if (!settings.googleAccessToken || !settings.isGoogleConnected) return null;
        const datePart = task.date || format(new Date(), "yyyy-MM-dd");
        const [h, m] = task.time.split(":");
        const startStr = `${datePart}T${h}:${m}:00`;
        const endStr = `${datePart}T${(Number.parseInt(h) + 1).toString().padStart(2, "0")}:${m}:00`;
        const eventBody: any = {
            summary: task.text,
            start: { dateTime: startStr, timeZone: userTimeZone },
            end: { dateTime: endStr, timeZone: userTimeZone },
        };
        if (task.isRecurring) {
            eventBody.recurrence = [`RRULE:FREQ=WEEKLY;INTERVAL=${task.recurrenceType === "biweekly" ? "2" : "1"};BYDAY=${GOOGLE_DAY_MAP[task.day]}`];
        }
        try {
            const res = await withTokenRefresh((token) =>
                axios.post("https://www.googleapis.com/calendar/v3/calendars/primary/events", eventBody, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
            return res?.data.id ?? null;
        } catch (e: any) {
            console.error("Create Google Event Error:", e.response?.data || e);
            return null;
        }
    };

    const updateGoogleEvent = async (task: Task) => {
        if (!settings.googleAccessToken || !task.googleEventId) return;
        const datePart = task.date || format(new Date(), "yyyy-MM-dd");
        const [h, m] = task.time.split(":");
        const startStr = `${datePart}T${h}:${m}:00`;
        const endStr = `${datePart}T${(Number.parseInt(h) + 1).toString().padStart(2, "0")}:${m}:00`;
        const eventBody: any = {
            summary: task.text,
            start: { dateTime: startStr, timeZone: userTimeZone },
            end: { dateTime: endStr, timeZone: userTimeZone },
            recurrence: task.isRecurring
                ? [`RRULE:FREQ=WEEKLY;INTERVAL=${task.recurrenceType === "biweekly" ? "2" : "1"};BYDAY=${GOOGLE_DAY_MAP[task.day]}`]
                : null,
        };
        try {
            await withTokenRefresh((token) =>
                axios.patch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${task.googleEventId}`, eventBody, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
        } catch (e: any) {
            console.error("Update Google Event Error:", e.response?.data || e);
        }
    };

    const deleteGoogleEvent = async (googleEventId: string) => {
        if (!settings.googleAccessToken) return;
        try {
            await withTokenRefresh((token) =>
                axios.delete(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
            );
        } catch (e: any) {
            console.error("Delete Google Event Error:", e.response?.data || e);
        }
    };

    return { isSyncing, syncWithGoogle, refreshAccessToken, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent };
}
