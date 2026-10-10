"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  WORKOUT_DAYS,
  ExerciseHistoryMap,
  WeightHistoryEntry,
} from "@/lib/workout-data";
import { WorkoutExerciseCard } from "@/components/WorkoutExerciseCard";
import { FloatingRestTimer } from "@/components/FloatingRestTimer";
import { ProgressCharts } from "@/components/ProgressCharts";
import { SyncSettings } from "@/components/SyncSettings";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  CloudOff,
  Dumbbell,
  Lock,
  RefreshCw,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { historiesEqual, mergeHistories, sanitizeHistory } from "@/lib/history";

const LOCAL_STORAGE_KEY = "workout_tracker_history_v3";
const ACCESS_CODE_KEY = "workout_tracker_access_code";

export type SyncStatus = "loading" | "syncing" | "synced" | "pending" | "locked";

function readLocalHistory(): ExerciseHistoryMap {
  try {
    const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    return (stored && sanitizeHistory(JSON.parse(stored))) || {};
  } catch (e) {
    console.warn("Local storage parse error:", e);
    return {};
  }
}

// One shared audio context, created on a tap so mobile browsers allow the chime later
let audioCtx: AudioContext | null = null;

function unlockAudio() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === "suspended") void audioCtx.resume();
  } catch (err) {
    console.warn("Could not init audio:", err);
  }
}

function playChimeSound() {
  try {
    unlockAudio();
    const ctx = audioCtx;
    if (!ctx) return;

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
    navigator.vibrate?.([200, 100, 200]);
  } catch (err) {
    console.warn("Could not play sound:", err);
  }
}

