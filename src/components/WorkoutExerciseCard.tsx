"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Exercise, WeightHistoryEntry } from "@/lib/workout-data";
import {
  Activity,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  History,
  RotateCcw,
  Save,
  Shield,
  Snowflake,
  Timer,
} from "lucide-react";
import { format, parseISO } from "date-fns";

interface WorkoutExerciseCardProps {
  exercise: Exercise;
  historyEntry?: WeightHistoryEntry;
  onSaveWeights: (exerciseName: string, series: (number | null)[]) => void;
  onStartTimer: (seconds: number, exerciseName: string) => void;
}

export function WorkoutExerciseCard({
  exercise,
  historyEntry,
  onSaveWeights,
  onStartTimer,
}: WorkoutExerciseCardProps) {
  const { toast } = useToast();

  // Handle variants (e.g. Scheda C: Chest press vs Panca inclinata)
  const [activeVariant, setActiveVariant] = useState<string>(
    exercise.varianti && exercise.varianti.length > 0 ? exercise.varianti[0] : exercise.nome
  );

  const currentExerciseName = activeVariant;

  // Local state for weights in current session
  const [weights, setWeights] = useState<(string | number)[]>([]);
  // Local state for completed sets checkmark
  const [completedSets, setCompletedSets] = useState<boolean[]>([]);

  useEffect(() => {
    const totalSets = exercise.serie;
    const existingSeries = historyEntry?.serie || [];
    setWeights(
      Array(totalSets)
        .fill("")
        .map((_, i) =>
          existingSeries[i] !== null && existingSeries[i] !== undefined
            ? existingSeries[i]!
            : ""
        )
    );
    setCompletedSets(Array(totalSets).fill(false));
  }, [historyEntry, exercise.serie, activeVariant]);

  const handleWeightChange = (index: number, val: string) => {
    const updated = [...weights];
    updated[index] = val;
    setWeights(updated);
  };

  const toggleSetComplete = (index: number) => {
    const updated = [...completedSets];
    updated[index] = !updated[index];
    setCompletedSets(updated);

    // If marked complete and was not complete before, start timer!
    if (updated[index] && exercise.recupero > 0) {
      onStartTimer(exercise.recupero, `${currentExerciseName} (Set ${index + 1})`);
    }
  };

  const handleSave = () => {
    const parsedSeries = weights.map((w) =>
      w === "" || isNaN(Number(w)) ? null : Number(w)
    );
    onSaveWeights(currentExerciseName, parsedSeries);
    toast({
      title: "Pesi salvati!",
      description: `Carichi aggiornati per ${currentExerciseName}.`,
    });
  };

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
          {historyEntry?.serie && historyEntry.serie.some((s) => s !== null && s > 0) && (
            <span className="font-mono text-foreground font-semibold ml-1">
              ({historyEntry.serie.filter((s) => s !== null && s > 0).join(" - ")} kg)
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

                {/* Weight input */}
                <div className="flex items-center gap-2 w-32 sm:w-36">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.0"
                    value={weights[idx] ?? ""}
                    onChange={(e) => handleWeightChange(idx, e.target.value)}
                    className="h-9 text-right font-mono font-semibold"
                  />
                  <span className="text-xs text-muted-foreground font-medium">kg</span>
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
          <span>Salva Pesi Sessione</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
