import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, User } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { ArticleActions } from "./ArticleActions";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const article = await prisma.article.findUnique({
    where: { id },
    include: { author: { select: { name: true, role: true } } }
  });

  if (!article) return notFound();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href="/kb" className="inline-flex items-center text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Knowledge Base
      </Link>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden">
        <div className="p-8 border-b border-neutral-800">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">Support Article</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-100">{article.title}</h1>
          <div className="flex items-center gap-6 mt-6 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Written by <span className="text-neutral-300 font-medium">{article.author.name}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Last updated: {article.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
          
          {(session?.user?.id === article.authorId || session?.user?.role === "ADMIN") && (
            <ArticleActions articleId={article.id} />
          )}
        </div>
        
        <div className="p-8">
          <div className="prose prose-invert prose-indigo max-w-none">
            {article.content.split('\n').map((paragraph, idx) => (
              <p key={idx} className="mb-4 text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
