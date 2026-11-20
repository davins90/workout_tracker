import type { WeightHistoryEntry } from "./workout-data";

// Upper bound of the target range ("8–12" -> 12)
export function topOfRange(range: string): number | null {
  const nums = range.match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : null;
}

// Typical next jump for the gym's equipment: small dumbbells by 1 kg, heavier ones by 2, machines and barbell by 5
export function weightStep(kg: number): number {
  if (kg < 10) return 1;
  if (kg < 25) return 2;
  return 5;
}

// Double progression: when the sets done with the heaviest weight of the last session all reached
// the top of the range, it is time to add weight (pyramids count by their top weight)
export function progressionHint(
  entry: WeightHistoryEntry | undefined,
  repsTarget: string,
  plannedSets: number
): { fromKg: number; toKg: number } | null {
  const top = topOfRange(repsTarget);
  if (!entry || top === null) return null;
  const sets = entry.serie
    .map((kg, i) => ({ kg, reps: entry.reps?.[i] }))
    .filter((s): s is { kg: number; reps: number } => typeof s.kg === "number" && s.kg > 0 && typeof s.reps === "number");
  if (sets.length < plannedSets) return null;
  const maxKg = Math.max(...sets.map((s) => s.kg));
  if (!sets.filter((s) => s.kg === maxKg).every((s) => s.reps >= top)) return null;
  return { fromKg: maxKg, toKg: maxKg + weightStep(maxKg) };
}

// Variant to show when nothing was picked: the one used today, else the most recently used, else the first
export function defaultVariant(
  variants: string[],
  latestDate: (name: string) => string | undefined,
  today: string
): string {
  let best = variants[0];
  let bestDate = "";
  for (const v of variants) {
    const d = latestDate(v);
    if (d === today) return v;
    if (d && d > bestDate) {
      best = v;
      bestDate = d;
    }
  }
  return best;
}
