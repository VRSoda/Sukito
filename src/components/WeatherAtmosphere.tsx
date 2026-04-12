import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface WeatherAtmosphereProps {
    type: string; // "Sun" | "Cloud" | "CloudRain" | "CloudSnow" | "CloudLightning"
}

export function WeatherAtmosphere(props: Readonly<WeatherAtmosphereProps>) {
    const { type } = props;
    const [particles, setParticles] = useState<{ id: number; x: number; delay: number; duration: number }[]>([]);

    useEffect(() => {
        // 비나 눈일 때만 입자 생성
        if (type === "CloudRain" || type === "CloudSnow") {
            const newParticles = Array.from({ length: 30 }).map((_, i) => ({
                id: i,
                x: Math.random() * 100, // 0% ~ 100%
                delay: Math.random() * 2,
                duration: type === "CloudRain" ? 0.8 + Math.random() * 0.5 : 3 + Math.random() * 2,
            }));
            setParticles(newParticles);
        } else {
            setParticles([]);
        }
    }, [type]);

    // 1. 비 내리는 효과
    if (type === "CloudRain") {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 400, opacity: [0, 0.4, 0] }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear",
                        }}
                        style={{ left: `${p.x}%` }}
                        className="absolute w-[1px] h-4 bg-blue-300/40"
                    />
                ))}
            </div>
        );
    }

    // 2. 눈 내리는 효과
    if (type === "CloudSnow") {
        return (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{
                            y: 400,
                            opacity: [0, 0.8, 0],
                            x: [0, Math.random() * 20 - 10, 0], // 좌우로 흔들림
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            delay: p.delay,
                            ease: "linear",
                        }}
                        style={{ left: `${p.x}%` }}
                        className="absolute w-1.5 h-1.5 bg-white/60 rounded-full blur-[1px]"
                    />
                ))}
            </div>
        );
    }

    // 3. 번개 치는 효과
    if (type === "CloudLightning") {
        return (
            <div className="absolute inset-0 pointer-events-none z-0">
                <motion.div animate={{ opacity: [0, 0, 0.2, 0, 0.3, 0, 0] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.7, 0.72, 0.75, 0.77, 0.8, 1] }} className="absolute inset-0 bg-white" />
            </div>
        );
    }

    // 4. 흐린 날씨 (약간의 어두운 구름 그림자)
    if (type === "Cloud") {
        return (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div animate={{ x: [-100, 400] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-0 w-64 h-32 bg-white/5 blur-3xl rounded-full" />
            </div>
        );
    }

    return null;
}
