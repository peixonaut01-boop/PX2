import React from "react";
import Link from "next/link";
import { Post } from "@/lib/content";

export function FeaturedNews({ posts }: { posts: Post[] }) {
  if (!posts || posts.length === 0) return null;

  const mainPost = posts[0];
  const otherPosts = posts.slice(1, 4);

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white border-l-4 border-blue-600 pl-3">
          Destaques PX Economics
        </h2>
        <Link
          href="/news"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Notícia Principal */}
        <div className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-md border-0 dark:border dark:border-slate-700 h-full flex flex-col transition hover:shadow-lg">
          {mainPost.thumbnail && (
            <Link href={`/news/${mainPost.slug}`} className="block relative h-64 w-full overflow-hidden">
              <img
                src={mainPost.thumbnail}
                alt={mainPost.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            </Link>
          )}
          <div className="p-6 flex-1 flex flex-col">
            <p className="text-xs text-gray-700 dark:text-slate-300 mb-2">
              {new Date(mainPost.date).toLocaleDateString("pt-BR")}
            </p>
            <Link href={`/news/${mainPost.slug}`}>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                {mainPost.title}
              </h3>
            </Link>
            <p className="text-gray-800 dark:text-slate-200 line-clamp-3 mb-4 flex-1">
              {mainPost.description}
            </p>
            <Link
              href={`/news/${mainPost.slug}`}
              className="inline-flex items-center text-blue-600 dark:text-blue-400 font-semibold mt-auto hover:underline hover:text-blue-700 dark:hover:text-blue-300"
            >
              Ler análise completa →
            </Link>
          </div>
        </div>

        {/* Lista de Outras Notícias */}
        <div className="space-y-6">
          {otherPosts.map((post) => (
            <div
              key={post.slug}
              className="group bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-0 dark:border dark:border-slate-700 hover:shadow-md transition-all"
            >
              <Link href={`/news/${post.slug}`} className="flex gap-4 items-start">
                {post.thumbnail && (
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-700 dark:text-slate-300 mb-1">
                    {new Date(post.date).toLocaleDateString("pt-BR")}
                  </p>
                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  <p className="text-sm text-gray-800 dark:text-slate-200 line-clamp-2 mt-2">
                    {post.description}
                  </p>
                </div>
              </Link>
            </div>
          ))}
          {otherPosts.length === 0 && (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-slate-700 rounded-xl border border-dashed border-gray-300 dark:border-slate-600 p-8 text-center">
              <p className="text-gray-700 dark:text-slate-400">Mais análises em breve...</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
