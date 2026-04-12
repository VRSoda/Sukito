import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Task } from "../types";

export function useTasks() {
    const [tasks, setTasks] = useState<Task[]>([]);

    const loadTasks = useCallback(async () => {
        try {
            const loadedTasks = await invoke<Task[]>("get_tasks");
            setTasks(loadedTasks);
            return loadedTasks;
        } catch (e) {
            console.error("Failed to load tasks:", e);
            return [];
        }
    }, []);

    const saveTasks = useCallback(async (updatedTasks: Task[]) => {
        try {
            await invoke("save_tasks", { tasks: updatedTasks });
            setTasks(updatedTasks);
        } catch (e) {
            console.error("Failed to save tasks:", e);
            // 저장 실패 시 UI를 업데이트하지 않아 이전 상태 유지
        }
    }, []);

    return { tasks, setTasks, loadTasks, saveTasks };
}
