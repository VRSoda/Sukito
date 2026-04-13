import { motion, AnimatePresence } from "framer-motion";
import { Bell, Clock } from "lucide-react";
import { TRANSLATIONS } from "../constants";

interface NotificationToastProps {
    show: boolean;
    title: string;
    time: string;
    language: "ko" | "ja" | "en";
    onClose: () => void;
}

export function NotificationToast(props: Readonly<NotificationToastProps>) {
    const { show, title, time, language, onClose } = props;
    const t = TRANSLATIONS[language];
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ y: -100, opacity: 0, scale: 0.9, x: "-50%" }}
                    animate={{ y: 20, opacity: 1, scale: 1, x: "-50%" }}
                    exit={{ y: -20, opacity: 0, scale: 0.9, x: "-50%" }}
                    className="fixed top-0 left-1/2 z-[9999] w-[450px]"
                >
                    <div className="bg-[#1a1a1a]/90 backdrop-blur-3xl border border-accent/40 p-5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center border border-accent/30 shrink-0">
                            <Bell size={24} className="text-accent animate-bounce" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-[10px] font-black text-accent uppercase tracking-[0.2em] flex items-center gap-2 mb-1">
                                <Clock size={12} /> {time} · {t.alarmSoon}
                            </h3>
                            <p className="text-base font-bold text-white truncate">{title}</p>
                        </div>
                        <button onClick={onClose} className="px-4 py-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-black text-xs tracking-widest uppercase transition-all border border-accent/20">
                            {t.confirm}
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
