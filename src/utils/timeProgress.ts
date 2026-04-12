import { getDaysInMonth, differenceInDays, startOfYear } from "date-fns";

export function getTimeProgress() {
    const now = new Date();

    // 1. 오늘 진행률
    const secondsInDay = 24 * 60 * 60;
    const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const dayProgress = (currentSeconds / secondsInDay) * 100;

    // 2. 이번 달 진행률
    const daysInMonth = getDaysInMonth(now);
    const currentDayOfMonth = now.getDate();
    const monthProgress = ((currentDayOfMonth - 1 + currentSeconds / secondsInDay) / daysInMonth) * 100;

    // 3. 올해 진행률
    const daysInYear = isLeapYear(now) ? 366 : 365;
    const startOfYearDate = startOfYear(now);
    const diffDays = differenceInDays(now, startOfYearDate);
    const yearProgress = ((diffDays + currentSeconds / secondsInDay) / daysInYear) * 100;

    return {
        day: Math.min(100, Math.max(0, dayProgress)),
        month: Math.min(100, Math.max(0, monthProgress)),
        year: Math.min(100, Math.max(0, yearProgress)),
    };
}

function isLeapYear(date: Date) {
    const year = date.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
