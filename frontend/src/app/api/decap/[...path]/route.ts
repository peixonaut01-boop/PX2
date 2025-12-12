import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Backend completo para o Decap CMS
const CONTENT_DIR = path.join(process.cwd(), "content", "news");
const MEDIA_DIR = path.join(process.cwd(), "public", "images", "uploads");

// Garantir que os diretórios existem
if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}
if (!fs.existsSync(MEDIA_DIR)) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const apiPath = pathArray.join("/");

  console.log("[Decap API] GET:", apiPath);

  try {
    // Listar todas as entradas da coleção "news"
    if (apiPath === "collections/news/entries" || apiPath === "collections/news" || apiPath === "") {
      const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith(".md"));
      
      const entries = files.map(file => {
        const fullPath = path.join(CONTENT_DIR, file);
        const rawContent = fs.readFileSync(fullPath, "utf-8");
        const { data, content } = matter(rawContent);
        const slug = file.replace(".md", "");
        
        // Formato que o Decap CMS espera
        return {
          file: {
            path: `content/news/${file}`,
            id: slug,
          },
          data: {
            ...data,
            body: content
          },
          slug,
        };
      });

      console.log(`[Decap API] Retornando ${entries.length} entradas`);

      return NextResponse.json(entries, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Ler uma entrada específica
    if (apiPath.startsWith("collections/news/entries/")) {
      const slug = apiPath.replace("collections/news/entries/", "");
      const fileName = `${slug}.md`;
      const fullPath = path.join(CONTENT_DIR, fileName);

      if (!fs.existsSync(fullPath)) {
        return new NextResponse("Entry not found", { status: 404 });
      }

      const rawContent = fs.readFileSync(fullPath, "utf-8");
      const { data, content } = matter(rawContent);

      return NextResponse.json({
        slug,
        path: `content/news/${fileName}`,
        data: {
          ...data,
          body: content
        },
        raw: rawContent
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (error) {
    console.error("[Decap API] GET Error:", error);
    return new NextResponse(`Error: ${error}`, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const apiPath = pathArray.join("/");

  console.log("[Decap API] POST:", apiPath);

  try {
    const body = await request.json();
    console.log("[Decap API] Body:", body);

    // Criar nova entrada
    if (apiPath === "collections/news/entries") {
      const { entry } = body;
      const { data } = entry;

      // Gerar slug a partir do título
      const slug = data.title ? slugify(data.title) : `noticia-${Date.now()}`;
      const fileName = `${slug}.md`;
      const fullPath = path.join(CONTENT_DIR, fileName);

      // Extrair o body do data
      const { body: contentBody, ...frontmatter } = data;

      // Criar conteúdo do arquivo
      const fileContent = matter.stringify(contentBody || "", frontmatter);

      // Salvar arquivo
      fs.writeFileSync(fullPath, fileContent, "utf-8");

      console.log("[Decap API] Entrada criada:", fullPath);

      return NextResponse.json({
        slug,
        path: `content/news/${fileName}`,
        data: data
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse("Not Implemented", { status: 501 });
  } catch (error) {
    console.error("[Decap API] POST Error:", error);
    return new NextResponse(`Error: ${error}`, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const apiPath = pathArray.join("/");

  console.log("[Decap API] PUT:", apiPath);

  try {
    const body = await request.json();

    // Atualizar entrada existente
    if (apiPath.startsWith("collections/news/entries/")) {
      const slug = apiPath.replace("collections/news/entries/", "");
      const { entry } = body;
      const { data } = entry;

      const fileName = `${slug}.md`;
      const fullPath = path.join(CONTENT_DIR, fileName);

      if (!fs.existsSync(fullPath)) {
        return new NextResponse("Entry not found", { status: 404 });
      }

      // Extrair o body do data
      const { body: contentBody, ...frontmatter } = data;

      // Criar conteúdo do arquivo
      const fileContent = matter.stringify(contentBody || "", frontmatter);

      // Atualizar arquivo
      fs.writeFileSync(fullPath, fileContent, "utf-8");

      console.log("[Decap API] Entrada atualizada:", fullPath);

      return NextResponse.json({
        slug,
        path: `content/news/${fileName}`,
        data: data
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse("Not Implemented", { status: 501 });
  } catch (error) {
    console.error("[Decap API] PUT Error:", error);
    return new NextResponse(`Error: ${error}`, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const apiPath = pathArray.join("/");

  console.log("[Decap API] DELETE:", apiPath);

  try {
    // Deletar entrada
    if (apiPath.startsWith("collections/news/entries/")) {
      const slug = apiPath.replace("collections/news/entries/", "");
      const fileName = `${slug}.md`;
      const fullPath = path.join(CONTENT_DIR, fileName);

      if (!fs.existsSync(fullPath)) {
        return new NextResponse("Entry not found", { status: 404 });
      }

      // Deletar arquivo
      fs.unlinkSync(fullPath);

      console.log("[Decap API] Entrada deletada:", fullPath);

      return NextResponse.json({
        message: "Entry deleted",
        slug
      }, {
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    return new NextResponse("Not Implemented", { status: 501 });
  } catch (error) {
    console.error("[Decap API] DELETE Error:", error);
    return new NextResponse(`Error: ${error}`, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
