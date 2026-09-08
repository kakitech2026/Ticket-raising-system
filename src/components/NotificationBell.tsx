"use client";
import { useEffect,useRef,useState } from "react";
import Link from "next/link";
import { requestJson,jsonOptions,errorMessage } from "@/lib/client-api";
type Notification={id:string;message:string;ticketId:string|null;isRead:boolean;createdAt:string};
export function NotificationBell(){
  const [data,setData]=useState<{notifications:Notification[];unreadCount:number}>({notifications:[],unreadCount:0}),[error,setError]=useState(""),[open,setOpen]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    let active=true;
    const load=()=>{requestJson<typeof data>("/api/notifications").then(v=>{if(active)setData(v);}).catch(e=>{if(active)setError(errorMessage(e));});};
    load();const timer=setInterval(load,30000);window.addEventListener("notifications-updated",load);
    const close=(e:MouseEvent)=>{if(!ref.current?.contains(e.target as Node))setOpen(false);};
    document.addEventListener("mousedown",close);
    return()=>{active=false;clearInterval(timer);window.removeEventListener("notifications-updated",load);document.removeEventListener("mousedown",close);};
  },[]);
  return <div ref={ref} className="relative" onKeyDown={e=>{if(e.key==="Escape")setOpen(false);}}><button aria-label={data.unreadCount+" unread notifications"} aria-expanded={open} onClick={()=>setOpen(v=>!v)} className="p-2 text-sm">Notifications {data.unreadCount>0&&"("+data.unreadCount+")"}</button>
    {open&&<div className="absolute right-0 top-full z-30 w-[min(20rem,85vw)] rounded-lg border border-neutral-700 bg-neutral-900 p-4 shadow-lg"><div className="flex justify-between gap-2"><h2 className="font-medium">Notifications</h2><button aria-label="Close notifications" onClick={()=>setOpen(false)}>?</button></div>{error&&<p role="alert" className="text-red-400 text-sm">{error}</p>}
      {data.unreadCount>0&&<button className="text-sm text-indigo-400 my-2" onClick={async()=>{try{await requestJson("/api/notifications",jsonOptions("PATCH",{markAll:true}));window.dispatchEvent(new Event("notifications-updated"));}catch(e){setError(errorMessage(e));}}}>Mark all read</button>}
      <div className="max-h-72 overflow-auto">{data.notifications.map(n=><Link className={"block border-b border-neutral-800 py-3 text-sm "+(!n.isRead?"text-neutral-100":"text-neutral-400")} href={n.ticketId?"/tickets/"+n.ticketId:"/notifications"} key={n.id} onClick={async()=>{setOpen(false);try{await requestJson("/api/notifications",jsonOptions("PATCH",{id:n.id}));window.dispatchEvent(new Event("notifications-updated"));}catch(e){setError(errorMessage(e));}}}>{n.message}</Link>)}{!data.notifications.length&&<p className="py-3 text-sm">No notifications.</p>}</div><Link className="block mt-3 text-indigo-400 text-sm" href="/notifications" onClick={()=>setOpen(false)}>View all</Link></div>}
  </div>;
}