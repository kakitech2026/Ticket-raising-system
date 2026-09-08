"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
type Member={id:string;name:string};
export type EditableProject={id:string;name:string;description:string;status:string;startDate:string|null;endDate:string|null;version:number;members:Member[]};
export function ProjectForm({ project, canManage=true }: {project?:EditableProject;canManage?:boolean}) {
  const router=useRouter();
  const [name,setName]=useState(project?.name??""),[description,setDescription]=useState(project?.description??""),[status,setStatus]=useState(project?.status??"PLANNING");
  const [start,setStart]=useState(project?.startDate?.slice(0,10)??""),[end,setEnd]=useState(project?.endDate?.slice(0,10)??"");
  const [members,setMembers]=useState<string[]>(project?.members.map(m=>m.id)??[]),[directory,setDirectory]=useState<Member[]>(project?.members??[]),[search,setSearch]=useState("");
  const [loading,setLoading]=useState(false),[loadingUsers,setLoadingUsers]=useState(canManage),[error,setError]=useState("");
  useEffect(()=>{if(!canManage)return;let active=true;requestJson<Member[]>("/api/users?directory=members&q="+encodeURIComponent(search)).then(users=>{if(active){setDirectory(users);setLoadingUsers(false);}}).catch(e=>{if(active){setError(errorMessage(e));setLoadingUsers(false);}});return()=>{active=false;};},[search,canManage]);
  return <form className="panel space-y-4" onSubmit={async e=>{e.preventDefault();setLoading(true);setError("");try{const result=await requestJson<{id:string}>(project?"/api/projects/"+project.id:"/api/projects",jsonOptions(project?"PATCH":"POST",{description,status,startDate:start?new Date(start).toISOString():null,endDate:end?new Date(end).toISOString():null,...(canManage?{name,members}:{}),...(project?{version:project.version}:{})}));router.push("/projects/"+result.id);router.refresh();}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}}>
    {error&&<p role="alert" className="text-red-400">{error}</p>}
    <label className="block">Name<input className="field" required maxLength={160} value={name} disabled={!canManage} onChange={e=>setName(e.target.value)} /></label>
    <label className="block">Description<textarea className="field" required maxLength={20000} rows={4} value={description} onChange={e=>setDescription(e.target.value)}/></label>
    <label className="block">Status<select className="field" value={status} onChange={e=>setStatus(e.target.value)}>{["PLANNING","ACTIVE","ON_HOLD","COMPLETED"].map(s=><option key={s}>{s}</option>)}</select></label>
    <div className="grid sm:grid-cols-2 gap-4"><label>Start date<input className="field" type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>End date<input className="field" type="date" min={start||undefined} value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
    {canManage&&<fieldset className="space-y-2"><legend className="font-medium">Members</legend><label className="block"><span className="sr-only">Find members</span><input className="field" placeholder="Find a member by name" value={search} onChange={e=>setSearch(e.target.value)} /></label><p className="text-sm text-neutral-400">{members.length} selected. The owner is always retained.</p>{loadingUsers?<p>Loading members?</p>:directory.length?directory.map(m=><label className="flex gap-2 items-center" key={m.id}><input type="checkbox" checked={members.includes(m.id)} onChange={e=>setMembers(prev=>e.target.checked?[...prev,m.id]:prev.filter(id=>id!==m.id))}/>{m.name}</label>):<p>No matching active users.</p>}</fieldset>}
    {!canManage&&<p className="text-sm text-neutral-400">Members can edit status, description, and dates. The owner or admin manages membership.</p>}
    <div className="flex flex-wrap gap-3"><button className="btn" disabled={loading}>{loading?"Saving?":"Save project"}</button>{project&&canManage&&<button type="button" className="text-red-400" disabled={loading} onClick={async()=>{if(!confirm("Delete this project? Linked tickets must be removed first."))return;setLoading(true);try{await requestJson("/api/projects/"+project.id,{method:"DELETE"});router.push("/projects");router.refresh();}catch(e){setError(errorMessage(e));}finally{setLoading(false);}}}>Delete project</button>}</div>
  </form>;
}