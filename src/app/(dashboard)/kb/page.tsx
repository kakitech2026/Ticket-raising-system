import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { articleWhere } from "@/lib/policy";
import { Pagination } from "@/components/Pagination";
export default async function KnowledgeBase({searchParams}:{searchParams:Promise<{page?:string;q?:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id)return null;
  const params=await searchParams,page=Math.max(1,Number(params.page)||1),q=(params.q??"").trim().slice(0,160);
  const where={AND:[articleWhere(session.user),...(q?[{title:{contains:q,mode:"insensitive" as const}}]:[])]};
  const [articles,total]=await Promise.all([prisma.article.findMany({where,take:25,skip:(page-1)*25,orderBy:{updatedAt:"desc"},select:{id:true,title:true,updatedAt:true}}),prisma.article.count({where})]);
  return <div className="space-y-6"><div className="flex justify-between gap-3"><h1 className="text-2xl font-semibold">Knowledge base</h1>{session.user.role!=="EMPLOYEE"&&<Link className="btn" href="/kb/new">New article</Link>}</div><p className="text-neutral-400">Articles are private to admins and their assigned staff member.</p><form className="flex gap-2"><label className="flex-1"><span className="sr-only">Search articles</span><input className="field mt-0" name="q" defaultValue={q} placeholder="Search accessible articles"/></label><button className="btn">Search</button></form><div className="panel divide-y divide-neutral-800">{articles.map(a=><Link key={a.id} className="block py-4 text-indigo-400" href={"/kb/"+a.id}>{a.title}</Link>)}{!articles.length&&<p>No accessible articles match your search.</p>}</div><Pagination page={page} total={total} base="/kb" params={params}/></div>;
}