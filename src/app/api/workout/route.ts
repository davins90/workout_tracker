import { NextRequest, NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import path from "path";

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "ai-studio-bucket-746817612779-us-west1";
const FILE_PATH = "data/workout_history.json";
const LOCAL_FILE_PATH = path.join(process.cwd(), "data", "workout_history.json");

async function getStorage() {
  try {
    return new Storage();
  } catch (err) {
    console.warn("Storage client init error:", err);
    return null;
  }
}

export async function GET() {
  // 1. Try GCS
  try {
    const storage = await getStorage();
    if (storage) {
      const bucket = storage.bucket(BUCKET_NAME);
      const file = bucket.file(FILE_PATH);
      const [exists] = await file.exists();
      if (exists) {
        const [contents] = await file.download();
        const data = JSON.parse(contents.toString("utf-8"));
        return NextResponse.json({ source: "cloud", data });
      }
    }
  } catch (err) {
    console.warn("GCS read error, trying local fallback:", err);
  }

  // 2. Fallback to local file
  try {
    if (fs.existsSync(LOCAL_FILE_PATH)) {
      const contents = fs.readFileSync(LOCAL_FILE_PATH, "utf-8");
      const data = JSON.parse(contents);
      return NextResponse.json({ source: "local", data });
    }
  } catch (err) {
    console.warn("Local file read error:", err);
  }

  return NextResponse.json({ source: "empty", data: null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const dataString = JSON.stringify(body, null, 2);

    let savedToCloud = false;

    // 1. Try saving to GCS
    try {
      const storage = await getStorage();
      if (storage) {
        const bucket = storage.bucket(BUCKET_NAME);
        const file = bucket.file(FILE_PATH);
        await file.save(dataString, {
          contentType: "application/json",
          resumable: false,
        });
        savedToCloud = true;
      }
    } catch (err) {
      console.warn("GCS save failed, falling back to local file:", err);
    }

    // 2. Save to local fallback file
    try {
      const dir = path.dirname(LOCAL_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LOCAL_FILE_PATH, dataString, "utf-8");
    } catch (err) {
      console.warn("Local file write error:", err);
    }

    return NextResponse.json({
      success: true,
      savedToCloud,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("API POST error:", err);
    return NextResponse.json({ error: "Failed to save workout data" }, { status: 500 });
  }
}
