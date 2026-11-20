import type { ExerciseHistoryMap, WorkoutDay } from "./workout-data";

export interface SessionSummary {
  date: string; // "yyyy-MM-dd"
  dayId: string; // which program day it was
  exercises: number;
  sets: number;
  minutes: number | null; // first to last edit, when timestamps exist
}

const countSets = (serie: (number | null)[]) => serie.filter((v) => v !== null && v !== undefined).length;

// Every exercise name a day can record, variants included
function dayNames(day: WorkoutDay): Set<string> {
  const names = new Set<string>();
  for (const ex of day.esercizi) {
    names.add(ex.nome);
    for (const v of ex.varianti ?? []) names.add(v);
  }
  return names;
}

// The most recent training day and which program day it matches.
// Exercises shared by several days (chest press, lateral raises) do not decide; the others do.
export function lastSession(history: ExerciseHistoryMap, days: WorkoutDay[]): SessionSummary | null {
  const byDate = new Map<string, { name: string; sets: number; ts?: number }[]>();
  for (const [name, entries] of Object.entries(history)) {
    for (const e of entries) {
      const sets = countSets(e.serie);
      if (sets === 0) continue;
      const list = byDate.get(e.data) ?? [];
      list.push({ name, sets, ts: e.ts });
      byDate.set(e.data, list);
    }
  }
  if (byDate.size === 0 || days.length === 0) return null;

  const date = Array.from(byDate.keys()).sort().at(-1)!;
  const rows = byDate.get(date)!;

  const namesPerDay = days.map(dayNames);
  const scores = namesPerDay.map((names, i) =>
    rows.filter((r) => names.has(r.name) && namesPerDay.every((other, j) => j === i || !other.has(r.name))).length
  );
  const best = scores.indexOf(Math.max(...scores));

  const stamps = rows.map((r) => r.ts).filter((t): t is number => typeof t === "number");
  const minutes = stamps.length >= 2 ? Math.round((Math.max(...stamps) - Math.min(...stamps)) / 60000) : null;

  return {
    date,
    dayId: days[best].id,
    exercises: rows.length,
    sets: rows.reduce((n, r) => n + r.sets, 0),
    minutes,
  };
}

// The day after the last one, in program order
export function nextDayId(last: SessionSummary | null, days: WorkoutDay[]): string | null {
  if (days.length === 0) return null;
  if (!last) return days[0].id;
  const i = days.findIndex((d) => d.id === last.dayId);
  return days[(i + 1) % days.length].id;
}
