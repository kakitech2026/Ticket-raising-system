"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { statusLabels } from "@/lib/policy";
export function TicketFilters() {
  const router=useRouter(), params=useSearchParams(), path=usePathname();
  const [query,setQuery]=useState(params.get("q") ?? ""), [pending,startTransition]=useTransition();
  function change(name:string,value:string) { const next=new URLSearchParams(params.toString()); if(value)next.set(name,value);else next.delete(name);next.delete("page");startTransition(()=>router.replace(path+"?"+next.toString(),{scroll:false})); }
  return <div className="space-y-3"><form className="flex gap-2" onSubmit={e=>{e.preventDefault();change("q",query);}}><label className="flex-1"><span className="sr-only">Search tickets</span><input className="field mt-0" placeholder="Search tickets" maxLength={160} value={query} onChange={e=>setQuery(e.target.value)} /></label><button className="btn" disabled={pending}>Search</button></form>
    <div className="flex flex-wrap gap-3">
      <label>Status<select className="field" value={params.get("status")??""} onChange={e=>change("status",e.target.value)}><option value="">All statuses</option>{Object.entries(statusLabels).filter(([s])=>!["APPROVED","IN_TESTING"].includes(s)).map(([s,label])=><option key={s} value={s}>{label}</option>)}</select></label>
      <label>Priority<select className="field" value={params.get("priority")??""} onChange={e=>change("priority",e.target.value)}><option value="">All priorities</option>{["LOW","MEDIUM","HIGH","CRITICAL"].map(v=><option key={v}>{v}</option>)}</select></label>
      <label>Department<select className="field" value={params.get("department")??""} onChange={e=>change("department",e.target.value)}><option value="">All departments</option>{["IT","HR","FACILITIES","FINANCE"].map(v=><option key={v}>{v}</option>)}</select></label>
      <a className="btn self-end" href={"/api/export-csv?"+params.toString()}>Export CSV</a>
    </div>{pending&&<p role="status">Updating results?</p>}
  </div>;
}