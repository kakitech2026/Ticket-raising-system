"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Image as ImageIcon, X } from "lucide-react";

export function WorkflowButtons({
  ticketId,
  currentStatus,
  userRole,
  assigneeId,
  requestedAssigneeId,
  creatorId,
  currentUserId,
}: {
  ticketId: string;
  currentStatus: string;
  userRole: string;
  assigneeId: string | null;
  requestedAssigneeId?: string | null;
  creatorId: string;
  currentUserId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [isRequestingReReview, setIsRequestingReReview] = useState(false);
  const [reReviewReason, setReReviewReason] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const router = useRouter();

  const updateStatus = async (status: string, reason?: string, date?: string, imagesToUpload?: string[], assigneeToSet?: string | null) => {
    setLoading(true);
    try {
      const payload: any = { status, reason };
      if (date) payload.dueDate = date;
      if (imagesToUpload && imagesToUpload.length > 0) payload.images = imagesToUpload;
      if (assigneeToSet !== undefined) payload.assigneeId = assigneeToSet;

      await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsRejecting(false);
      setRejectReason("");
      setReReviewReason("");
      setImages([]);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-neutral-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Updating...
      </div>
    );
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const renderReReviewForm = () => (
    <div className="flex flex-col gap-3 w-full max-w-md bg-neutral-900/50 p-4 rounded-xl border border-neutral-800">
      <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Request Re-Review</label>
      <textarea
        autoFocus
        rows={3}
        value={reReviewReason}
        onChange={(e) => setReReviewReason(e.target.value)}
        placeholder="Describe the required changes..."
        className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-orange-500 resize-none"
      />
      
      <div>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors">
            <ImageIcon className="w-4 h-4 mr-2 text-neutral-400" />
            <span className="text-xs font-medium text-neutral-300">Add Screenshots</span>
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
        </div>
        
        {images.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {images.map((img, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border border-neutral-700">
                <img src={img} alt="preview" className="w-full h-16 object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-0.5 right-0.5 p-1 bg-neutral-900/80 rounded-full text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-1">
        <button 
          disabled={!reReviewReason.trim()}
          onClick={() => updateStatus("RE_REVIEW", reReviewReason, undefined, images)} 
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          Submit Request
        </button>
        <button 
          onClick={() => {
            setIsRequestingReReview(false);
            setReReviewReason("");
            setImages([]);
          }} 
          className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const assignToMe = async () => {
    setLoading(true);
    try {
      await fetch(`/api/tickets/${ticketId}/assign`, {
        method: "PATCH",
      });
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isAssignee = currentUserId === assigneeId;
  const isCreator = currentUserId === creatorId;
  const isAdmin = userRole === "ADMIN";
  const canAssign = !assigneeId && ["TECH", "ADMIN"].includes(userRole);

  const renderActions = () => {
    if (!assigneeId && isAdmin && currentStatus === "NEEDS_APPROVAL") {
    if (isRejecting) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <input
              type="text"
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <button 
                disabled={!rejectReason.trim()}
                onClick={() => updateStatus("REJECTED", rejectReason)} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button 
                onClick={() => {
                  setIsRejecting(false);
                  setRejectReason("");
                }} 
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
    }
    return (
      <div className="flex gap-2">
        <button onClick={() => updateStatus("ACCEPTED", undefined, undefined, undefined, currentUserId)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          Accept & Resolve
        </button>
        <button onClick={() => setIsRejecting(true)} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors">
          Reject
        </button>
      </div>
    );
  }

  if (canAssign) {
    return (
      <button onClick={assignToMe} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
        Assign to Me
      </button>
    );
  }

  if (isCreator && !isAssignee && (currentStatus === "COMPLETED" || currentStatus === "IN_PROGRESS")) {
    if (isRequestingReReview) return renderReReviewForm();
    
    return (
      <button onClick={() => setIsRequestingReReview(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
        Request Re-Review
      </button>
    );
  }

  if (isAssignee) {
    if (currentStatus === "NEEDS_APPROVAL") {
      return (
        <button onClick={() => updateStatus("IN_REVIEW")} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors">
          Start Review
        </button>
      );
    }

    if (currentStatus === "IN_REVIEW" || currentStatus === "RE_REVIEW") {
      if (isRejecting) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <input
              type="text"
              autoFocus
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-red-500"
            />
            <div className="flex gap-2">
              <button 
                disabled={!rejectReason.trim()}
                onClick={() => updateStatus("REJECTED", rejectReason)} 
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button 
                onClick={() => {
                  setIsRejecting(false);
                  setRejectReason("");
                }} 
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }

      if (isAccepting) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-sm">
            <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">Estimated Resolution Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-200 focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-2 mt-1">
              <button 
                disabled={!dueDate}
                onClick={() => updateStatus("ACCEPTED", undefined, dueDate ? new Date(dueDate).toISOString() : undefined)} 
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                Confirm Accept
              </button>
              <button 
                onClick={() => {
                  setIsAccepting(false);
                  setDueDate("");
                }} 
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="flex gap-3">
          <button onClick={() => setIsAccepting(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            Accept Ticket
          </button>
          <button onClick={() => setIsRejecting(true)} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors">
            Reject
          </button>
        </div>
      );
    }

    if (currentStatus === "ACCEPTED") {
      return (
        <button onClick={() => updateStatus("IN_PROGRESS")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Mark In Progress
        </button>
      );
    }

    if (currentStatus === "IN_PROGRESS") {
      if (isRequestingReReview) return renderReReviewForm();

      return (
        <div className="flex gap-3 items-start">
          <button onClick={() => updateStatus("COMPLETED")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            Mark as Completed
          </button>
          <button onClick={() => setIsRequestingReReview(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
            Request Re-Review
          </button>
        </div>
      );
    }
    
    if (currentStatus === "COMPLETED") {
       if (isRequestingReReview) return renderReReviewForm();

       return (
        <button onClick={() => setIsRequestingReReview(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors">
          Request Re-Review
        </button>
      );
    }
    }



    return null;
  };

  const actions = renderActions();
  const showAdminForward = isAdmin && requestedAssigneeId && assigneeId !== requestedAssigneeId;

  if (!actions && !showAdminForward) return null;

  return (
    <div className="flex flex-wrap gap-3 items-start">
      {actions}
      {showAdminForward && (
        <button onClick={() => updateStatus("NEEDS_APPROVAL", "Forwarded to requested tech person", undefined, undefined, requestedAssigneeId)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          Forward to Tech
        </button>
      )}
    </div>
  );
}
