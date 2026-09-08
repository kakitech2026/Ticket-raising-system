"use client";
import { useSession } from "next-auth/react";
import { usePathname,useRouter } from "next/navigation";
import { useState } from "react";
import { Navigation } from "./Sidebar";
import { NotificationBell } from "./NotificationBell";
export function Topbar(){
  const {data:session}=useSession(),path=usePathname(),router=useRouter(),[query,setQuery]=useState("");
  const section=path.split("/")[1]||"dashboard";
  return <header className="relative flex flex-wrap gap-3 items-center justify-between border-b border-neutral-800 bg-neutral-900 px-4 py-3">
    <details key={path} className="md:hidden"><summary className="cursor-pointer px-2 py-1">Menu</summary><div className="absolute left-0 right-0 top-full z-40 border-b border-neutral-700 bg-neutral-900 p-4 max-h-[75vh] overflow-auto"><Navigation userRole={session?.user?.role}/></div></details>
    <p className="capitalize font-medium">{section}</p>
    <form className="hidden lg:flex flex-1 max-w-sm gap-2" onSubmit={e=>{e.preventDefault();router.push("/tickets?q="+encodeURIComponent(query));}}><label className="flex-1"><span className="sr-only">Search tickets</span><input className="field mt-0" maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search tickets"/></label><button className="text-sm">Search</button></form>
    <div className="flex items-center gap-3"><NotificationBell/><span className="hidden sm:block text-sm text-neutral-300 max-w-40 truncate">{session?.user?.name}</span></div>
  </header>;
}