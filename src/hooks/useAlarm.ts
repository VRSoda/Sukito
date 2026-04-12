// 알람 상태 관리 Hook

import { useState, useRef, useCallback } from "react";
import { playAlarmSound, stopAlarmSound } from "../utils/alarm";

interface ActiveAlarm {
    show: boolean;
    title: string;
    time: string;
}

export function useAlarm(soundFile: string) {
    const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm>({ show: false, title: "", time: "" });
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // 알람 울림
    const startRinging = useCallback(
        (title: string, time: string) => {
            setActiveAlarm({ show: true, title, time });
            audioRef.current = playAlarmSound(soundFile);
        },
        [soundFile],
    );

    // 알람 중지
    const stopRinging = useCallback(() => {
        setActiveAlarm({ show: false, title: "", time: "" });
        stopAlarmSound(audioRef.current);
    }, []);

    // 알람 리셋
    const resetAlarm = useCallback(() => {
        setActiveAlarm({ show: false, title: "", time: "" });
        audioRef.current = null;
    }, []);

    return { activeAlarm, startRinging, stopRinging, resetAlarm };
}
