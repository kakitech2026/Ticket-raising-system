"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { usePush } from "./PushManager";
export function Navigation({userRole}:{userRole?:string}){
  const path=usePathname(),push=usePush(),[busy,setBusy]=useState(false);
  const links=[["Dashboard","/"],["Tickets","/tickets"],["Create ticket","/tickets/new"],["Projects","/projects"],["Knowledge base","/kb"],["Notifications","/notifications"],["Settings","/settings"]];
  if(userRole==="ADMIN")links.push(["Users","/users"]);
  if(userRole==="ADMIN"||userRole==="TECH")links.push(["Unassigned queue","/tickets?queue=unassigned"],["Analytics","/analytics"]);
  return <nav aria-label="Main navigation" className="space-y-1">{links.map(([name,href])=><Link aria-current={path===href?"page":undefined} key={href} href={href} className={"block rounded-lg px-3 py-2 "+(path===href?"bg-indigo-600/15 text-indigo-300":"text-neutral-300 hover:bg-neutral-800")}>{name}</Link>)}<button className="block px-3 py-2 text-neutral-300" disabled={busy} onClick={async()=>{setBusy(true);try{await push.detach();}catch{/* Local subscription is already invalidated; logout must remain available. */}await signOut({callbackUrl:"/login"});}}>Sign out</button></nav>;
}
export function Sidebar({userRole}:{userRole?:string}){return <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-neutral-800 bg-neutral-900 p-4 overflow-y-auto"><Link href="/" className="text-xl font-semibold p-3 mb-4">Tickety</Link><Navigation userRole={userRole}/></aside>;}