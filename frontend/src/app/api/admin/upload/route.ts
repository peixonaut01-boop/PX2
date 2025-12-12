import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "uploads");

function ensureDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

// POST /api/admin/upload  -> recebe um arquivo e salva em public/images/uploads
export async function POST(req: NextRequest) {
  ensureDir();

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return new NextResponse("No file uploaded", { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const safeName =
    Date.now().toString() +
    "-" +
    file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

  const filePath = path.join(UPLOAD_DIR, safeName);
  fs.writeFileSync(filePath, buffer);

  const publicUrl = `/images/uploads/${safeName}`;

  return NextResponse.json({ url: publicUrl, name: file.name });
}


