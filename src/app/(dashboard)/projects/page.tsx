import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectWhere, ticketWhere } from "@/lib/policy";
import { Pagination } from "@/components/Pagination";
export const metadata={title:"Projects | Tickety"};
export default async function ProjectsPage({searchParams}:{searchParams:Promise<{page?:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id)return null;
  const page=Math.max(1,Number((await searchParams).page)||1),where=projectWhere(session.user);
  const [projects,total]=await Promise.all([prisma.project.findMany({where,take:25,skip:(page-1)*25,orderBy:{createdAt:"desc"},select:{id:true,name:true,description:true,status:true,_count:{select:{tickets:{where:ticketWhere(session.user)}}}}}),prisma.project.count({where})]);
  return <div className="space-y-6"><div className="flex justify-between"><h1 className="text-2xl font-semibold">Projects</h1><Link className="btn" href="/projects/new">Create project</Link></div><p className="text-neutral-400">Only projects you own or belong to appear here. Admins can access all projects.</p><div className="panel divide-y divide-neutral-800">{projects.map(p=><Link className="block py-4" href={"/projects/"+p.id} key={p.id}><h2 className="font-medium text-indigo-400">{p.name}</h2><p className="text-neutral-400 line-clamp-2">{p.description}</p><p className="text-sm">{p.status.replaceAll("_"," ")} ? {p._count.tickets} accessible tickets</p></Link>)}{!projects.length&&<p>No projects yet.</p>}</div><Pagination page={page} total={total} base="/projects"/></div>;
}