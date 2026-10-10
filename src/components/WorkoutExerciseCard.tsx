"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Exercise, WeightHistoryEntry } from "@/lib/workout-data";
import {
  Activity,
  Check,
  Dumbbell,
  Footprints,
  History,
  Save,
  Shield,
  Timer,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkoutExerciseCardProps {
  exercise: Exercise;
  getLatestEntry: (exerciseName: string) => WeightHistoryEntry | undefined;
  onSaveWeights: (exerciseName: string, series: (number | null)[], reps: (number | null)[]) => void;
  onStartTimer: (seconds: number, exerciseName: string) => void;
}

const AUTOSAVE_DELAY_MS = 700;

function toNumber(value: string): number | null {
  const n = Number(value.replace(",", "."));
  return value.trim() === "" || isNaN(n) || n < 0 ? null : n;
}

function formatSet(kg: number | null | undefined, reps: number | null | undefined): string {
  return reps !== null && reps !== undefined ? `${kg ?? "–"}×${reps}` : `${kg}`;
}

export function WorkoutExerciseCard({
  exercise,
  getLatestEntry,
  onSaveWeights,
  onStartTimer,
}: WorkoutExerciseCardProps) {
  const { toast } = useToast();

  // Handle variants (e.g. Face pull vs Reverse fly)
  const [activeVariant, setActiveVariant] = useState<string>(
    exercise.varianti && exercise.varianti.length > 0 ? exercise.varianti[0] : exercise.nome
  );

  const currentExerciseName = activeVariant;
  const historyEntry = getLatestEntry(currentExerciseName);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodayEntry = historyEntry?.data === todayStr;

  // Values typed in the current session
  const [weights, setWeights] = useState<string[]>([]);
  const [reps, setReps] = useState<string[]>([]);
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);

  // Once the user has typed something, history updates must not overwrite it
  const dirtyRef = useRef(false);
  const loadedVariantRef = useRef(activeVariant);
  const onSaveRef = useRef(onSaveWeights);
  onSaveRef.current = onSaveWeights;

  useEffect(() => {
    if (loadedVariantRef.current !== activeVariant) {
      loadedVariantRef.current = activeVariant;
      dirtyRef.current = false;
    }
    if (dirtyRef.current) return;

    const lastSeries = historyEntry?.serie || [];
    // Same exercise can have a different number of sets in another day: reuse the last known weight
    const fallback = [...lastSeries].reverse().find((v) => v !== null && v !== undefined);
    const todayReps = isTodayEntry ? historyEntry?.reps || [] : [];
    const sets = Array.from({ length: exercise.serie });

    setWeights(sets.map((_, i) => String(lastSeries[i] ?? fallback ?? "")));
    setReps(sets.map((_, i) => String(todayReps[i] ?? "")));
    setCompletedSets(sets.map((_, i) => todayReps[i] !== null && todayReps[i] !== undefined));
  }, [historyEntry, isTodayEntry, exercise.serie, activeVariant]);

  // Sets that are ticked or have reps typed in count as done; the rest is not written to history
  const buildEntry = (onlyDone: boolean) => {
    const include = (i: number) => !onlyDone || completedSets[i] || toNumber(reps[i] ?? "") !== null;
    return {
      serie: weights.map((w, i) => (include(i) ? toNumber(w) : null)),
      reps: reps.map((r, i) => (include(i) ? toNumber(r) : null)),
    };
  };

  // Autosave shortly after each change, so nothing depends on pressing "Salva"
  useEffect(() => {
    if (!dirtyRef.current) return;
    const timeout = setTimeout(() => {
      const entry = buildEntry(true);
      if (entry.serie.every((v) => v === null) && entry.reps.every((v) => v === null)) return;
      onSaveRef.current(currentExerciseName, entry.serie, entry.reps);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weights, reps, completedSets]);

  const handleWeightChange = (index: number, val: string) => {
    dirtyRef.current = true;
    setWeights((prev) => prev.map((w, i) => (i === index ? val : w)));
  };

  const handleRepsChange = (index: number, val: string) => {
    dirtyRef.current = true;
    setReps((prev) => prev.map((r, i) => (i === index ? val : r)));
  };

  const toggleSetComplete = (index: number) => {
    dirtyRef.current = true;
    const nowDone = !completedSets[index];
    setCompletedSets((prev) => prev.map((done, i) => (i === index ? nowDone : done)));

    // If marked complete and was not complete before, start timer!
    if (nowDone && exercise.recupero > 0) {
      onStartTimer(exercise.recupero, `${currentExerciseName} (Set ${index + 1})`);
    }
  };

  const handleSave = () => {
    const entry = buildEntry(false);
    onSaveWeights(currentExerciseName, entry.serie, entry.reps);
    toast({
      title: "Sessione salvata!",
      description: `Carichi e ripetizioni aggiornati per ${currentExerciseName}.`,
    });
  };

  const previousReps = isTodayEntry ? [] : historyEntry?.reps || [];
  const lastSets = (historyEntry?.serie || [])
    .map((kg, i) => ({ kg, reps: historyEntry?.reps?.[i] }))
    .filter((set) => set.kg !== null && set.kg > 0);

  // Format last update date
  let formattedDate = "Mai registrato";
  if (historyEntry?.data) {
    try {
      formattedDate = format(parseISO(historyEntry.data), "dd/MM/yyyy");
    } catch {
      formattedDate = historyEntry.data;
    }
  }

  // Muscle group icon helper
  const getIcon = (grp: string) => {
    const g = grp.toLowerCase();
    if (g.includes("petto") || g.includes("bicipiti") || g.includes("tricipiti") || g.includes("brach")) {
      return <Dumbbell className="h-5 w-5 text-primary" />;
    }
    if (g.includes("gambe") || g.includes("femorali") || g.includes("glutei")) {
      return <Footprints className="h-5 w-5 text-emerald-600" />;
    }
    if (g.includes("dorso") || g.includes("spalle") || g.includes("deltoidi")) {
      return <Activity className="h-5 w-5 text-sky-600" />;
    }
    if (g.includes("addome") || g.includes("core")) {
      return <Shield className="h-5 w-5 text-amber-600" />;
    }
    return <Dumbbell className="h-5 w-5 text-muted-foreground" />;
  };

  return (
    <Card className="border-border bg-card shadow-sm hover:shadow transition-all duration-200">
      <CardHeader className="p-4 sm:p-5 pb-3">
        {/* Header line: Name, Variants, Badges, Timer button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {getIcon(exercise.gruppo)}
              <CardTitle className="text-base sm:text-lg font-bold">
                {currentExerciseName}
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-normal">
                {exercise.gruppo}
              </Badge>
              {exercise.superserie && (
                <Badge variant="outline" className="text-xs text-primary border-primary/40 bg-primary/10">
                  Superserie con {exercise.superserie}
                </Badge>
              )}
              {exercise.opzionale && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-500/40 bg-amber-500/10">
                  Opzionale
                </Badge>
              )}
            </div>

            {/* If variants exist, show switch pills */}
            {exercise.varianti && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs text-muted-foreground font-medium mr-1">Variante:</span>
                {exercise.varianti.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setActiveVariant(v)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                      activeVariant === v
                        ? "bg-primary text-primary-foreground font-medium shadow-sm"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Target and Timer Pill */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <div className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md font-medium">
              {exercise.serie} × {exercise.repsTarget} reps
            </div>
            {exercise.recupero > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onStartTimer(exercise.recupero, currentExerciseName)}
                className="h-8 px-2.5 text-xs flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Timer className="h-3.5 w-3.5" />
                <span>{exercise.recupero}s</span>
              </Button>
            )}
          </div>
        </div>

        {/* Last update note */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1.5">
          <History className="h-3 w-3" />
          <span>Ultimo carico registrato: {formattedDate}</span>
          {lastSets.length > 0 && (
            <span className="font-mono text-foreground font-semibold ml-1">
              ({lastSets.map((set) => formatSet(set.kg, set.reps)).join(" - ")} kg)
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
        {/* Set rows */}
        <div className="space-y-2 pt-2">
          {Array.from({ length: exercise.serie }).map((_, idx) => {
            const isDone = completedSets[idx];
            return (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 p-2 rounded-lg transition-colors ${
                  isDone ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/30"
                }`}
              >
                {/* Set number & reps */}
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleSetComplete(idx)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                        : "border-input hover:border-primary text-transparent hover:text-muted-foreground"
                    }`}
                    title={isDone ? "Set completato" : "Segna come completato"}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <span className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    Set {idx + 1}
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({exercise.repsTarget} reps)
                  </span>
                </div>

                {/* Weight and reps inputs */}
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="0"
                    placeholder="0.0"
                    aria-label={`Peso set ${idx + 1}`}
                    value={weights[idx] ?? ""}
                    onChange={(e) => handleWeightChange(idx, e.target.value)}
                    className="h-9 w-[4.5rem] text-right font-mono font-semibold"
                  />
                  <span className="text-xs text-muted-foreground font-medium">kg ×</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    placeholder={String(previousReps[idx] ?? "rip.")}
                    aria-label={`Ripetizioni set ${idx + 1}`}
                    value={reps[idx] ?? ""}
                    onChange={(e) => handleRepsChange(idx, e.target.value)}
                    className="h-9 w-16 text-right font-mono font-semibold"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <CardFooter className="p-4 sm:p-5 pt-0">
        <Button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium h-10 flex items-center justify-center gap-2 shadow-sm"
        >
          <Save className="h-4 w-4" />
          <span>Salva Sessione</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
