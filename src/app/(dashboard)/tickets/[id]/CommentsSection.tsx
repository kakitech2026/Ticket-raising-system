"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Lock } from "lucide-react";

export function CommentsSection({
  ticketId,
  userRole,
  comments,
}: {
  ticketId: string;
  userRole: string;
  comments: any[];
}) {
  const [content, setContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setLoading(true);
    try {
      await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isInternal }),
      });
      setContent("");
      setIsInternal(false);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isStaff = ["TECH", "ADMIN"].includes(userRole);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className={`p-4 rounded-xl border ${comment.isInternal ? "bg-yellow-500/10 border-yellow-500/20" : "bg-neutral-800/50 border-neutral-700"}`}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-neutral-200">{comment.author?.name || "Unknown"}</span>
                {comment.isInternal && (
                  <span className="flex items-center text-xs font-medium text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 mr-1" /> Internal
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500" suppressHydrationWarning>
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{comment.content}</p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-4">No comments yet.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-800/30 p-4 rounded-xl border border-neutral-700">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full bg-neutral-900/50 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          {isStaff ? (
            <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500"
              />
              Internal Note (Hidden from employees)
            </label>
          ) : <div />}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
