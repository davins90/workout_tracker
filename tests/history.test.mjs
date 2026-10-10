import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeHistories, sanitizeHistory, historiesEqual } from "../src/lib/history.ts";

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
