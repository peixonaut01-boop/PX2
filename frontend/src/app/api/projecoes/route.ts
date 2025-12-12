import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const PROJECOES_FILE = path.join(process.cwd(), "public", "data", "projecoes.json");

export async function GET() {
  try {
    const data = await fs.readFile(PROJECOES_FILE, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Erro ao ler projeções:", error);
    return NextResponse.json({ error: "Erro ao carregar projeções" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Update metadata
    data.metadata = {
      last_updated: new Date().toISOString(),
      updated_by: "admin",
    };

    // Write to file
    await fs.writeFile(PROJECOES_FILE, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Projeções salvas com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar projeções:", error);
    return NextResponse.json({ error: "Erro ao salvar projeções" }, { status: 500 });
  }
}

