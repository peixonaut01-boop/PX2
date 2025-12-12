import Link from "next/link";
import { IbgeNewsItem } from "@/lib/ibge";

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function NewsCard({ article }: { article: IbgeNewsItem }) {
  return (
    <Link
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full min-h-[260px] flex-col justify-between rounded-2xl border-0 dark:border dark:border-slate-700 bg-white dark:bg-slate-800 p-6 pb-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:min-h-[340px]"
    >
      <div>
        <p className="text-sm text-gray-700 dark:text-slate-300">{formatDate(article.isoDate)}</p>
        <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">
          {article.title}
        </h3>
        <p className="mt-3 text-gray-800 dark:text-slate-200">{article.content}</p>
      </div>
      <div className="mt-4 inline-flex items-center text-sm font-semibold text-blue-700 dark:text-blue-400 transition group-hover:text-blue-900 dark:group-hover:text-blue-300">
        Ler no site do IBGE
        <span
          aria-hidden="true"
          className="ml-2 transition group-hover:translate-x-1"
        >
          →
        </span>
      </div>
    </Link>
  );
}
