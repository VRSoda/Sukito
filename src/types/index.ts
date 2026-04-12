export interface Task {
    id: string;
    googleEventId?: string;
    text: string;
    time: string;
    day: string;
    date?: string;
    isRecurring: boolean;
    recurrenceType?: "weekly" | "biweekly";
    alarmEnabled?: boolean;
    calendarName?: string;
    calendarColor?: string;
    isHolidayEvent?: boolean;
}

export interface AppSettings {
    alwaysOnTop: boolean;
    opacity: number;
    isLocked: boolean;
    autostart: boolean;
    isGoogleConnected: boolean;
    googleAccessToken?: string;
    googleRefreshToken?: string;
    owmApiKey?: string;
    selectedSound: string;
    language: "ko" | "ja" | "en";
    userTimeZone: string;
}
