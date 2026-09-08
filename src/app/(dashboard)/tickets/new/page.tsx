"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
import { readImages } from "@/lib/client-images";
type Choice = { id: string; name: string };
export default function CreateTicketPage() {
  const router = useRouter(), requestKey = useRef<string | null>(null);
  const [title, setTitle] = useState(""), [description, setDescription] = useState(""), [priority, setPriority] = useState("MEDIUM"), [department, setDepartment] = useState("IT"), [assigneeId, setAssignee] = useState(""), [projectId, setProject] = useState("");
  const [staff, setStaff] = useState<Choice[]>([]), [projects, setProjects] = useState<Choice[]>([]), [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false), [uploading, setUploading] = useState(false), [error, setError] = useState("");
  useEffect(() => { let active = true; Promise.all([requestJson<Choice[]>("/api/users"), requestJson<Choice[]>("/api/projects")]).then(([s,p]) => { if(active) { setStaff(s); setProjects(p); } }).catch(e => { if(active) setError(errorMessage(e)); }); return () => { active = false; }; }, []);
  return <div className="max-w-3xl mx-auto space-y-6"><Link href="/tickets" className="text-indigo-400">? Tickets</Link><h1 className="text-2xl font-semibold">Create ticket</h1>
    <form className="panel space-y-5" onChange={() => { if (!loading) requestKey.current = null; }} onSubmit={async e => {
      e.preventDefault(); setLoading(true); setError(""); requestKey.current ??= crypto.randomUUID();
      try { const result = await requestJson<{ id: string }>("/api/tickets", jsonOptions("POST", { title, description, priority, department, assigneeId: assigneeId || undefined, projectId: projectId || undefined, images, requestKey: requestKey.current })); router.push("/tickets/" + result.id); router.refresh(); }
      catch(e) { setError(errorMessage(e)); } finally { setLoading(false); }
    }}>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <label className="block">Title<input className="field" required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} /></label>
      <label className="block">Description<textarea className="field" required maxLength={20000} rows={5} value={description} onChange={e => setDescription(e.target.value)} /></label>
      <div className="grid sm:grid-cols-2 gap-4"><label>Priority<select className="field" value={priority} onChange={e => setPriority(e.target.value)}>{["LOW","MEDIUM","HIGH","CRITICAL"].map(p => <option key={p}>{p}</option>)}</select></label><label>Department<select className="field" value={department} onChange={e => setDepartment(e.target.value)}>{["IT","HR","FACILITIES","FINANCE"].map(d => <option key={d}>{d}</option>)}</select></label></div>
      <label className="block">Reviewing technician<select className="field" value={assigneeId} onChange={e => setAssignee(e.target.value)}><option value="">Unassigned queue</option>{staff.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><span className="text-sm text-neutral-400">Your selected technician reviews this directly.</span></label>
      <label className="block">Project<select className="field" value={projectId} onChange={e => setProject(e.target.value)}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><span className="text-sm text-neutral-400">The selected technician must also have access to the project.</span></label>
      <label className="block">Screenshots (PNG, JPEG or WebP; three files, 1 MB each)<input className="field" type="file" multiple accept="image/png,image/jpeg,image/webp" disabled={uploading || loading} onChange={async e => { const files=Array.from(e.target.files || []); e.target.value=""; setUploading(true); try { const next=await readImages(files,images.length); setImages(prev=>[...prev,...next]); } catch(e) { setError(errorMessage(e)); } finally { setUploading(false); } }} /></label>
      {images.map((_,i)=><div key={i} className="flex justify-between"><span>Screenshot {i+1}</span><button type="button" onClick={()=>setImages(prev=>prev.filter((_,j)=>j!==i))}>Remove</button></div>)}
      <button className="btn" disabled={loading || uploading}>{loading ? "Submitting?" : "Submit ticket"}</button>
    </form>
  </div>;
}