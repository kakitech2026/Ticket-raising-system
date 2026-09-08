import { notFound } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/policy";
import { ArticleEditor } from "@/components/ArticleEditor";
export default async function CreateArticle({searchParams}:{searchParams:Promise<{ticketId?:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id||session.user.role==="EMPLOYEE")return notFound();
  const {ticketId}=await searchParams;
  const ticket=ticketId?await prisma.ticket.findFirst({where:{AND:[{id:ticketId,status:"COMPLETED"},ticketWhere(session.user)]},select:{id:true,title:true,resolutionSummary:true,assigneeId:true}}):null;
  if(ticketId&&!ticket)return notFound();
  return <div className="max-w-3xl mx-auto space-y-6"><h1 className="text-2xl font-semibold">Draft restricted article</h1><ArticleEditor sourceTicketId={ticket?.id} initialTitle={ticket?.title} initialContent={ticket?.resolutionSummary??""} canAssign={session.user.role==="ADMIN"} initialAssigneeId={ticket?.assigneeId??session.user.id}/></div>;
}