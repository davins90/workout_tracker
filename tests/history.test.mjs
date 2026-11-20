import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeHistories, sanitizeHistory, historiesEqual, hasSets } from "../src/lib/history.ts";

test("merge keeps entries that exist on only one side", () => {
  const cloud = { Panca: [{ data: "2026-10-01", serie: [40] }] };
  const local = { Panca: [{ data: "2026-10-05", serie: [42.5] }], Curl: [{ data: "2026-10-05", serie: [10] }] };
  const merged = mergeHistories(cloud, local);
  assert.deepEqual(merged.Panca.map((e) => e.data), ["2026-10-01", "2026-10-05"]);
  assert.equal(merged.Curl.length, 1);
});

test("same day: newest edit wins regardless of side", () => {
  const older = { Panca: [{ data: "2026-10-05", serie: [40], ts: 100 }] };
  const newer = { Panca: [{ data: "2026-10-05", serie: [45], ts: 200 }] };
  assert.deepEqual(mergeHistories(older, newer).Panca[0].serie, [45]);
  assert.deepEqual(mergeHistories(newer, older).Panca[0].serie, [45]);
});

test("same day without timestamps: preferred side wins", () => {
  const a = { Panca: [{ data: "2026-10-05", serie: [40] }] };
  const b = { Panca: [{ data: "2026-10-05", serie: [45] }] };
  assert.deepEqual(mergeHistories(a, b).Panca[0].serie, [45]);
});

test("merge output is sorted by date", () => {
  const a = { Panca: [{ data: "2026-10-09", serie: [1] }, { data: "2026-10-01", serie: [1] }] };
  assert.deepEqual(mergeHistories(a, {}).Panca.map((e) => e.data), ["2026-10-01", "2026-10-09"]);
});

test("sanitize rejects non-objects and drops malformed entries", () => {
  assert.equal(sanitizeHistory("x"), null);
  assert.equal(sanitizeHistory([]), null);
  assert.equal(sanitizeHistory(null), null);
  const clean = sanitizeHistory({
    Panca: [
      { data: "2026-10-05", serie: [40, "x", -1], reps: [8, null, 7], ts: 5, extra: true },
      { data: "oggi", serie: [40] },
      { data: "2026-10-06" },
    ],
    Vuoto: "nope",
  });
  assert.deepEqual(clean, { Panca: [{ data: "2026-10-05", serie: [40, null, null], reps: [8, null, 7], ts: 5 }] });
});

test("historiesEqual ignores key and entry order", () => {
  const a = { B: [{ data: "2026-10-02", serie: [1] }], A: [{ data: "2026-10-01", serie: [1] }] };
  const b = { A: [{ data: "2026-10-01", serie: [1] }], B: [{ data: "2026-10-02", serie: [1] }] };
  assert.ok(historiesEqual(a, b));
  assert.ok(!historiesEqual(a, {}));
});

test("an empty newer entry deletes a day on every device", () => {
  const phone = { Panca: [{ data: "2026-11-09", serie: [10, 12], ts: 1 }] };
  const cloud = sanitizeHistory({ Panca: [{ data: "2026-11-09", serie: [], ts: 2 }] });
  const merged = mergeHistories(cloud, phone);
  assert.equal(merged.Panca.length, 1);
  assert.equal(merged.Panca.filter(hasSets).length, 0);
});

import { lastSession, nextDayId } from "../src/lib/sessions.ts";

const DAYS = [
  { id: "scheda-a", esercizi: [{ nome: "Panca inclinata multipower", varianti: ["Panca piana bilanciere"] }, { nome: "Chest press" }, { nome: "Lat machine" }] },
  { id: "scheda-b", esercizi: [{ nome: "Chest press" }, { nome: "Pulley" }, { nome: "Romanian deadlift" }] },
];

test("last session: latest date, matched by exercises unique to a day", () => {
  const h = {
    "Chest press": [{ data: "2026-11-09", serie: [25] }, { data: "2026-11-14", serie: [30, 30], ts: 1000 }],
    "Panca piana bilanciere": [{ data: "2026-11-09", serie: [20, 30] }],
    Pulley: [{ data: "2026-11-14", serie: [25, 30, 35], ts: 1000 + 30 * 60000 }],
  };
  const last = lastSession(h, DAYS);
  assert.deepEqual(last, { date: "2026-11-14", dayId: "scheda-b", exercises: 2, sets: 5, minutes: 30 });
  assert.equal(nextDayId(last, DAYS), "scheda-a");
});

test("last session ignores deletion markers and empty history", () => {
  assert.equal(lastSession({}, DAYS), null);
  assert.equal(nextDayId(null, DAYS), "scheda-a");
  const h = { "Lat machine": [{ data: "2026-11-09", serie: [40] }], Pulley: [{ data: "2026-11-20", serie: [] }] };
  assert.equal(lastSession(h, DAYS).dayId, "scheda-a");
  assert.equal(nextDayId(lastSession(h, DAYS), DAYS), "scheda-b");
});

import { progressionHint, defaultVariant } from "../src/lib/progression.ts";

test("progression hint when the heaviest sets hit the top of the range", () => {
  assert.deepEqual(progressionHint({ data: "d", serie: [30, 30, 30], reps: [12, 12, 12] }, "8–12", 3), { fromKg: 30, toKg: 35 });
  assert.deepEqual(progressionHint({ data: "d", serie: [8, 8, 8], reps: [12, 13, 12] }, "8–12", 3), { fromKg: 8, toKg: 9 });
  assert.equal(progressionHint({ data: "d", serie: [30, 30, 30], reps: [12, 12, 11] }, "8–12", 3), null);
  assert.deepEqual(progressionHint({ data: "d", serie: [70, 80, 90], reps: [12, 12, 12] }, "8–12", 3), { fromKg: 90, toKg: 95 });
  assert.equal(progressionHint({ data: "d", serie: [25, 30, 35], reps: [12, 12, 8] }, "8–12", 3), null);
  assert.equal(progressionHint({ data: "d", serie: [30, 30], reps: [12, 12] }, "8–12", 3), null);
  assert.equal(progressionHint(undefined, "8–12", 3), null);
});

test("default variant: today's, else most recent, else first", () => {
  const dates = { A: "2026-10-31", B: "2026-11-09" };
  assert.equal(defaultVariant(["A", "B", "C"], (v) => dates[v], "2026-11-20"), "B");
  assert.equal(defaultVariant(["A", "B"], (v) => ({ A: "2026-11-20", B: "2026-11-09" })[v], "2026-11-20"), "A");
  assert.equal(defaultVariant(["A", "B"], () => undefined, "2026-11-20"), "A");
});
