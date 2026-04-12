// 태스크 모달 상태 관리 Hook

import { useState, useCallback } from "react";
import { Task } from "../types";
import { format } from "date-fns";

export function useTaskModal() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentSelectedDate, setCurrentSelectedDate] = useState<Date>(new Date());
    const [newTaskText, setNewTaskText] = useState("");
    const [newTaskTime, setNewTaskTime] = useState("12:00");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceType, setRecurrenceType] = useState<"weekly" | "biweekly">("weekly");
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [alarmEnabled, setAlarmEnabled] = useState(true);

    // 모달 열기 (신규 또는 편집)
    const openModal = useCallback((date: Date, task?: Task) => {
        setCurrentSelectedDate(date);

        if (task) {
            setEditingTaskId(task.id);
            setNewTaskText(task.text);
            setNewTaskTime(task.time);
            setIsRecurring(task.isRecurring || false);
            setRecurrenceType(task.recurrenceType || "weekly");
            setAlarmEnabled(task.alarmEnabled !== false);
        } else {
            setEditingTaskId(null);
            setNewTaskText("");
            setNewTaskTime(format(new Date(), "HH:mm"));
            setIsRecurring(false);
            setRecurrenceType("weekly");
            setAlarmEnabled(true);
        }

        setIsModalOpen(true);
    }, []);

    // 모달 닫기 (폼 상태 초기화 포함)
    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setNewTaskText("");
        setNewTaskTime(format(new Date(), "HH:mm"));
        setIsRecurring(false);
        setRecurrenceType("weekly");
        setEditingTaskId(null);
        setAlarmEnabled(true);
    }, []);

    // 반복 설정 변경
    const handleRecurringToggle = useCallback((type: "none" | "weekly" | "biweekly") => {
        if (type === "none") {
            setIsRecurring(false);
        } else {
            setIsRecurring(true);
            setRecurrenceType(type);
        }
    }, []);

    // 태스크 초기화 (리셋)
    const resetForm = useCallback(() => {
        setNewTaskText("");
        setNewTaskTime(format(new Date(), "HH:mm"));
        setIsRecurring(false);
        setRecurrenceType("weekly");
        setEditingTaskId(null);
    }, []);

    return {
        isModalOpen,
        currentSelectedDate,
        newTaskText,
        newTaskTime,
        isRecurring,
        recurrenceType,
        editingTaskId,
        alarmEnabled,
        setNewTaskText,
        setNewTaskTime,
        setAlarmEnabled,
        openModal,
        closeModal,
        handleRecurringToggle,
        resetForm,
    };
}
