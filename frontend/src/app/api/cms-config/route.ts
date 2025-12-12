import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Servir o config.yml para o Decap CMS
export async function GET() {
  const configPath = path.join(process.cwd(), "public", "admin", "config.yml");
  
  if (!fs.existsSync(configPath)) {
    return new NextResponse("Config file not found", { status: 404 });
  }

  const content = fs.readFileSync(configPath, "utf-8");
  
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

