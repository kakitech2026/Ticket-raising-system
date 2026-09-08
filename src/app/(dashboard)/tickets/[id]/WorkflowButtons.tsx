"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, TicketStatus } from "@prisma/client";
import { canTransition, activeStatuses, statusLabels } from "@/lib/policy";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
import { readImages } from "@/lib/client-images";
const labels: Partial<Record<TicketStatus, string>> = { IN_REVIEW: "Start review", ACCEPTED: "Accept ticket", REJECTED: "Reject", IN_PROGRESS: "Start work", COMPLETED: "Mark completed", RE_REVIEW: "Request re-review" };
export function WorkflowButtons({ ticketId, currentStatus, userRole, assigneeId, creatorId, currentUserId, version }: { ticketId: string; currentStatus: TicketStatus; userRole: Role; assigneeId: string | null; creatorId: string; currentUserId: string; version: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false), [error, setError] = useState("");
  const [action, setAction] = useState<TicketStatus | null>(null), [reason, setReason] = useState(""), [date, setDate] = useState("");
  const [images, setImages] = useState<string[]>([]), [uploading, setUploading] = useState(false);
  const actor = { id: currentUserId, role: userRole }, ticket = { status: currentStatus, assigneeId, creatorId };
  const allowed = (Object.keys(labels) as TicketStatus[]).filter(target => canTransition(actor, ticket, target));
  async function submit(target: TicketStatus) {
    setLoading(true); setError("");
    try {
      await requestJson("/api/tickets/" + ticketId + "/status", jsonOptions("PATCH", {
        status: target, version,
        ...(["REJECTED", "RE_REVIEW"].includes(target) ? { reason, images } : {}),
        ...(target === "COMPLETED" ? { resolutionSummary: reason } : {}),
        ...(target === "ACCEPTED" ? { dueDate: new Date(date).toISOString() } : {}),
      }));
      setAction(null); setReason(""); setDate(""); setImages([]); router.refresh();
    } catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  async function claim() {
    setLoading(true); setError("");
    try { await requestJson("/api/tickets/" + ticketId + "/assign", jsonOptions("PATCH", { version })); router.refresh(); }
    catch (e) { setError(errorMessage(e)); } finally { setLoading(false); }
  }
  return <div className="space-y-3">
    {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
    {!assigneeId && userRole !== "EMPLOYEE" && activeStatuses.includes(currentStatus) && <button className="btn" disabled={loading} onClick={claim}>Claim ticket</button>}
    {!action && <div className="flex flex-wrap gap-2">{allowed.map(target => <button key={target} className="btn" disabled={loading} onClick={() => ["IN_REVIEW", "IN_PROGRESS"].includes(target) ? submit(target) : setAction(target)}>{labels[target]}</button>)}</div>}
    {action && <form className="space-y-3 border border-neutral-700 p-4 rounded-lg" onSubmit={e => { e.preventDefault(); void submit(action); }}>
      <h3 className="font-medium">{labels[action] || statusLabels[action]}</h3>
      {action === "ACCEPTED" ? <label className="block">Estimated completion date<input required className="field" type="date" value={date} onChange={e => setDate(e.target.value)} /><span className="text-sm text-neutral-400">This estimate does not change the SLA deadline.</span></label>
        : <label className="block">{action === "COMPLETED" ? "Resolution summary" : "Reason"}<textarea required maxLength={20000} className="field" rows={3} value={reason} onChange={e => setReason(e.target.value)} /></label>}
      {action === "RE_REVIEW" && <><p className="text-sm text-neutral-400">{["COMPLETED", "REJECTED"].includes(currentStatus) ? "A new SLA cycle starts. Previous results remain in history." : "The current SLA deadline continues."}</p><label className="block">Screenshots (up to three, 1 MB each)<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={uploading || loading} onChange={async e => { const files = Array.from(e.target.files || []); e.target.value = ""; setUploading(true); try { setImages(prev => prev); const next = await readImages(files, images.length); setImages(prev => [...prev, ...next]); } catch (e) { setError(errorMessage(e)); } finally { setUploading(false); } }} /></label><p>{images.length} screenshots attached <button type="button" onClick={() => setImages([])}>Clear</button></p></>}
      <div className="flex gap-2"><button className="btn" disabled={loading || uploading}>{loading ? "Saving?" : "Confirm"}</button><button type="button" disabled={loading} onClick={() => { setAction(null); setReason(""); setImages([]); }}>Cancel</button></div>
    </form>}
  </div>;
}