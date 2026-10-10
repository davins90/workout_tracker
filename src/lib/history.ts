import type { ExerciseHistoryMap, WeightHistoryEntry } from "./workout-data";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SETS = 20;

function sanitizeNumbers(input: unknown): (number | null)[] | null {
  if (!Array.isArray(input) || input.length > MAX_SETS) return null;
  return input.map((v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null));
}

// Returns a clean history map, dropping malformed entries; null if the payload is not a history at all
export function sanitizeHistory(input: unknown): ExerciseHistoryMap | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return null;
  const out: ExerciseHistoryMap = {};
  for (const [name, entries] of Object.entries(input as Record<string, unknown>)) {
    if (!name || name.length > 120 || !Array.isArray(entries)) continue;
    const clean: WeightHistoryEntry[] = [];
    for (const raw of entries) {
      if (typeof raw !== "object" || raw === null) continue;
      const e = raw as Record<string, unknown>;
      const serie = sanitizeNumbers(e.serie);
      if (typeof e.data !== "string" || !DATE_RE.test(e.data) || !serie) continue;
      const entry: WeightHistoryEntry = { data: e.data, serie };
      const reps = sanitizeNumbers(e.reps);
      if (reps) entry.reps = reps;
      if (typeof e.ts === "number" && Number.isFinite(e.ts)) entry.ts = e.ts;
      clean.push(entry);
    }
    if (clean.length > 0) out[name] = clean;
  }
  return out;
}

// Union of two histories, one entry per exercise per day.
// On the same day the most recently edited entry wins; on a tie `preferred` wins.
export function mergeHistories(
  base: ExerciseHistoryMap,
  preferred: ExerciseHistoryMap
): ExerciseHistoryMap {
  const out: ExerciseHistoryMap = {};
  const names = Array.from(new Set([...Object.keys(base), ...Object.keys(preferred)])).sort();
  for (const name of names) {
    const byDate = new Map<string, WeightHistoryEntry>();
    for (const entry of base[name] || []) byDate.set(entry.data, entry);
    for (const entry of preferred[name] || []) {
      const existing = byDate.get(entry.data);
      if (!existing || (entry.ts ?? 0) >= (existing.ts ?? 0)) byDate.set(entry.data, entry);
    }
    out[name] = Array.from(byDate.values()).sort((a, b) => a.data.localeCompare(b.data));
  }
  return out;
}

export function historiesEqual(a: ExerciseHistoryMap, b: ExerciseHistoryMap): boolean {
  return JSON.stringify(mergeHistories(a, {})) === JSON.stringify(mergeHistories(b, {}));
}
