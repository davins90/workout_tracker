"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExerciseHistoryMap, WORKOUT_DAYS } from "@/lib/workout-data";
import { Trophy, TrendingUp, Calendar, Dumbbell, BarChart3 } from "lucide-react";
import { format, parseISO } from "date-fns";

export function ProgressCharts({ history }: { history: ExerciseHistoryMap }) {
  // Collect all unique exercise names
  const allExerciseNames = useMemo(() => {
    const set = new Set<string>();
    WORKOUT_DAYS.forEach((day) => {
      day.esercizi.forEach((ex) => {
        set.add(ex.nome);
        if (ex.varianti) {
          ex.varianti.forEach((v) => set.add(v));
        }
      });
    });
    // Also include any other key in history
    Object.keys(history).forEach((name) => set.add(name));
    return Array.from(set).sort();
  }, [history]);

  const [selectedExercise, setSelectedExercise] = useState<string>(
    allExerciseNames[0] || "Panca inclinata multipower"
  );

  const rawEntries = history[selectedExercise] || [];

  // Prepare data points for recharts
  const chartData = useMemo(() => {
    return rawEntries
      .filter((e) => e.serie && e.serie.some((s) => s !== null && s > 0))
      .map((entry) => {
        const validSeries = entry.serie.filter((s): s is number => s !== null && s > 0);
        const maxWeight = validSeries.length > 0 ? Math.max(...validSeries) : 0;
        const setLabels = entry.serie
          .map((kg, i) => ({ kg, reps: entry.reps?.[i] }))
          .filter((set) => set.kg !== null && set.kg > 0)
          .map((set) => (set.reps !== null && set.reps !== undefined ? `${set.kg}×${set.reps}` : `${set.kg}`));
        let displayDate = entry.data;
        try {
          displayDate = format(parseISO(entry.data), "dd/MM");
        } catch {
          // fallback
        }
        return {
          rawDate: entry.data,
          displayDate,
          maxWeight,
          serieStr: setLabels.join(" - ") + " kg",
        };
      })
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [rawEntries]);

  // Statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { maxPR: 0, latestWeight: 0, progress: 0, sessionsCount: 0 };
    }
    const maxPR = Math.max(...chartData.map((d) => d.maxWeight));
    const latest = chartData[chartData.length - 1];
    const first = chartData[0];
    const progress = latest.maxWeight - first.maxWeight;
    return {
      maxPR,
      latestWeight: latest.maxWeight,
      progress,
      sessionsCount: chartData.length,
    };
  }, [chartData]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Exercise Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border shadow-sm">
        <div>
          <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Progressione Carichi
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Monitora l'aumento dei pesi (overload progressivo) nel tempo
          </p>
        </div>
        <div className="w-full sm:w-72">
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-full bg-background">
              <SelectValue placeholder="Seleziona esercizio" />
            </SelectTrigger>
            <SelectContent>
              {allExerciseNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span>Record (PR)</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.maxPR > 0 ? `${stats.maxPR} kg` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span>Ultimo Peso</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.latestWeight > 0 ? `${stats.latestWeight} kg` : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span>Delta Totale</span>
            </div>
            <div
              className={`text-2xl font-bold ${
                stats.progress > 0
                  ? "text-emerald-500"
                  : stats.progress < 0
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {stats.sessionsCount > 1
                ? `${stats.progress > 0 ? "+" : ""}${stats.progress} kg`
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground pb-1">
              <Calendar className="h-4 w-4 text-sky-500" />
              <span>Sessioni</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.sessionsCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg">
                Andamento Carico Massimo: {selectedExercise}
              </CardTitle>
              <CardDescription className="text-xs">
                Valore massimo registrato nelle serie per ciascuna sessione
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {chartData.length} dati
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {chartData.length > 1 ? (
            <div className="h-64 sm:h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="displayDate"
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis
                    tickLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    domain={["auto", "auto"]}
                    unit="kg"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      fontSize: "0.85rem",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: unknown) => [`${value} kg`, "Carico Max"]}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : chartData.length === 1 ? (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Dumbbell className="h-8 w-8 mx-auto opacity-50" />
              <p className="font-medium text-foreground">
                Una sola sessione registrata ({chartData[0].maxWeight} kg in data {chartData[0].displayDate})
              </p>
              <p className="text-xs">
                Registra un altro allenamento per visualizzare la linea di progresso!
              </p>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground space-y-2">
              <Dumbbell className="h-8 w-8 mx-auto opacity-40" />
              <p className="font-medium text-foreground">Nessun dato salvato per questo esercizio</p>
              <p className="text-xs">
                Compila i pesi nella scheda di allenamento e premi &quot;Salva Pesi&quot;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History Log Table */}
      {chartData.length > 0 && (
        <Card className="bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Cronologia Sessioni</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {chartData.slice().reverse().map((entry, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{entry.rawDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">Serie: {entry.serieStr}</span>
                    <Badge variant="secondary" className="font-bold">
                      {entry.maxWeight} kg
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
