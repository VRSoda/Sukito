import { motion } from "framer-motion";
import { BellOff } from "lucide-react";
import { Task } from "../types";
import { differenceInSeconds } from "date-fns";
import { useEffect, useState, useCallback } from "react";

interface TaskItemProps {
    readonly task: Task;
    readonly onDoubleClick: () => void;
    readonly isTodayColumn: boolean;
    readonly isHoliday?: boolean;
}

export function TaskItem({ task, onDoubleClick, isTodayColumn, isHoliday }: TaskItemProps) {
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const googleColor = task.googleEventId ? "bg-emerald-400/60" : "bg-accent/60";
    const indicatorColor = isHoliday ? "bg-rose-500/60" : googleColor;
    const indicatorStyle = task.calendarColor ? { backgroundColor: task.calendarColor, opacity: 0.75 } : undefined;

    const calculateTimeLeft = useCallback(() => {
        if (!isTodayColumn) return null;

        const now = new Date();
        const [hours, minutes] = task.time.split(":").map(Number);
        const taskTime = new Date();
        taskTime.setHours(hours, minutes, 0, 0);

        const diffSec = differenceInSeconds(taskTime, now);

        if (diffSec > 0) {
            const hh = Math.floor(diffSec / 3600);
            const mm = Math.floor((diffSec % 3600) / 60);
            const ss = diffSec % 60;

            // 1시간 이상 남았으면 HH:mm:ss, 1시간 미만이면 mm:ss
            if (hh > 0) {
                return `${hh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
            }
            return `${mm.toString().padStart(2, "0")}:${ss.toString().padStart(2, "0")}`;
        }
        return null;
    }, [task.time, isTodayColumn]);

    useEffect(() => {
        if (isTodayColumn) {
            setTimeLeft(calculateTimeLeft());
            const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000); // 1초마다 업데이트
            return () => clearInterval(timer);
        }
    }, [calculateTimeLeft, isTodayColumn]);

    return (
        <motion.div layout onDoubleClick={onDoubleClick} className="group/item relative flex items-start gap-2.5 p-2.5 mx-1 rounded-xl cursor-pointer transition-all hover:bg-white/[0.04]">
            <div className={`mt-1 w-[1.5px] h-2.5 rounded-full transition-all group-hover/item:brightness-125 ${indicatorStyle ? "" : indicatorColor}`} style={indicatorStyle} />
            <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-semibold leading-tight break-words tracking-tight text-white/70 group-hover/item:text-white transition-colors">{task.text}</p>
                {!isHoliday && (
                    <div className="flex items-center gap-2 mt-0.5 opacity-40">
                        <span className="text-[8px] font-bold tracking-wider tabular-nums">{task.time}</span>
                        {task.alarmEnabled === false && <BellOff size={8} className="text-white/50" />}
                        {timeLeft && <span className="text-[8px] font-black text-accent uppercase tracking-[0.1em] bg-accent/10 px-1.5 py-0.5 rounded-[4px] tabular-nums">{timeLeft}</span>}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
