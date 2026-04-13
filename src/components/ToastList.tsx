import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";
import { Toast } from "../hooks/useToast";

interface ToastListProps {
    toasts: Toast[];
}

const icons = {
    success: <CheckCircle size={16} className="text-emerald-400 shrink-0" />,
    error: <XCircle size={16} className="text-rose-400 shrink-0" />,
    info: <Info size={16} className="text-blue-400 shrink-0" />,
};

const colors = {
    success: "border-emerald-500/30 bg-emerald-500/10",
    error: "border-rose-500/30 bg-rose-500/10",
    info: "border-blue-500/30 bg-blue-500/10",
};

export function ToastList({ toasts }: ToastListProps) {
    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9998] flex flex-col gap-2 items-center pointer-events-none">
            <AnimatePresence>
                {toasts.map((t) => (
                    <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border backdrop-blur-xl text-[12px] font-semibold text-white shadow-xl ${colors[t.type]}`}
                    >
                        {icons[t.type]}
                        {t.message}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
