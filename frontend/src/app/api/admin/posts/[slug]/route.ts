import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const runtime = "nodejs";

const CONTENT_DIR = path.join(process.cwd(), "content", "news");

function ensureDir() {
  if (!fs.existsSync(CONTENT_DIR)) {
    fs.mkdirSync(CONTENT_DIR, { recursive: true });
  }
}

// GET /api/admin/posts/[slug]  -> obter um post
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  ensureDir();
  const { slug } = await params;

  const fileName = `${slug}.md`;
  const fullPath = path.join(CONTENT_DIR, fileName);

  if (!fs.existsSync(fullPath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const raw = fs.readFileSync(fullPath, "utf-8");
  const { data, content } = matter(raw);

  return NextResponse.json({
    slug,
    title: data.title || slug,
    date: data.date || new Date().toISOString(),
    description: data.description || "",
    thumbnail: data.thumbnail || "/images/uploads/placeholder.webp",
    body: content,
  });
}

// PUT /api/admin/posts/[slug]  -> atualizar um post
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  ensureDir();
  const { slug } = await params;

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));
  const target = files.find((file) => file.replace(/\.md$/, "") === slug);

  if (!target) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fullPath = path.join(CONTENT_DIR, target);

  const body = await req.json();

  const frontmatter: any = {
    title: body.title || slug,
    date: body.date || new Date().toISOString(),
    thumbnail: body.thumbnail || "/images/uploads/placeholder.webp",
    description: body.description || "",
  };

  const content = body.body || "";

  const fileContent = matter.stringify(content, frontmatter);
  fs.writeFileSync(fullPath, fileContent, "utf-8");

  return NextResponse.json({ slug, path: `content/news/${target}` });
}


