"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function WorkflowButtons({
  ticketId,
  currentStatus,
  userRole,
  assigneeId,
  currentUserId,
}: {
  ticketId: string;
  currentStatus: string;
  userRole: string;
  assigneeId: string | null;
  currentUserId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  const updateStatus = async (status: string, reason?: string) => {
    setLoading(true);
    try {
      await fetch(`/api/tickets/${ticketId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      setIsRejecting(false);
      setRejectReason("");
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
  const canAssign = !assigneeId && ["MANAGER", "TECH"].includes(userRole);

  // If unassigned, allow staff to assign it to themselves
  if (canAssign) {
    return (
      <button onClick={assignToMe} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
        Assign to Me
      </button>
    );
  }

  // If they are the assignee, they get full control
  if (isAssignee) {
    if (currentStatus === "NEEDS_APPROVAL") {
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
        <div className="flex gap-3">
          <button onClick={() => updateStatus("APPROVED")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            Approve Ticket
          </button>
          <button onClick={() => setIsRejecting(true)} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors">
            Reject
          </button>
        </div>
      );
    }

    if (currentStatus === "APPROVED" || currentStatus === "IN_PROGRESS" || currentStatus === "IN_TESTING") {
      return (
        <div className="flex gap-3">
          {currentStatus !== "IN_PROGRESS" && (
            <button onClick={() => updateStatus("IN_PROGRESS")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Mark In Progress
            </button>
          )}
          <button onClick={() => updateStatus("COMPLETED")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
            Mark as Completed
          </button>
        </div>
      );
    }
  }

  // Fallback for Tester role just in case
  if (userRole === "TESTER" && currentStatus === "IN_TESTING") {
    return (
      <div className="flex gap-3">
        <button onClick={() => updateStatus("COMPLETED")} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          Yes (Task completed)
        </button>
        <button onClick={() => updateStatus("IN_PROGRESS")} className="px-4 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg text-sm font-medium transition-colors">
          No (Bug found)
        </button>
      </div>
    );
  }

  return null; // No actions available
}
