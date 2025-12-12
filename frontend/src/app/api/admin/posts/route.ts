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

// GET /api/admin/posts  -> lista posts
export async function GET() {
  ensureDir();
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".md"));

  const posts = files
    .map((file) => {
      const fullPath = path.join(CONTENT_DIR, file);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const { data } = matter(raw);
      const slug = file.replace(".md", "");
      return {
        slug,
        title: data.title || slug,
        date: data.date || new Date().toISOString(),
        description: data.description || "",
      };
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));

  return NextResponse.json(posts);
}

// POST /api/admin/posts  -> cria novo post
export async function POST(req: NextRequest) {
  ensureDir();
  const body = await req.json();

  const title: string = body.title || "Nova notícia";
  const slug = slugify(title);
  const fileName = `${slug}.md`;
  const fullPath = path.join(CONTENT_DIR, fileName);

  const frontmatter: any = {
    title,
    date: body.date || new Date().toISOString(),
    thumbnail: body.thumbnail || "/images/uploads/placeholder.webp",
    description: body.description || "",
  };

  const content = body.body || "";

  const fileContent = matter.stringify(content, frontmatter);
  fs.writeFileSync(fullPath, fileContent, "utf-8");

  return NextResponse.json({ slug, path: `content/news/${fileName}` });
}


