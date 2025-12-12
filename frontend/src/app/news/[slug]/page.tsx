import { getPostBySlug } from "@/lib/content";
import Link from "next/link";

// Definição correta para Next.js 15+: params é uma Promise
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  // Aguardamos a resolução dos parâmetros
  const { slug } = await params;
  
  const post = await getPostBySlug(slug);

  // DEBUG MODE: Se não encontrar, mostra o que tentou buscar
  if (!post) {
    return (
      <div className="container mx-auto p-12 text-gray-900 dark:text-slate-100">
        <h1 className="text-2xl font-bold text-red-600">Erro 404 - Post não encontrado</h1>
        <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-800 rounded border border-gray-200 dark:border-slate-700">
          <p><strong>Slug recebido da URL:</strong> {slug}</p>
          <p>Verifique se existe um arquivo na pasta <code>content/news</code> com esse nome exato (mais .md).</p>
        </div>
        <Link href="/" className="mt-4 inline-block text-blue-600 dark:text-blue-300 hover:underline">
          Voltar para Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <article className="container mx-auto px-4 max-w-3xl text-gray-900 dark:text-slate-100">
        {/* Botão Voltar */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-300 transition-colors"
          >
            ← Voltar para Home
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          {/* Imagem de Capa */}
          {post.thumbnail && (
            <div className="w-full h-64 md:h-96 relative">
              <img
                src={post.thumbnail}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8 md:p-12">
            {/* Cabeçalho do Artigo */}
            <header className="mb-8">
              <time className="text-sm text-blue-600 dark:text-blue-300 font-semibold mb-2 block">
                {new Date(post.date).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </time>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-xl text-gray-600 dark:text-slate-200 leading-relaxed">
                  {post.description}
                </p>
              )}
            </header>

            <hr className="border-gray-100 dark:border-slate-800 mb-8" />

            {/* Conteúdo do Artigo (HTML) */}
            <div 
              className="prose prose-lg prose-blue max-w-none text-gray-700 dark:text-slate-200 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.contentHtml || "" }}
            />
          </div>
        </div>
      </article>
    </main>
  );
}
