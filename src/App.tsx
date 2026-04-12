import { useEffect, useRef, useCallback, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import { format, startOfWeek, addDays, differenceInCalendarWeeks, parseISO, subMinutes, isSameMinute } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Components
import { Header } from "./components/Header";
import { DayColumn } from "./components/DayColumn";
import { TaskModal } from "./components/modals/TaskModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { WeatherAtmosphere } from "./components/WeatherAtmosphere";
import { NotificationToast } from "./components/NotificationToast";
import { Dialog } from "./components/Dialog";

// Hooks
import { useTasks } from "./hooks/useTasks";
import { useGoogleSync } from "./hooks/useGoogleSync";
import { useWeather } from "./hooks/useWeather";
import { useSettings } from "./hooks/useSettings";
import { useAlarm } from "./hooks/useAlarm";
import { useTaskModal } from "./hooks/useTaskModal";
import { useAppSetup } from "./hooks/useAppSetup";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useWeekView } from "./hooks/useWeekView";

// Utils
import { generateAlarmKey } from "./utils/alarm";
import { getTodayDateInZone, getTodayDayInZone } from "./utils/timezone";
import { triggerFullNotification } from "./services/alarmService";

// Types & Constants
import { Task } from "./types";
import { DAYS } from "./constants";

function App() {
    // ===== State Management =====
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [dialog, setDialog] = useState<{ message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);
    const { tasks, loadTasks, saveTasks } = useTasks();
    const { weekStart, currentViewDate, timeProgress, goToPreviousWeek, goToNextWeek, goToToday, getViewHeader } = useWeekView();
    const { settings, updateSettings, updateTimeZone } = useSettings();
    const { activeAlarm, startRinging, stopRinging } = useAlarm(settings.selectedSound);
    const { isModalOpen, currentSelectedDate, newTaskText, newTaskTime, isRecurring, recurrenceType, alarmEnabled, editingTaskId, setNewTaskText, setNewTaskTime, setAlarmEnabled, openModal, closeModal, handleRecurringToggle } = useTaskModal();
    const onTokenRefreshed = useCallback((newToken: string) => updateSettings({ googleAccessToken: newToken }), [updateSettings]);
    const { isSyncing, syncWithGoogle, refreshAccessToken, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } = useGoogleSync(
        currentViewDate,
        settings,
        onTokenRefreshed,
    );
    const { weather } = useWeather((detectedTz) => updateTimeZone(detectedTz), settings.language, settings.owmApiKey);
    const { isSyncing: isGoogleAuthSyncing, handleGoogleLogin, handleGoogleLogout } = useGoogleAuth({
        settings,
        onSettingsUpdate: updateSettings,
        onSyncGoogle: syncWithGoogle,
        onError: (msg) => setDialog({ message: msg, onConfirm: () => setDialog(null) }),
    });

    // ===== App Initialization =====
    useAppSetup({
        onLoadTasks: loadTasks,
        onSettingsLoaded: (savedSettings) => {
            updateSettings(savedSettings);
        },
        onGoogleSync: (token) => syncWithGoogle(token),
    });

    // ===== References =====
    const playedAlarms = useRef<Set<string>>(new Set());
    const lastAlarmDateRef = useRef<string>("");
    const tasksRef = useRef<Task[]>(tasks);
    const syncInProgressRef = useRef(false);
    const handleSyncRef = useRef<(token?: string, force?: boolean) => Promise<void>>(() => Promise.resolve());
    const syncedWeeksRef = useRef<Map<string, number>>(new Map());
    const CACHE_TTL = 30 * 60 * 1000; // 30분

    // tasksRef를 항상 최신 tasks로 동기화 (stale closure 방지)
    useEffect(() => {
        tasksRef.current = tasks;
    }, [tasks]);

    // ===== Helper: Merge Google tasks with local tasks =====
    // Replaces Google events for the synced week range; keeps events from other weeks and local-only tasks.
    const mergeGoogleTasks = (localTasks: Task[], googleTasks: Task[], syncedWeekStart: Date): Task[] => {
        const weekStartStr = format(syncedWeekStart, "yyyy-MM-dd");
        const weekEndStr = format(addDays(syncedWeekStart, 7), "yyyy-MM-dd");

        const localOnly = localTasks.filter((t) => !t.googleEventId);
        const googleOtherWeeks = localTasks.filter((t) => {
            if (!t.googleEventId || !t.date) return false;
            return t.date < weekStartStr || t.date >= weekEndStr;
        });
        const combined = [...localOnly, ...googleOtherWeeks, ...googleTasks];
        return combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
    };

    // ===== Google Sync =====
    const handleGoogleSyncWithFallback = useCallback(
        async (customToken?: string, force = false) => {
            if (syncInProgressRef.current) return;

            // 캐시 확인: force가 아니고 30분 이내에 동기화된 주면 스킵
            const weekKey = format(weekStart, "yyyy-MM-dd");
            if (!force) {
                const lastSynced = syncedWeeksRef.current.get(weekKey);
                if (lastSynced && Date.now() - lastSynced < CACHE_TTL) return;
            }

            syncInProgressRef.current = true;
            try {
                const gTasks = await syncWithGoogle(customToken);
                if (gTasks) {
                    const mergedTasks = mergeGoogleTasks(tasksRef.current, gTasks, weekStart);
                    saveTasks(mergedTasks);
                    syncedWeeksRef.current.set(weekKey, Date.now());
                }
            } catch (error: any) {
                if (error.message === "UNAUTHORIZED" && settings.googleRefreshToken) {
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        updateSettings({ googleAccessToken: newToken });
                        syncInProgressRef.current = false;
                        await handleSyncRef.current(newToken, force);
                        return;
                    } else {
                        updateSettings({ isGoogleConnected: false, googleAccessToken: "", googleRefreshToken: "" });
                    }
                }
            } finally {
                syncInProgressRef.current = false;
            }
        },
        [syncWithGoogle, settings.googleRefreshToken, updateSettings, saveTasks, weekStart],
    );

    // handleSyncRef를 항상 최신 함수로 동기화
    useEffect(() => {
        handleSyncRef.current = handleGoogleSyncWithFallback;
    }, [handleGoogleSyncWithFallback]);

    // ===== Auto Google Sync on View Change =====
    useEffect(() => {
        if (settings.isGoogleConnected) {
            handleSyncRef.current();
        }
        // handleSyncRef는 ref이므로 deps에 포함하지 않음 — 의도적
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentViewDate, settings.isGoogleConnected]);

    // ===== Helper: Filter and sort tasks for a specific day =====
    const getTasksForDay = (day: string, weekStart: Date): Task[] => {
        const dateStr = format(addDays(weekStart, DAYS.indexOf(day)), "yyyy-MM-dd");
        return tasks
            .filter((t) => {
                if (!t.isRecurring || t.googleEventId) return t.date === dateStr;
                if (t.day !== day) return false;
                if (t.recurrenceType === "biweekly" && t.date) {
                    const weeksDiff = Math.abs(differenceInCalendarWeeks(weekStart, startOfWeek(parseISO(t.date), { weekStartsOn: 0 }), { weekStartsOn: 0 }));
                    return weeksDiff % 2 === 0;
                }
                return true;
            })
            .sort((a, b) => {
                if (a.isHolidayEvent !== b.isHolidayEvent) return a.isHolidayEvent ? 1 : -1;
                return a.time.localeCompare(b.time);
            });
    };

    // ===== Check Alarms Every Minute =====
    useEffect(() => {
        const checkInterval = setInterval(async () => {
            const todayStr = getTodayDateInZone(settings.userTimeZone);
            const currentDayName = DAYS[getTodayDayInZone(settings.userTimeZone)];
            const nowInTz = toZonedTime(new Date(), settings.userTimeZone);

            // 날짜가 바뀌면 알람 기록 초기화 (자정 1초 체크 대신 날짜 변경 감지)
            if (lastAlarmDateRef.current && lastAlarmDateRef.current !== todayStr) {
                playedAlarms.current.clear();
            }
            lastAlarmDateRef.current = todayStr;

            for (const task of tasks) {
                if (task.alarmEnabled === false) continue;
                const isTargetDay = task.isRecurring ? task.day === currentDayName : task.date === todayStr;
                if (!isTargetDay) continue;

                const [h, m] = task.time.split(":").map(Number);
                const taskTime = new Date();
                taskTime.setHours(h, m, 0, 0);
                const alarmTime = subMinutes(taskTime, 10);
                const alarmKey = generateAlarmKey(task.id, task.time);

                if (isSameMinute(nowInTz, alarmTime) && !playedAlarms.current.has(alarmKey)) {
                    startRinging(task.text, task.time);
                    await triggerFullNotification(`🔔 ${task.text}`, task.time);
                    playedAlarms.current.add(alarmKey);
                }
            }
        }, 1000);

        return () => clearInterval(checkInterval);
    }, [tasks, startRinging, settings.userTimeZone]);

    // ===== Task Modal Handlers =====

    // Helper: Sync task with Google Calendar if connected
    const syncTaskWithGoogle = async (task: Task, isEditing: boolean): Promise<Task> => {
        if (!settings.isGoogleConnected || !settings.googleAccessToken) return task;

        try {
            if (isEditing) {
                const existingTask = tasks.find((t) => t.id === task.id);
                if (existingTask?.googleEventId) {
                    task.googleEventId = existingTask.googleEventId;
                    await updateGoogleEvent(task);
                } else {
                    const gid = await createGoogleEvent(task);
                    if (gid) task.googleEventId = gid;
                }
            } else {
                const gid = await createGoogleEvent(task);
                if (gid) task.googleEventId = gid;
            }
        } catch (e) {
            console.error("Google Sync failed:", e);
        }

        return task;
    };

    // Helper: Update local tasks based on editing mode
    const updateLocalTasks = (updatedTask: Task, isEditing: boolean): Task[] => {
        if (!isEditing) {
            return [...tasks, updatedTask];
        }

        const targetTask = tasks.find((t) => t.id === updatedTask.id);
        if (targetTask?.isRecurring || targetTask?.googleEventId) {
            return tasks.map((t) => {
                if (targetTask.googleEventId && t.googleEventId === targetTask.googleEventId) {
                    return { ...t, text: updatedTask.text, time: updatedTask.time, isRecurring: updatedTask.isRecurring, recurrenceType: updatedTask.recurrenceType };
                }
                return t.id === updatedTask.id ? updatedTask : t;
            });
        }

        return tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
    };

    const handleSaveTask = async () => {
        if (!newTaskText.trim()) return;

        const taskDateStr = format(currentSelectedDate, "yyyy-MM-dd");

        // Determine task date based on recurring/editing state
        const determineTaskDate = (): string => {
            if (!isRecurring) return taskDateStr;
            if (editingTaskId) {
                return tasks.find((t) => t.id === editingTaskId)?.date || taskDateStr;
            }
            return taskDateStr;
        };

        let updatedTask: Task = {
            id: editingTaskId || Math.random().toString(36).slice(2, 11),
            text: newTaskText,
            time: newTaskTime,
            day: DAYS[currentSelectedDate.getDay()],
            date: determineTaskDate(),
            isRecurring,
            recurrenceType: isRecurring ? recurrenceType : undefined,
            alarmEnabled,
        };

        // Sync with Google Calendar
        updatedTask = await syncTaskWithGoogle(updatedTask, !!editingTaskId);

        // Update local tasks
        const finalTasks = updateLocalTasks(updatedTask, !!editingTaskId);

        saveTasks(finalTasks);
        closeModal();
    };

    const handleDeleteTask = async () => {
        if (editingTaskId) {
            const task = tasks.find((t) => t.id === editingTaskId);
            if (task?.googleEventId) {
                await deleteGoogleEvent(task.googleEventId);
            }
            saveTasks(tasks.filter((t) => t.id !== editingTaskId));
            closeModal();
        }
    };

    // ===== Render =====
    const { monthLabel, weekText, monthDate } = getViewHeader(settings.language);

    return (
        <div className="w-screen h-screen bg-transparent select-none font-sans overflow-hidden p-0 m-0 text-white text-left">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: `rgba(15, 15, 15, ${settings.opacity})`,
                    backdropFilter: "blur(70px) saturate(230%)",
                }}
                className="w-full h-full flex flex-col rounded-none overflow-hidden border-none relative"
            >
                <WeatherAtmosphere type={weather.icon} />
                <NotificationToast show={activeAlarm.show} title={activeAlarm.title} time={activeAlarm.time} language={settings.language} onClose={stopRinging} />

                <div className="relative z-10 flex flex-col h-full">
                    <Header
                        monthDate={monthDate}
                        weekOfMonthText={weekText}
                        monthLabel={monthLabel}
                        settings={settings}
                        isSyncing={isSyncing}
                        weather={weather}
                        timeProgress={timeProgress}
                        onPrevWeek={goToPreviousWeek}
                        onNextWeek={goToNextWeek}
                        onToday={goToToday}
                        onSync={() => handleGoogleSyncWithFallback(undefined, true)}
                        onAddClick={() => openModal(new Date())}
                        onSettingsClick={() => setIsSettingsOpen(true)}
                    />

                    <div className="flex-1 flex overflow-hidden">
                        {DAYS.map((day, idx) => {
                            const dateOfCurrentDay = addDays(weekStart, idx);
                            const filteredTasks = getTasksForDay(day, weekStart);

                            return <DayColumn key={day} day={day} date={dateOfCurrentDay} tasks={filteredTasks} isLast={idx === DAYS.length - 1} settings={settings} onAddTask={() => openModal(dateOfCurrentDay)} onEditTask={(task) => openModal(dateOfCurrentDay, task)} />;
                        })}
                    </div>

                    <div className="h-[1.5px] w-full bg-accent/20" />
                </div>
            </motion.div>

            <TaskModal
                isOpen={isModalOpen}
                editingTaskId={editingTaskId}
                currentSelectedDate={currentSelectedDate}
                newTaskText={newTaskText}
                newTaskTime={newTaskTime}
                isRecurring={isRecurring}
                recurrenceType={recurrenceType}
                alarmEnabled={alarmEnabled}
                settings={settings}
                onClose={closeModal}
                onTextChange={setNewTaskText}
                onTimeChange={setNewTaskTime}
                onAlarmToggle={setAlarmEnabled}
                onRecurringToggle={handleRecurringToggle}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
            />

            {dialog && <Dialog message={dialog.message} onConfirm={dialog.onConfirm} onCancel={dialog.onCancel} />}

            <SettingsModal
                isOpen={isSettingsOpen}
                settings={settings}
                isSyncing={isGoogleAuthSyncing}
                onClose={() => setIsSettingsOpen(false)}
                onUpdate={(s) => { updateSettings(s); if (s.alwaysOnTop !== undefined) invoke("set_always_on_top", { alwaysOnTop: s.alwaysOnTop }); }}
                onGoogleLogin={handleGoogleLogin}
                onGoogleLogout={handleGoogleLogout}
                onClearData={() =>
                    setDialog({
                        message: "모든 설정과 일정이 삭제됩니다. 계속하시겠습니까?",
                        onConfirm: async () => {
                            setDialog(null);
                            localStorage.clear();
                            await invoke("save_tasks", { tasks: [] });
                            location.reload();
                        },
                        onCancel: () => setDialog(null),
                    })
                }
            />
        </div>
    );
}

export default App;
