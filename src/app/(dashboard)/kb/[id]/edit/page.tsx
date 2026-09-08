import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleWhere } from "@/lib/policy";
import { ArticleEditor } from "@/components/ArticleEditor";
export default async function EditArticle({params}:{params:Promise<{id:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id||session.user.role==="EMPLOYEE")return notFound();
  const article=await prisma.article.findFirst({where:{AND:[{id:(await params).id},articleWhere(session.user)]}});if(!article)return notFound();
  return <div className="max-w-3xl mx-auto space-y-6"><h1 className="text-2xl font-semibold">Edit article</h1><ArticleEditor article={article} canAssign={session.user.role==="ADMIN"} initialAssigneeId={article.assigneeId}/></div>;
}