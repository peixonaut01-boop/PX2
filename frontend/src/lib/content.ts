import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

// Ajuste para garantir o caminho correto independente de onde o processo roda
const contentDirectory = path.join(process.cwd(), "content/news");

export interface Post {
  slug: string;
  title: string;
  date: string;
  thumbnail?: string;
  description?: string;
  content: string;
  contentHtml?: string;
}

export function getAllPosts(): Post[] {
  try {
    console.log(`Buscando posts em: ${contentDirectory}`);
    
    if (!fs.existsSync(contentDirectory)) {
      console.warn("Diretório de conteúdo não encontrado");
      return [];
    }

    const fileNames = fs.readdirSync(contentDirectory);
    const allPostsData = fileNames
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => {
        const slug = fileName.replace(/\.md$/, "");
        const fullPath = path.join(contentDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, "utf8");
        const { data, content } = matter(fileContents);

        return {
          slug,
          title: data.title,
          date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
          thumbnail: data.thumbnail,
          description: data.description,
          content: content,
        };
      });

    return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
  } catch (error) {
    console.error("Erro ao listar posts:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  // Decodifica o slug caso venha com caracteres encoded (ex: %20)
  const decodedSlug = decodeURIComponent(slug);
  const fullPath = path.join(contentDirectory, `${decodedSlug}.md`);
  
  console.log(`Tentando ler post: ${fullPath}`); // DEBUG

  if (!fs.existsSync(fullPath)) {
    console.error(`Arquivo não encontrado: ${fullPath}`);
    return null;
  }

  try {
    const fileContents = fs.readFileSync(fullPath, "utf8");
    const { data, content } = matter(fileContents);

    // Pipeline com suporte a Markdown + matemática (KaTeX) + HTML básico
    const processedContent = await remark()
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeKatex)
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(content);

    const contentHtml = processedContent.toString();

    return {
      slug: decodedSlug,
      contentHtml,
      title: data.title,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      thumbnail: data.thumbnail,
      description: data.description,
      content: content
    };
  } catch (error) {
    console.error(`Erro ao processar post ${slug}:`, error);
    return null;
  }
}
