import { useRef } from "react";
import { X, Settings as SettingsIcon, Monitor, Share2, Layers, Music, Globe, Lock, Key, Trash2, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import { AppSettings } from "../../types";
import { SOUNDS, TRANSLATIONS } from "../../constants";

interface SettingsModalProps {
    readonly isOpen: boolean;
    readonly settings: AppSettings;
    readonly isSyncing: boolean;
    readonly onClose: () => void;
    readonly onUpdate: (newSettings: Partial<AppSettings>) => void;
    readonly onGoogleLogin: () => void;
    readonly onGoogleLogout: () => void;
    readonly onClearData: () => void;
}

export function SettingsModal({ isOpen, settings, isSyncing, onClose, onUpdate, onGoogleLogin, onGoogleLogout, onClearData }: SettingsModalProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const t = TRANSLATIONS[settings.language || "ko"];

    if (!isOpen) return null;

    const handleSoundSelect = (file: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        const audio = new Audio(`/${file}`);
        audioRef.current = audio;
        audio.play().catch((e) => console.error(e));
        onUpdate({ selectedSound: file });
    };

    const renderGoogleButton = () => {
        if (settings.isGoogleConnected) {
            return (
                <button
                    onClick={onGoogleLogout}
                    className="px-3 py-1.5 rounded-lg transition-all font-bold text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-rose-500/20 hover:text-rose-400"
                >
                    {t.reset}
                </button>
            );
        }
        return (
            <button
                onClick={onGoogleLogin}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-lg transition-all font-bold text-[10px] bg-accent text-white hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isSyncing ? "..." : t.login}
            </button>
        );
    };

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.98, y: 10, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} className="w-[750px] bg-[#121212] p-6 rounded-[28px] border border-white/10 shadow-3xl text-white text-left">
                <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-4 px-2 h-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                            <SettingsIcon size={22} className="text-blue-400" />
                        </div>
                        <div className="flex flex-col items-start justify-center">
                            <h2 className="text-base font-bold tracking-tight leading-tight">{t.settings}</h2>
                            <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">{t.settingsDescription}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/5 text-white/30 hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 px-2 items-stretch mb-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1">
                            <div className="flex items-center gap-3">
                                <Monitor size={18} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.alwaysOnTop}</span>
                            </div>
                            <button onClick={() => onUpdate({ alwaysOnTop: !settings.alwaysOnTop })} className={`w-10 h-5 rounded-full relative transition-all ${settings.alwaysOnTop ? "bg-accent" : "bg-white/10"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.alwaysOnTop ? "left-5.5" : "left-0.5"}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1">
                            <div className="flex items-center gap-3">
                                <Lock size={18} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.lockWidget ?? "위젯 잠금"}</span>
                            </div>
                            <button onClick={() => onUpdate({ isLocked: !settings.isLocked })} className={`w-10 h-5 rounded-full relative transition-all ${settings.isLocked ? "bg-accent" : "bg-white/10"}`}>
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${settings.isLocked ? "left-5.5" : "left-0.5"}`} />
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1">
                            <div className="flex items-center gap-3">
                                <Share2 size={18} className={settings.isGoogleConnected ? "text-emerald-400" : "text-white/20"} />
                                <span className="text-xs font-semibold">{t.googleSync}</span>
                            </div>
                            {renderGoogleButton()}
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-1">
                            <div className="flex items-center gap-3">
                                <Globe size={18} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.language}</span>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                                {(["ko", "ja", "en"] as const).map((lang) => {
                                    const langName = { ko: t.korean, ja: t.japanese, en: t.english }[lang];
                                    return (
                                        <button key={lang} onClick={() => onUpdate({ language: lang })} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${settings.language === lang ? "bg-accent text-white" : "text-white/30 hover:text-white/60"}`}>
                                            {langName}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-[1] flex flex-col justify-center space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Layers size={18} className="text-white/20" />
                                    <span className="text-xs font-semibold">{t.opacity}</span>
                                </div>
                                <span className="text-[10px] font-black text-white/30 uppercase">{Math.round(settings.opacity * 100)}%</span>
                            </div>
                            <input type="range" min="0.1" max="1" step="0.05" value={settings.opacity} onChange={(e) => onUpdate({ opacity: Number.parseFloat(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent" />
                        </div>

                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] flex-[2] flex flex-col justify-center space-y-3">
                            <div className="flex items-center gap-3">
                                <Music size={18} className="text-white/20" />
                                <span className="text-xs font-semibold">{t.alarmSound}</span>
                            </div>
                            <div className="flex gap-2">
                                {SOUNDS.map((sound) => (
                                    <button key={sound.id} onClick={() => handleSoundSelect(sound.file)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold transition-all border ${settings.selectedSound === sound.file ? "bg-accent/20 border-accent/50 text-accent shadow-[0_0_15px_rgba(var(--accent-color-rgb),0.2)]" : "bg-white/5 border-transparent text-white/30 hover:bg-white/10"}`}>
                                        {t.soundNames[sound.id as keyof typeof t.soundNames] ?? sound.id}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[9px] text-white/10 font-medium">{t.soundTip}</p>
                        </div>
                    </div>
                </div>
                <div className="px-2 flex flex-col gap-3">
                    <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.02] space-y-3">
                        <div className="flex items-center gap-3 mb-1">
                            <Key size={18} className="text-white/20" />
                            <span className="text-xs font-semibold">{t.apiKeys}</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: t.owmApiKey, field: "owmApiKey" as const },
                            ].map(({ label, field }) => (
                                <div key={field} className="flex flex-col gap-1">
                                    <span className="text-[9px] text-white/30 font-semibold uppercase tracking-wider">{label}</span>
                                    <input
                                        type="password"
                                        value={settings[field] || ""}
                                        onChange={(e) => onUpdate({ [field]: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[11px] text-white placeholder-white/20 focus:outline-none focus:border-accent/50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => invoke("open_data_folder")}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-white/40 bg-white/5 hover:bg-white/10 transition-all border border-white/10"
                        >
                            <FolderOpen size={13} />
                            {t.openDataFolder}
                        </button>
                        <button
                            onClick={onClearData}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                        >
                            <Trash2 size={13} />
                            {t.clearData}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
