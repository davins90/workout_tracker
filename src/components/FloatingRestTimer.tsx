"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Plus, X, Timer, Volume2 } from "lucide-react";

interface FloatingRestTimerProps {
  initialSeconds: number;
  exerciseName: string;
  timeLeft: number;
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onAddSeconds: (seconds: number) => void;
  onClose: () => void;
}

export function FloatingRestTimer({
  initialSeconds,
  exerciseName,
  timeLeft,
  isRunning,
  onTogglePlay,
  onReset,
  onAddSeconds,
  onClose,
}: FloatingRestTimerProps) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  const isFinished = timeLeft === 0;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md animate-in slide-in-from-bottom-5 duration-300">
      <div
        className={`rounded-2xl p-3.5 shadow-2xl border backdrop-blur-md transition-colors ${
          isFinished
            ? "bg-emerald-600 text-white border-emerald-500 animate-bounce"
            : "bg-card/95 text-card-foreground border-primary/30"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left: icon & exercise info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                isFinished ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              }`}
            >
              {isFinished ? <Volume2 className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate max-w-[150px] sm:max-w-[180px]">
                {isFinished ? "Recupero Terminato!" : exerciseName || "Recupero"}
              </div>
              <div
                className={`text-2xl font-black font-mono tracking-tight leading-none ${
                  isFinished ? "text-white" : "text-primary"
                }`}
              >
                {timeFormatted}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              size="sm"
              variant={isFinished ? "secondary" : "outline"}
              onClick={() => onAddSeconds(30)}
              className="h-8 px-2 text-xs font-bold"
              title="Aggiungi 30 secondi"
            >
              <Plus className="h-3 w-3 mr-0.5" /> 30s
            </Button>

            <Button
              type="button"
              size="icon"
              variant={isRunning ? "destructive" : "default"}
              onClick={onTogglePlay}
              className="h-8 w-8 rounded-full"
            >
              {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onReset}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Resetta timer"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Chiudi timer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
