// 알람 음성 재생 관련 유틸리티

// 오디오 객체로 음성 재생
export function playAlarmSound(soundFile: string, loop: boolean = true): HTMLAudioElement {
    const audio = new Audio(`/${soundFile}`);
    audio.loop = loop;
    audio.volume = 0.6;
    audio.play().catch((e) => console.error("Sound play failed:", e));
    return audio;
}

// 오디오 정지
export function stopAlarmSound(audio: HTMLAudioElement | null): void {
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }
}

// 알람 키 생성 (중복 방지)
export function generateAlarmKey(taskId: string, time: string): string {
    return `${taskId}-${time}`;
}

// 알람 시간 계산 (10분 전)
export function calculateAlarmTime(time: string): { hours: number; minutes: number } {
    const [h, m] = time.split(":").map(Number);
    const taskTime = new Date();
    taskTime.setHours(h, m, 0, 0);

    // 10분 전
    taskTime.setMinutes(taskTime.getMinutes() - 10);

    return {
        hours: taskTime.getHours(),
        minutes: taskTime.getMinutes(),
    };
}
