"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  WORKOUT_DAYS,
  WorkoutDay,
  ExerciseHistoryMap,
  WeightHistoryEntry,
} from "@/lib/workout-data";
import { WorkoutExerciseCard } from "@/components/WorkoutExerciseCard";
import { FloatingRestTimer } from "@/components/FloatingRestTimer";
import { ProgressCharts } from "@/components/ProgressCharts";
import { SyncSettings } from "@/components/SyncSettings";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  Cloud,
  Dumbbell,
  RefreshCw,
  Settings2,
  Sparkles,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

const LOCAL_STORAGE_KEY = "workout_tracker_history_v3";

function playChimeSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Play double chime
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    playNote(659.25, 0, 0.3); // E5
    playNote(880.0, 0.18, 0.45); // A5
  } catch (err) {
    console.warn("Could not play sound:", err);
  }
}

export default function WorkoutTrackerApp() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("scheda-a");
  const [history, setHistory] = useState<ExerciseHistoryMap>({});
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncSource, setLastSyncSource] = useState<string>("local");

  // Floating Rest Timer State
  const [timerState, setTimerState] = useState<{
    visible: boolean;
    initialSeconds: number;
    timeLeft: number;
    isRunning: boolean;
    exerciseName: string;
  }>({
    visible: false,
    initialSeconds: 90,
    timeLeft: 90,
    isRunning: false,
    exerciseName: "",
  });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown effect
  useEffect(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerState((prev) => {
          if (prev.timeLeft <= 1) {
            playChimeSound();
            return { ...prev, timeLeft: 0, isRunning: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [timerState.isRunning, timerState.timeLeft]);

  // Load initial data from Cloud API + LocalStorage
  useEffect(() => {
    let localData: ExerciseHistoryMap = {};
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        localData = JSON.parse(stored);
        setHistory(localData);
      }
    } catch (e) {
      console.warn("Local storage parse error:", e);
    }

    // Fetch from Cloud API
    fetch("/api/workout")
      .then((res) => res.json())
      .then((res) => {
        if (res?.data && typeof res.data === "object") {
          // Merge cloud data with local data
          setHistory((prev) => {
            const merged = { ...prev, ...res.data };
            try {
              window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch (err) {
              console.warn("Storage save err:", err);
            }
            return merged;
          });
          setLastSyncSource(res.source || "cloud");
        }
      })
      .catch((err) => console.warn("Cloud sync fetch failed:", err))
      .finally(() => setIsLoaded(true));
  }, []);

  // Save changes to LocalStorage and Cloud
  const persistHistory = useCallback(
    async (updated: ExerciseHistoryMap) => {
      setHistory(updated);
      try {
        window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error("Local storage error:", err);
      }

      setIsSyncing(true);
      try {
        const res = await fetch("/api/workout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated),
        });
        const data = await res.json();
        if (data.savedToCloud) {
          setLastSyncSource("cloud");
        }
      } catch (err) {
        console.warn("Could not save to Cloud API:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const handleSaveWeights = (exerciseName: string, series: (number | null)[]) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const updated: ExerciseHistoryMap = { ...history };
    const currentList = updated[exerciseName] ? [...updated[exerciseName]] : [];

    const newEntry: WeightHistoryEntry = {
      data: todayStr,
      serie: series,
    };

    // If already saved today, replace the entry for today; otherwise prepend or append
    const todayIndex = currentList.findIndex((item) => item.data === todayStr);
    if (todayIndex >= 0) {
      currentList[todayIndex] = newEntry;
    } else {
      currentList.push(newEntry);
    }

    updated[exerciseName] = currentList;
    persistHistory(updated);
  };

  // Timer controls
  const handleStartTimer = (seconds: number, exerciseName: string) => {
    setTimerState({
      visible: true,
      initialSeconds: seconds,
      timeLeft: seconds,
      isRunning: true,
      exerciseName,
    });
  };

  const handleTogglePlay = () => {
    setTimerState((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const handleResetTimer = () => {
    setTimerState((prev) => ({
      ...prev,
      timeLeft: prev.initialSeconds,
      isRunning: false,
    }));
  };

  const handleAddSeconds = (secs: number) => {
    setTimerState((prev) => ({
      ...prev,
      timeLeft: prev.timeLeft + secs,
    }));
  };

  const handleCloseTimer = () => {
    setTimerState((prev) => ({ ...prev, visible: false, isRunning: false }));
  };

  // Manual cloud sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(history),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Sincronizzazione completata!",
          description: data.savedToCloud
            ? "Dati salvati sul Cloud Storage Google."
            : "Dati salvati in locale.",
        });
        setLastSyncSource(data.savedToCloud ? "cloud" : "local");
      }
    } catch (err) {
      toast({
        title: "Errore sincronizzazione",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportBackup = (newHistory: ExerciseHistoryMap) => {
    persistHistory(newHistory);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between max-w-5xl">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">
                Workout Tracker
              </h1>
              <span className="text-[11px] text-muted-foreground font-medium">
                Nuovo Programma A · B · C
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground border-border"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                  <span>Sincronizzazione...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span>{lastSyncSource === "cloud" ? "Cloud Sync" : "Salvato"}</span>
                </>
              )}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow container mx-auto px-3 sm:px-6 py-5 max-w-4xl space-y-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
          {/* Navigation Tabs */}
          <TabsList className="grid grid-cols-5 w-full h-12 p-1 bg-muted/80 rounded-xl shadow-inner">
            <TabsTrigger value="scheda-a" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <span className="sm:hidden">A</span>
              <span className="hidden sm:inline">Scheda A</span>
            </TabsTrigger>
            <TabsTrigger value="scheda-b" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <span className="sm:hidden">B</span>
              <span className="hidden sm:inline">Scheda B</span>
            </TabsTrigger>
            <TabsTrigger value="scheda-c" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <span className="sm:hidden">C</span>
              <span className="hidden sm:inline">Scheda C</span>
              <Sparkles className="h-3 w-3 text-amber-500 hidden sm:inline" />
            </TabsTrigger>
            <TabsTrigger value="grafici" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Grafici</span>
            </TabsTrigger>
            <TabsTrigger value="impostazioni" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </TabsTrigger>
          </TabsList>

          {/* Schede A, B, C */}
          {WORKOUT_DAYS.map((day) => (
            <TabsContent key={day.id} value={day.id} className="space-y-4 focus-visible:outline-none">
              {/* Day Header Banner */}
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black tracking-tight">{day.titolo}</h2>
                    {day.tipo === "base" ? (
                      <Badge className="bg-primary text-primary-foreground text-xs font-semibold">
                        Programma Base
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold border-amber-500 text-amber-600 bg-amber-500/10">
                        ⭐ Bonus
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground pt-0.5">
                    {day.esercizi.length} esercizi • Durata stimata: {day.durataStimata}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span>{day.durataStimata}</span>
                </div>
              </div>

              {/* Linear Exercises List */}
              <div className="space-y-3.5">
                {day.esercizi.map((exercise) => {
                  // Find the latest recorded entry for this exercise or its active variant
                  const entries = history[exercise.nome] || [];
                  const latestEntry = entries.length > 0 ? entries[entries.length - 1] : undefined;

                  return (
                    <WorkoutExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      historyEntry={latestEntry}
                      onSaveWeights={handleSaveWeights}
                      onStartTimer={handleStartTimer}
                    />
                  );
                })}
              </div>
            </TabsContent>
          ))}

          {/* Tab Grafici */}
          <TabsContent value="grafici" className="focus-visible:outline-none">
            <ProgressCharts history={history} />
          </TabsContent>

          {/* Tab Backup & Impostazioni */}
          <TabsContent value="impostazioni" className="focus-visible:outline-none">
            <SyncSettings
              history={history}
              onImport={handleImportBackup}
              onCloudSync={handleManualSync}
              isSyncing={isSyncing}
              lastSyncSource={lastSyncSource}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Rest Timer */}
      {timerState.visible && (
        <FloatingRestTimer
          initialSeconds={timerState.initialSeconds}
          exerciseName={timerState.exerciseName}
          timeLeft={timerState.timeLeft}
          isRunning={timerState.isRunning}
          onTogglePlay={handleTogglePlay}
          onReset={handleResetTimer}
          onAddSeconds={handleAddSeconds}
          onClose={handleCloseTimer}
        />
      )}
    </div>
  );
}
