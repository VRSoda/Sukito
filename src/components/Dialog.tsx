import { motion } from "framer-motion";
import { TRANSLATIONS } from "../constants";

interface DialogProps {
    readonly message: string;
    readonly onConfirm: () => void;
    readonly onCancel?: () => void;
    readonly language?: string;
}

export function Dialog({ message, onConfirm, onCancel, language = "ko" }: DialogProps) {
    const t = TRANSLATIONS[language as keyof typeof TRANSLATIONS] ?? TRANSLATIONS.ko;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-80 shadow-2xl text-white"
            >
                <p className="text-sm font-medium text-white/80 leading-relaxed">{message}</p>
                <div className="flex justify-end gap-2 mt-5">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
                        >
                            {t.cancel}
                        </button>
                    )}
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${onCancel ? "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30" : "bg-accent/20 text-accent hover:bg-accent/30"}`}
                    >
                        {t.confirm}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
