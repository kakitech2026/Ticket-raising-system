import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleWhere,staffSelect } from "@/lib/policy";
import { ArticleMarkdown } from "@/components/Markdown";
import { ArticleActions } from "./ArticleActions";
export default async function ArticlePage({params}:{params:Promise<{id:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id)return notFound();
  const article=await prisma.article.findFirst({where:{AND:[{id:(await params).id},articleWhere(session.user)]},include:{assignee:{select:staffSelect},author:{select:staffSelect}}});if(!article)return notFound();
  return <div className="max-w-4xl mx-auto space-y-6"><Link href="/kb">? Knowledge base</Link><article className="panel space-y-4"><h1 className="text-3xl font-semibold">{article.title}</h1><p className="text-sm text-neutral-400">Restricted ? Assigned to {article.assignee.name} ? Updated {article.updatedAt.toLocaleDateString()}</p>{session.user.role!=="EMPLOYEE"&&<ArticleActions articleId={article.id}/>}<ArticleMarkdown content={article.content}/></article></div>;
}