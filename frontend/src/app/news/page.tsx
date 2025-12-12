import Link from "next/link";
import { getAllPosts } from "@/lib/content";
import FlashReportsSection from "@/components/FlashReportsSection";

export default function NewsPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Cabeçalho */}
        <div className="mb-12">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6"
          >
            ← Voltar para Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Notícias e Análises
          </h1>
          <p className="text-lg text-gray-800 dark:text-slate-300">
            Análises econômicas e cobertura dos principais indicadores
          </p>
        </div>

        {/* Flash Reports - Data-Driven Analysis */}
        <FlashReportsSection />

        {/* Manual Posts Section */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Análises PX
              </h2>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Artigos e análises da equipe PX Economics
              </p>
            </div>
          </div>

          {/* Lista de Notícias */}
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border-0 dark:border dark:border-slate-700">
              <p className="text-gray-700 dark:text-slate-400 text-lg">Nenhuma análise publicada ainda.</p>
              <p className="text-gray-700 dark:text-slate-500 text-sm mt-2">
                Adicione arquivos .md na pasta <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">content/news</code>
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/news/${post.slug}`}
                  className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-0 dark:border dark:border-slate-700 overflow-hidden hover:shadow-md transition-all flex flex-col"
                >
                  {/* Imagem */}
                  {post.thumbnail && (
                    <div className="w-full h-48 overflow-hidden">
                      <img
                        src={post.thumbnail}
                        alt={post.title}
                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Conteúdo */}
                  <div className="p-6 flex-1 flex flex-col">
                    <time className="text-xs text-gray-700 dark:text-slate-400 mb-2">
                      {new Date(post.date).toLocaleDateString("pt-BR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                      })}
                    </time>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-gray-800 dark:text-slate-300 text-sm line-clamp-3 mb-4 flex-1">
                        {post.description}
                      </p>
                    )}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm mt-auto group-hover:underline hover:text-blue-700 dark:hover:text-blue-300">
                      Ler mais →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
