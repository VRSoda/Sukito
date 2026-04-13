import { useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

let nextId = 0;

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: ToastType = "info", duration = 3000) => {
        const id = ++nextId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }, []);

    const toast = {
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error", 5000),
        info: (msg: string) => addToast(msg, "info"),
    };

    return { toasts, toast };
}
