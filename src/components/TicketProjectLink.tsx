"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
export function TicketProjectLink({ id, version, projectId, projects }: { id: string; version: number; projectId: string | null; projects: { id: string; name: string }[] }) {
  const [selected, setSelected] = useState(projectId ?? ""), [error, setError] = useState(""), [loading, setLoading] = useState(false), router = useRouter();
  return <form className="space-y-2" onSubmit={async e => { e.preventDefault(); setLoading(true); setError(""); try { await requestJson("/api/tickets/" + id, jsonOptions("PATCH", { projectId: selected || null, version })); router.refresh(); } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); } }}>
    <label className="block">Project<select className="field" value={selected} onChange={e => setSelected(e.target.value)}><option value="">No project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <p className="text-xs text-neutral-400">The creator and assigned technician must have access to the selected project.</p>
    {error && <p role="alert" className="text-red-400">{error}</p>}<button className="btn" disabled={loading || selected === (projectId ?? "")}>Save project link</button>
  </form>;
}