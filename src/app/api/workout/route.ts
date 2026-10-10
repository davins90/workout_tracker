import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { createHash, timingSafeEqual } from "crypto";
import fs from "fs";
import path from "path";
import { mergeHistories, sanitizeHistory } from "@/lib/history";
import type { ExerciseHistoryMap } from "@/lib/workout-data";

export const dynamic = "force-dynamic";

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "workout-tracker-uexmt-data";
const FILE_PATH = "data/workout_history.json";
const LOCAL_FILE_PATH = path.join(process.cwd(), "data", "workout_history.json");
const MAX_BODY_BYTES = 1_000_000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

const storage = new Storage();

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

// Returns an error response when the request is not allowed, null otherwise
function checkAccess(req: NextRequest): NextResponse | null {
  const expected = process.env.APP_ACCESS_CODE;
  if (!expected) {
    if (!IS_PRODUCTION) return null;
    return NextResponse.json({ error: "Codice di accesso non configurato sul server" }, { status: 503 });
  }
  const header = req.headers.get("authorization") || "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!provided || !timingSafeEqual(digest(provided), digest(expected))) {
    return NextResponse.json({ error: "Codice di accesso mancante o errato" }, { status: 401 });
  }
  return null;
}

async function readCloud(): Promise<{ data: ExerciseHistoryMap; generation: number }> {
  const file = storage.bucket(BUCKET_NAME).file(FILE_PATH);
  try {
    const [contents] = await file.download();
    const generation = Number(file.metadata.generation ?? (await file.getMetadata())[0].generation);
    return { data: sanitizeHistory(JSON.parse(contents.toString("utf-8"))) ?? {}, generation };
  } catch (err) {
    if ((err as { code?: number }).code === 404) return { data: {}, generation: 0 };
    throw err;
  }
}

// Merges the incoming history into the stored one; the generation check stops two devices overwriting each other
async function mergeIntoCloud(incoming: ExerciseHistoryMap): Promise<ExerciseHistoryMap> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: current, generation } = await readCloud();
    const merged = mergeHistories(current, incoming);
    try {
      await storage
        .bucket(BUCKET_NAME)
        .file(FILE_PATH, { preconditionOpts: { ifGenerationMatch: generation } })
        .save(JSON.stringify(merged, null, 2), { contentType: "application/json", resumable: false });
      return merged;
    } catch (err) {
      if ((err as { code?: number }).code !== 412) throw err;
      lastError = err;
    }
  }
  throw lastError;
}

function readLocal(): ExerciseHistoryMap {
  if (!fs.existsSync(LOCAL_FILE_PATH)) return {};
  return sanitizeHistory(JSON.parse(fs.readFileSync(LOCAL_FILE_PATH, "utf-8"))) ?? {};
}

export async function GET(req: NextRequest) {
  const denied = checkAccess(req);
  if (denied) return denied;

  try {
    const { data } = await readCloud();
    return NextResponse.json({ source: "cloud", data });
  } catch (err) {
    console.error("GCS read error:", err);
    if (IS_PRODUCTION) {
      return NextResponse.json({ error: "Lettura dal cloud non riuscita" }, { status: 502 });
    }
  }

  // Development only: local file instead of the bucket
  try {
    return NextResponse.json({ source: "local", data: readLocal() });
  } catch (err) {
    console.error("Local file read error:", err);
    return NextResponse.json({ error: "Lettura locale non riuscita" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const denied = checkAccess(req);
  if (denied) return denied;

  const raw = await req.text();
  if (Buffer.byteLength(raw, "utf-8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Dati troppo grandi" }, { status: 413 });
  }

  let incoming: ExerciseHistoryMap | null = null;
  try {
    incoming = sanitizeHistory(JSON.parse(raw));
  } catch {
    incoming = null;
  }
  if (!incoming) {
    return NextResponse.json({ error: "Formato dati non valido" }, { status: 400 });
  }

  try {
    const data = await mergeIntoCloud(incoming);
    return NextResponse.json({ success: true, savedToCloud: true, data });
  } catch (err) {
    console.error("GCS save error:", err);
    if (IS_PRODUCTION) {
      return NextResponse.json(
        { success: false, error: "Salvataggio sul cloud non riuscito" },
        { status: 502 }
      );
    }
  }

  // Development only: local file instead of the bucket
  try {
    const data = mergeHistories(readLocal(), incoming);
    fs.mkdirSync(path.dirname(LOCAL_FILE_PATH), { recursive: true });
    fs.writeFileSync(LOCAL_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true, savedToCloud: false, data });
  } catch (err) {
    console.error("Local file write error:", err);
    return NextResponse.json({ success: false, error: "Salvataggio non riuscito" }, { status: 500 });
  }
}
