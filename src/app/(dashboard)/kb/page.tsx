import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Search, Plus, BookOpen } from "lucide-react";

export default async function KnowledgeBasePage() {
  const session = await getServerSession(authOptions);
  const canCreate = session?.user && ["ADMIN", "TECH"].includes(session.user.role);

  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Knowledge Base</h1>
          <p className="text-neutral-400 mt-1">Browse frequently asked questions and troubleshooting guides.</p>
        </div>
        {canCreate && (
          <Link href="/kb/new" className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Link>
        )}
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <BookOpen className="w-12 h-12 text-neutral-600 mb-4" />
            <h3 className="text-lg font-medium text-neutral-300">No articles yet</h3>
            <p className="text-neutral-500 mt-1">Check back later for helpful guides.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {articles.map(article => (
              <Link key={article.id} href={`/kb/${article.id}`} className="group block p-6 bg-neutral-800/30 border border-neutral-700 rounded-xl hover:border-indigo-500/50 hover:bg-neutral-800/50 transition-all">
                <h3 className="text-lg font-semibold text-neutral-200 group-hover:text-indigo-400 transition-colors line-clamp-1">{article.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 line-clamp-3">{article.content}</p>
                <div className="mt-4 pt-4 border-t border-neutral-700/50 flex items-center justify-between text-xs text-neutral-500">
                  <span>By {article.author.name}</span>
                  <span>{article.createdAt.toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