export default function WorkoutTrackerApp() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("scheda-a");
  const [history, setHistory] = useState<ExerciseHistoryMap>({});
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [accessCode, setAccessCode] = useState<string>("");

  // Latest values for async callbacks
  const historyRef = useRef<ExerciseHistoryMap>({});
  const accessCodeRef = useRef<string>("");

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

  // The countdown is derived from this end time, so it stays right after the tab was in background
  const timerEndsAtRef = useRef<number | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!timerState.isRunning) return;

    const tick = () => {
      const endsAt = timerEndsAtRef.current;
      if (endsAt === null) return;
      const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      if (left === 0) {
        timerEndsAtRef.current = null;
        playChimeSound();
      }
      setTimerState((prev) => ({ ...prev, timeLeft: left, isRunning: left > 0 }));
    };

    // Keep the screen on while resting, where the browser supports it
    const requestWakeLock = async () => {
      try {
        if (document.visibilityState === "visible" && !wakeLockRef.current) {
          wakeLockRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
          wakeLockRef.current?.addEventListener("release", () => {
            wakeLockRef.current = null;
          });
        }
      } catch {
        // not supported or denied
      }
    };
    const onVisibility = () => {
      tick();
      void requestWakeLock();
    };

    void requestWakeLock();
    const interval = setInterval(tick, 250);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      void wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [timerState.isRunning]);

  const applyHistory = useCallback((next: ExerciseHistoryMap) => {
    historyRef.current = next;
    setHistory(next);
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.error("Local storage error:", err);
    }
  }, []);

  const apiFetch = useCallback((init?: RequestInit) => {
    return fetch("/api/workout", {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessCodeRef.current}`,
      },
    });
  }, []);

  // Sends the local history; the server merges it and returns the combined result
  const pushHistory = useCallback(async (): Promise<boolean> => {
    setSyncStatus("syncing");
    try {
      const res = await apiFetch({ method: "POST", body: JSON.stringify(historyRef.current) });
      if (res.status === 401) {
        setSyncStatus("locked");
        return false;
      }
      const body = await res.json();
      const cloud = res.ok && body.success ? sanitizeHistory(body.data) : null;
      if (!cloud) throw new Error(body.error || `HTTP ${res.status}`);
      applyHistory(mergeHistories(cloud, historyRef.current));
      setSyncStatus(historiesEqual(cloud, historyRef.current) ? "synced" : "pending");
      return true;
    } catch (err) {
      console.warn("Could not save to Cloud API:", err);
      setSyncStatus("pending");
      return false;
    }
  }, [apiFetch, applyHistory]);

  // Fetches the cloud history, merges it with the local one and uploads whatever the cloud is missing
  const syncWithCloud = useCallback(async (): Promise<boolean> => {
    setSyncStatus("syncing");
    try {
      const res = await apiFetch();
      if (res.status === 401) {
        setSyncStatus("locked");
        return false;
      }
      const body = await res.json();
      const cloud = res.ok ? sanitizeHistory(body.data) : null;
      if (!cloud) throw new Error(body.error || `HTTP ${res.status}`);
      applyHistory(mergeHistories(cloud, historyRef.current));
      if (historiesEqual(cloud, historyRef.current)) {
        setSyncStatus("synced");
        return true;
      }
      return pushHistory();
    } catch (err) {
      console.warn("Cloud sync failed:", err);
      setSyncStatus("pending");
      return false;
    }
  }, [apiFetch, applyHistory, pushHistory]);

  // Load local data first, then sync; retry when the connection or the tab comes back
  useEffect(() => {
    applyHistory(readLocalHistory());
    try {
      const code = window.localStorage.getItem(ACCESS_CODE_KEY) || "";
      accessCodeRef.current = code;
      setAccessCode(code);
    } catch {
      // storage unavailable
    }
    void syncWithCloud();

    const retry = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void syncWithCloud();
    };
    window.addEventListener("online", retry);
    document.addEventListener("visibilitychange", retry);
    return () => {
      window.removeEventListener("online", retry);
      document.removeEventListener("visibilitychange", retry);
    };
  }, [applyHistory, syncWithCloud]);

  const handleSaveWeights = (
    exerciseName: string,
    series: (number | null)[],
    reps: (number | null)[]
  ) => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const newEntry: WeightHistoryEntry = {
      data: todayStr,
      serie: series,
      reps,
      ts: Date.now(),
    };

    // One entry per exercise per day: today's entry replaces the previous one
    applyHistory(mergeHistories(historyRef.current, { [exerciseName]: [newEntry] }));
    void pushHistory();
  };

  // Latest recorded entry for an exercise name (the card asks for its active variant)
  const getLatestEntry = (exerciseName: string): WeightHistoryEntry | undefined => {
    const entries = history[exerciseName] || [];
    return entries.length > 0 ? entries[entries.length - 1] : undefined;
  };

  // Timer controls
  const handleStartTimer = (seconds: number, exerciseName: string) => {
    unlockAudio();
    timerEndsAtRef.current = Date.now() + seconds * 1000;
    setTimerState({
      visible: true,
      initialSeconds: seconds,
      timeLeft: seconds,
      isRunning: true,
      exerciseName,
    });
  };

  const handleTogglePlay = () => {
    unlockAudio();
    if (timerState.isRunning) {
      timerEndsAtRef.current = null;
      setTimerState((prev) => ({ ...prev, isRunning: false }));
      return;
    }
    const seconds = timerState.timeLeft > 0 ? timerState.timeLeft : timerState.initialSeconds;
    timerEndsAtRef.current = Date.now() + seconds * 1000;
    setTimerState((prev) => ({ ...prev, timeLeft: seconds, isRunning: true }));
  };

  const handleResetTimer = () => {
    timerEndsAtRef.current = null;
    setTimerState((prev) => ({
      ...prev,
      timeLeft: prev.initialSeconds,
      isRunning: false,
    }));
  };

  const handleAddSeconds = (secs: number) => {
    unlockAudio();
    if (timerState.isRunning && timerEndsAtRef.current !== null) {
      timerEndsAtRef.current += secs * 1000;
      setTimerState((prev) => ({ ...prev, timeLeft: prev.timeLeft + secs }));
    } else if (timerState.timeLeft === 0) {
      // Finished: the extra time starts right away
      timerEndsAtRef.current = Date.now() + secs * 1000;
      setTimerState((prev) => ({ ...prev, timeLeft: secs, isRunning: true }));
    } else {
      setTimerState((prev) => ({ ...prev, timeLeft: prev.timeLeft + secs }));
    }
  };

  const handleCloseTimer = () => {
    timerEndsAtRef.current = null;
    setTimerState((prev) => ({ ...prev, visible: false, isRunning: false }));
  };

  // Manual cloud sync
  const handleManualSync = async () => {
    const ok = await syncWithCloud();
    if (ok) {
      toast({
        title: "Sincronizzazione completata!",
        description: "Dati salvati sul Cloud Storage Google.",
      });
    } else {
      toast({
        title: "Sincronizzazione non riuscita",
        description: accessCodeRef.current
          ? "I dati restano su questo dispositivo: riprova quando hai connessione."
          : "Inserisci il codice di accesso per sincronizzare.",
        variant: "destructive",
      });
    }
  };

  const handleSaveAccessCode = async (code: string) => {
    accessCodeRef.current = code;
    setAccessCode(code);
    try {
      window.localStorage.setItem(ACCESS_CODE_KEY, code);
    } catch {
      // storage unavailable
    }
    await handleManualSync();
  };

  // Imported entries are added to the existing history
  const handleImportBackup = (imported: ExerciseHistoryMap) => {
    applyHistory(mergeHistories(historyRef.current, imported));
    void pushHistory();
  };

  const syncBadge: Record<SyncStatus, { label: string; icon: React.ReactNode }> = {
    loading: { label: "Caricamento...", icon: <RefreshCw className="h-3 w-3 animate-spin text-primary" /> },
    syncing: { label: "Sincronizzazione...", icon: <RefreshCw className="h-3 w-3 animate-spin text-primary" /> },
    synced: { label: "Cloud Sync", icon: <CheckCircle2 className="h-3 w-3 text-emerald-500" /> },
    pending: { label: "Non sincronizzato", icon: <CloudOff className="h-3 w-3 text-amber-500" /> },
    locked: { label: "Codice richiesto", icon: <Lock className="h-3 w-3 text-amber-500" /> },
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
                Programma A · B
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              onClick={() => syncStatus !== "synced" && setActiveTab("impostazioni")}
              className="flex items-center gap-1 text-xs text-muted-foreground border-border whitespace-nowrap shrink-0"
            >
              {syncBadge[syncStatus].icon}
              <span>{syncBadge[syncStatus].label}</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow container mx-auto px-3 sm:px-6 py-5 max-w-4xl space-y-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-5">
          {/* Navigation Tabs */}
          <TabsList className="grid grid-cols-4 w-full h-12 p-1 bg-muted/80 rounded-xl shadow-inner">
            <TabsTrigger value="scheda-a" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <span className="sm:hidden">A</span>
              <span className="hidden sm:inline">Scheda A</span>
            </TabsTrigger>
            <TabsTrigger value="scheda-b" className="rounded-lg text-xs sm:text-sm font-bold gap-1.5">
              <span className="sm:hidden">B</span>
              <span className="hidden sm:inline">Scheda B</span>
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

          {/* Schede A, B */}
          {WORKOUT_DAYS.map((day) => (
            <TabsContent
              key={day.id}
              value={day.id}
              forceMount
              className="space-y-4 focus-visible:outline-none data-[state=inactive]:hidden"
            >
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
                {day.esercizi.map((exercise) => (
                  <WorkoutExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    getLatestEntry={getLatestEntry}
                    onSaveWeights={handleSaveWeights}
                    onStartTimer={handleStartTimer}
                  />
                ))}
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
              syncStatus={syncStatus}
              accessCode={accessCode}
              onSaveAccessCode={handleSaveAccessCode}
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
