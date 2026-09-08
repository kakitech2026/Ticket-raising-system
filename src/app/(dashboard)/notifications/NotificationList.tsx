"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestJson,jsonOptions,errorMessage } from "@/lib/client-api";
type Notification={id:string;message:string;ticketId:string|null;isRead:boolean;createdAt:Date};
export function NotificationList({initialNotifications}:{initialNotifications:Notification[]}){
  const router=useRouter(),[error,setError]=useState(""),[busy,setBusy]=useState(false);
  async function mark(id?:string){setBusy(true);setError("");try{await requestJson("/api/notifications",jsonOptions("PATCH",id?{id}:{markAll:true}));window.dispatchEvent(new Event("notifications-updated"));router.refresh();}catch(e){setError(errorMessage(e));}finally{setBusy(false);}}
  return <div className="space-y-4">{error&&<p role="alert" className="text-red-400">{error}</p>}<button className="btn" disabled={busy} onClick={()=>mark()}>Mark all read</button>{initialNotifications.map(n=><article className="border-b border-neutral-800 py-4 space-y-2" key={n.id}><p>{n.message}</p><p suppressHydrationWarning className="text-sm text-neutral-400">{n.createdAt.toLocaleString()}</p><div className="flex gap-4">{n.ticketId&&<Link href={"/tickets/"+n.ticketId} className="text-indigo-400">View ticket</Link>}{!n.isRead&&<button disabled={busy} onClick={()=>mark(n.id)}>Mark read</button>}</div></article>)}</div>;
}