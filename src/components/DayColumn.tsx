import { AnimatePresence } from "framer-motion";
import { format, isToday } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { Task, AppSettings } from "../types";
import { TaskItem } from "./TaskItem";
import { Plus } from "lucide-react";
import { TRANSLATIONS, HOLIDAY_KEYWORDS } from "../constants";

const LOCALE_MAP = { ko, ja, en: enUS };

interface DayColumnProps {
    readonly day: string;
    readonly date: Date;
    readonly tasks: Task[];
    readonly isLast: boolean;
    readonly settings: AppSettings;
    readonly onAddTask: () => void;
    readonly onEditTask: (task: Task) => void;
}

export function DayColumn({ day, date, tasks, isLast, settings, onAddTask, onEditTask }: DayColumnProps) {
    const isTodayFlag = isToday(date);
    const t = TRANSLATIONS[settings.language || "ko"];
    const currentLocale = LOCALE_MAP[settings.language || "ko"];

    const isSunday = day === "Sun";
    const isSaturday = day === "Sat";
    const languageKey = settings.language || "ko";
    const holidayKeywords = HOLIDAY_KEYWORDS[languageKey] || [];
    const isHolidayTask = (task: Task) => task.isHolidayEvent || holidayKeywords.some((keyword) => task.text.includes(keyword));
    const hasHolidayTask = tasks.some(isHolidayTask);
    const isRedDay = isSunday || hasHolidayTask;

    const getDayNumberColor = (): string => {
        if (isRedDay) return isTodayFlag ? "text-rose-400" : "text-rose-500/80";
        if (isSaturday) return isTodayFlag ? "text-blue-300" : "text-blue-400/80";
        if (isTodayFlag) return "text-accent";
        return "text-white/70 group-hover/date:text-white";
    };

    const getDayLabelColor = (): string => {
        if (isRedDay) return "text-rose-500/50";
        if (isSaturday) return "text-blue-400/50";
        return "text-white/40 group-hover/date:text-white/70";
    };

    return (
        <div className={`flex-1 flex flex-col min-w-0 border-white/5 transition-all ${isLast ? "" : "border-r"} ${isTodayFlag ? "bg-accent/[0.05] border-t-2 border-t-accent/60" : "hover:bg-white/[0.01] border-t-2 border-t-transparent"}`}>
            <button onClick={onAddTask} className="pt-6 pb-3 px-4 flex items-baseline gap-2 cursor-pointer group/date border-b border-white/[0.03] bg-transparent border-0 w-full text-left">
                <span className={`text-sm font-black tracking-tight transition-all leading-none ${getDayNumberColor()}`}>{format(date, "d")}</span>
                <span className={`text-sm font-black tracking-tight transition-colors ${getDayLabelColor()}`}>({format(date, "EEE", { locale: currentLocale })})</span>
            </button>

            <div className="flex-1 overflow-y-auto px-1 pt-2 pb-4 no-scrollbar relative">
                <AnimatePresence>
                    {tasks.map((task) => (
                        <div key={task.id} onClick={(e) => e.stopPropagation()} role="none">
                            <TaskItem task={task} onDoubleClick={() => onEditTask(task)} isTodayColumn={isTodayFlag} isHoliday={isHolidayTask(task)} />
                        </div>
                    ))}
                </AnimatePresence>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddTask();
                    }}
                    className={`mt-1 mx-2 py-3 rounded-lg border border-dashed border-white/[0.02] flex items-center justify-start px-3 transition-all hover:border-white/10 hover:bg-white/[0.02] group/add ${tasks.length === 0 ? "opacity-30" : "opacity-0 hover:opacity-100"}`}
                >
                    <span className="text-[9px] text-white/30 font-black uppercase tracking-[0.2em] italic group-hover/add:text-white/60 flex items-center gap-2">
                        {tasks.length === 0 ? (
                            t.free
                        ) : (
                            <>
                                <Plus size={10} /> {t.addEvent}
                            </>
                        )}
                    </span>
                </button>
            </div>
        </div>
    );
}
