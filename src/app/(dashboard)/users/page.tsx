import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userSelect } from "@/lib/policy";
import { DeleteUserButton } from "@/components/DeleteUserButton";
import { UserAdmin,ResetUser } from "@/components/UserAdmin";
import { Pagination } from "@/components/Pagination";
export default async function UsersPage({searchParams}:{searchParams:Promise<{page?:string}>}){
 const session=await getServerSession(authOptions);if(session?.user?.role!=="ADMIN")return notFound();
 const page=Math.max(1,Number((await searchParams).page)||1);
 const [users,total]=await Promise.all([prisma.user.findMany({orderBy:{name:"asc"},take:25,skip:(page-1)*25,select:userSelect}),prisma.user.count()]);
 return <div className="space-y-6"><h1 className="text-2xl font-semibold">User administration</h1><UserAdmin/><section className="panel divide-y divide-neutral-800">{users.map(u=><article key={u.id} className="py-4 flex flex-wrap justify-between gap-4"><div><h2 className="font-medium">{u.name}</h2><p className="text-neutral-400">{u.email} ? {u.role} ? {u.isActive?"Active":"Deactivated"}</p></div>{u.isActive&&u.id!==session.user.id&&<div className="space-y-2"><DeleteUserButton userId={u.id} userName={u.name}/><ResetUser userId={u.id}/></div>}</article>)}</section><Pagination page={page} total={total} base="/users"/></div>;
}