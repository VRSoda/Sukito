import { CalendarDays, ChevronLeft, ChevronRight, Plus, RefreshCw, Settings as SettingsIcon, Sun, Cloud, CloudRain, CloudSnow, CloudLightning, X, Minus } from "lucide-react";
import { format } from "date-fns";
import { ko, ja, enUS } from "date-fns/locale";
import { AppSettings } from "../types";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TRANSLATIONS } from "../constants";

const appWindow = getCurrentWindow();
const LOCALE_MAP = { ko, ja, en: enUS };

interface HeaderProps {
    readonly monthDate: Date;
    readonly weekOfMonthText: string;
    readonly monthLabel: string;
    readonly settings: AppSettings;
    readonly isSyncing: boolean;
    readonly weather: { temp: number; icon: string; description?: string };
    readonly timeProgress: { day: number; month: number; year: number };
    readonly onPrevWeek: () => void;
    readonly onNextWeek: () => void;
    readonly onToday: () => void;
    readonly onSync: () => void;
    readonly onAddClick: () => void;
    readonly onSettingsClick: () => void;
}

export function Header({ monthDate, weekOfMonthText, monthLabel, settings, isSyncing, weather, timeProgress, onPrevWeek, onNextWeek, onToday, onSync, onAddClick, onSettingsClick }: HeaderProps) {
    const t = TRANSLATIONS[settings.language || "ko"];
    const currentLocale = LOCALE_MAP[settings.language || "ko"];

    const handleDrag = async (e: React.MouseEvent) => {
        if (e.buttons === 1 && !settings.isLocked) {
            if ((e.target as HTMLElement).closest("button")) return;
            await appWindow.startDragging();
        }
    };

    const renderWeatherIcon = () => {
        switch (weather.icon) {
            case "Cloud":
                return <Cloud size={14} className="text-blue-300" />;
            case "CloudRain":
                return <CloudRain size={14} className="text-blue-400" />;
            case "CloudSnow":
                return <CloudSnow size={14} className="text-white" />;
            case "CloudLightning":
                return <CloudLightning size={14} className="text-amber-300" />;
            default:
                return <Sun size={14} className="text-amber-400" />;
        }
    };

    return (
        <header className={`h-[72px] flex items-center justify-between px-8 bg-white/[0.04] border-b border-white/[0.05] transition-all relative`}>
            {/* Draggable overlay */}
            <div onMouseDown={handleDrag} role="none" className={`absolute inset-0 z-0 ${settings.isLocked ? "" : "cursor-move hover:bg-white/[0.02]"}`} />

            <div className="flex items-center gap-4 text-left relative z-10">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center border border-accent/30">
                    <CalendarDays size={20} className="text-accent" />
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.1em] leading-none mb-0.5">{monthLabel}</span>
                        <h1 className="text-sm font-extrabold tracking-tight text-white/80">
                            {format(monthDate, "LLLL", { locale: currentLocale })} {weekOfMonthText}
                        </h1>
                    </div>
                    <div className="flex gap-1.5 items-center mt-0.5">
                        <div className="flex flex-col gap-[2px]">
                            <div className="w-16 h-[3px] bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent/60 rounded-full transition-all duration-1000" style={{ width: `${timeProgress.day}%` }} />
                            </div>
                            <div className="w-16 h-[2px] bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-400/40 rounded-full transition-all duration-1000" style={{ width: `${timeProgress.month}%` }} />
                            </div>
                        </div>
                        <span className="text-[8px] font-black text-white/10 uppercase tracking-tighter">Progress</span>
                    </div>
                </div>
            </div>

            {/* [중앙: 주간 이동 버튼만 유지] */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 relative z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onPrevWeek();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToday();
                    }}
                    className="px-3 py-1.5 text-[10px] font-black text-white/30 hover:text-white hover:bg-white/5 transition-all uppercase tracking-widest rounded-lg"
                >
                    {t.today}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onNextWeek();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2 relative z-10">
                {settings.isGoogleConnected && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onSync();
                        }}
                        className={`p-2 rounded-lg transition-all mr-1 ${isSyncing ? "animate-spin text-accent" : "bg-emerald-500/10 text-emerald-400"}`}
                    >
                        <RefreshCw size={16} />
                    </button>
                )}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 mr-1 text-left cursor-help">
                    {renderWeatherIcon()}
                    <span className="text-[11px] font-bold text-white/60">{weather.temp}°</span>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddClick();
                    }}
                    className="p-2 rounded-lg bg-accent/20 text-accent hover:bg-accent/30 border border-accent/20 transition-all active:scale-90"
                >
                    <Plus size={18} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSettingsClick();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-all active:scale-90"
                >
                    <SettingsIcon size={18} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        appWindow.hide();
                    }}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/20 hover:text-white transition-all active:scale-90"
                >
                    <Minus size={18} />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        appWindow.close();
                    }}
                    className="p-2 rounded-lg hover:bg-rose-500/20 text-white/20 hover:text-rose-400 transition-all active:scale-90"
                >
                    <X size={18} />
                </button>
            </div>
        </header>
    );
}
