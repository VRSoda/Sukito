import { Plus, X, Type, Clock, Trash2, CalendarClock, Bell, BellOff } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AppSettings } from "../../types";
import { DAYS, TRANSLATIONS } from "../../constants";

interface TaskModalProps {
    isOpen: boolean;
    editingTaskId: string | null;
    currentSelectedDate: Date;
    newTaskText: string;
    newTaskTime: string;
    isRecurring: boolean;
    recurrenceType: "weekly" | "biweekly";
    alarmEnabled: boolean;
    settings: AppSettings;
    onClose: () => void;
    onTextChange: (text: string) => void;
    onTimeChange: (time: string) => void;
    onRecurringToggle: (type: "none" | "weekly" | "biweekly") => void;
    onAlarmToggle: (enabled: boolean) => void;
    onSave: () => void;
    onDelete: () => void;
}

export function TaskModal(props: Readonly<TaskModalProps>) {
    const { isOpen, editingTaskId, currentSelectedDate, newTaskText, newTaskTime, isRecurring, recurrenceType, alarmEnabled, settings, onClose, onTextChange, onTimeChange, onRecurringToggle, onAlarmToggle, onSave, onDelete } = props;
    const t = TRANSLATIONS[settings.language || "ko"];

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.98, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="w-[750px] bg-[#121212] p-6 rounded-[28px] border border-white/10 shadow-3xl text-white text-left">
                <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4 px-2 h-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
                            <Plus size={20} className="text-accent" />
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h2 className="text-base font-bold tracking-tight leading-tight">{editingTaskId ? t.editEvent : t.addEvent}</h2>
                            <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
                                {format(currentSelectedDate, "yyyy. MM. dd")} ({DAYS[currentSelectedDate.getDay()]})
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 px-2 items-stretch">
                    <div className="flex flex-col gap-2">
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1 flex flex-col justify-center space-y-2">
                            <div className="flex items-center gap-3">
                                <Type size={16} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.title}</span>
                            </div>
                            <input autoFocus value={newTaskText} onChange={(e) => onTextChange(e.target.value)} placeholder={t.placeholder} className="w-full bg-white/5 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-accent outline-none transition-all" />
                        </div>
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1 flex flex-col justify-center space-y-2">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.time}</span>
                            </div>
                            <input type="time" value={newTaskTime} onChange={(e) => onTimeChange(e.target.value)} className="w-full bg-white/5 border-0 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-accent outline-none transition-all" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1 flex flex-col justify-center space-y-3">
                            <div className="flex items-center gap-3">
                                <CalendarClock size={16} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.repeat}</span>
                            </div>
                            <div className="flex w-full p-1 bg-white/5 rounded-xl gap-1">
                                <button onClick={() => onRecurringToggle("none")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isRecurring ? "text-white/20 hover:text-white/40" : "bg-white/10 text-white"}`}>
                                    {t.none}
                                </button>
                                <button onClick={() => onRecurringToggle("weekly")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isRecurring && recurrenceType === "weekly" ? "bg-accent text-white" : "text-white/20 hover:text-white/40"}`}>
                                    {t.weekly}
                                </button>
                                <button onClick={() => onRecurringToggle("biweekly")} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isRecurring && recurrenceType === "biweekly" ? "bg-accent text-white" : "text-white/20 hover:text-white/40"}`}>
                                    {t.biweekly}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-auto h-12">
                            {editingTaskId && (
                                <button onClick={onDelete} className="w-12 flex items-center justify-center rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/10 transition-all">
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button onClick={() => onAlarmToggle(!alarmEnabled)} className={`w-12 flex items-center justify-center rounded-2xl border transition-all ${alarmEnabled ? "bg-accent/10 text-accent border-accent/20" : "bg-white/5 text-white/20 border-white/10"}`}>
                                {alarmEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                            </button>
                            <button onClick={onSave} className="flex-1 bg-accent hover:brightness-110 text-white font-extrabold rounded-2xl transition-all text-xs shadow-lg shadow-accent/20">
                                {t.save}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
