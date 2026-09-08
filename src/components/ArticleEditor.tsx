"use client";
import { useEffect,useState } from "react";
import { useRouter } from "next/navigation";
import { ArticleMarkdown } from "./Markdown";
import { requestJson,jsonOptions,errorMessage } from "@/lib/client-api";
export function ArticleEditor({article,sourceTicketId,initialTitle="",initialContent="",canAssign=false,initialAssigneeId}:{article?:{id:string;title:string;content:string;assigneeId:string};sourceTicketId?:string;initialTitle?:string;initialContent?:string;canAssign?:boolean;initialAssigneeId:string}){
  const router=useRouter(),[title,setTitle]=useState(article?.title??initialTitle),[content,setContent]=useState(article?.content??initialContent),[assigneeId,setAssignee]=useState(article?.assigneeId??initialAssigneeId),[staff,setStaff]=useState<{id:string;name:string}[]>([]);
  const [preview,setPreview]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState("");
  useEffect(()=>{if(canAssign)requestJson<{id:string;name:string}[]>("/api/users").then(setStaff).catch(e=>setError(errorMessage(e)));},[canAssign]);
  return <form className="panel space-y-4" onSubmit={async e=>{e.preventDefault();setLoading(true);setError("");try{const result=await requestJson<{id:string}>(article?"/api/kb/"+article.id:"/api/kb",jsonOptions(article?"PATCH":"POST",{title,content,...(canAssign?{assigneeId}:{}),...(!article&&sourceTicketId?{sourceTicketId}:{})}));router.push("/kb/"+result.id);router.refresh();}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}}>
    <p className="text-sm text-neutral-400">Restricted to admins and the assigned staff member. Review the resolution for private details before publishing.</p>
    {error&&<p role="alert" className="text-red-400">{error}</p>}
    <label className="block">Title<input className="field" required maxLength={160} value={title} onChange={e=>setTitle(e.target.value)}/></label>
    {canAssign&&<label className="block">Assigned reader/editor<select className="field" value={assigneeId} onChange={e=>setAssignee(e.target.value)}>{staff.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>}
    <button type="button" className="text-indigo-400" onClick={()=>setPreview(v=>!v)}>{preview?"Edit Markdown":"Preview"}</button>
    {preview?<ArticleMarkdown content={content}/>:<label className="block">Content (Markdown)<textarea className="field font-mono" required maxLength={20000} rows={12} value={content} onChange={e=>setContent(e.target.value)}/></label>}
    <button className="btn" disabled={loading||!title.trim()||!content.trim()}>{loading?"Saving?":article?"Save article":"Publish restricted article"}</button>
  </form>;
}