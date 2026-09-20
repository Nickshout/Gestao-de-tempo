"use client";

import { useEffect, useRef, useState } from "react";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Mode = "Foco" | "Pausa";

export default function PomodoroTimer() {
  const [mode, setMode] = useState<Mode>("Foco");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setMode((m) => (m === "Foco" ? "Pausa" : "Foco"));
          return mode === "Foco" ? BREAK_SECONDS : FOCUS_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode]);

  function toggleRunning() {
    setIsRunning((r) => !r);
  }

  function reset() {
    setIsRunning(false);
    setMode("Foco");
    setSecondsLeft(FOCUS_SECONDS);
  }

  const total = mode === "Foco" ? FOCUS_SECONDS : BREAK_SECONDS;
  const progress = 1 - secondsLeft / total;
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <section className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-neutral-900 p-4 flex flex-col items-center gap-4">
      <h2 className="text-lg font-semibold self-start">Pomodoro</h2>

      <div className="relative w-40 h-40">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            className="stroke-black/10 dark:stroke-white/10"
          />
          <circle
            cx="60"
            cy="60"
            r={RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
            className={mode === "Foco" ? "stroke-blue-500" : "stroke-green-500"}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums">
            {minutes}:{seconds}
          </span>
          <span className="text-xs text-neutral-500">{mode}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={toggleRunning}
          className="rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium"
        >
          {isRunning ? "Pausar" : "Iniciar"}
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-black/10 dark:border-white/10 px-4 py-2 text-sm font-medium"
        >
          Reiniciar
        </button>
      </div>
    </section>
  );
}
