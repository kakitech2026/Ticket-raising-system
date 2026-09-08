"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";
import { Lock, Send, MessageSquare } from "lucide-react";

type Comment = {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: Date | string;
  author: { name: string };
};

export function CommentsSection({
  ticketId,
  userRole,
  comments,
}: {
  ticketId: string;
  userRole: string;
  comments: Comment[];
}) {
  const [content, setContent] = useState("");
  const [internal, setInternal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const requestKey = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Notify topbar bell that ticket notifications have been cleared on view
    window.dispatchEvent(new Event("notifications-updated"));
  }, [ticketId]);

  return (
    <div className="space-y-5">
      {/* Message Stream (Chronological - Oldest to Newest) */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <article
            key={comment.id}
            className={`p-4 rounded-xl border transition ${
              comment.isInternal
                ? "bg-amber-950/20 border-amber-800/40 text-amber-100"
                : "bg-neutral-900/90 border-neutral-800 text-neutral-100"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-neutral-200">
                  {comment.author.name}
                </span>
                {comment.isInternal && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <Lock className="w-3 h-3" /> Internal Note
                  </span>
                )}
              </div>
              <span
                suppressHydrationWarning
                className="text-xs text-neutral-400"
              >
                {new Date(comment.createdAt).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-neutral-300 mt-2 leading-relaxed break-words">
              {comment.content}
            </p>
          </article>
        ))}

        {!comments.length && (
          <div className="py-6 text-center text-neutral-500 space-y-1">
            <MessageSquare className="w-6 h-6 mx-auto text-neutral-600 mb-2" />
            <p className="text-sm">No messages in this discussion yet.</p>
            <p className="text-xs">Post a message below to start the conversation.</p>
          </div>
        )}
      </div>

      {/* Add Comment Box at the bottom */}
      <form
        className="space-y-3 pt-2 border-t border-neutral-800"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError("");
          requestKey.current ??= crypto.randomUUID();
          try {
            await requestJson(
              "/api/tickets/" + ticketId + "/comments",
              jsonOptions("POST", {
                content,
                isInternal: internal,
                requestKey: requestKey.current,
              })
            );
            setContent("");
            setInternal(false);
            requestKey.current = null;
            window.dispatchEvent(new Event("notifications-updated"));
            router.refresh();
          } catch (e) {
            setError(errorMessage(e));
          } finally {
            setLoading(false);
          }
        }}
      >
        <label className="block">
          <span className="text-sm font-medium text-neutral-300">Add a comment</span>
          <textarea
            className="field mt-1.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Type your message here..."
            required
            maxLength={20000}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              requestKey.current = null;
            }}
            rows={3}
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {userRole !== "EMPLOYEE" ? (
            <label className="flex items-center gap-2 text-xs text-neutral-400 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => {
                  setInternal(e.target.checked);
                  requestKey.current = null;
                }}
                className="rounded border-neutral-700 text-amber-500 focus:ring-amber-400"
              />
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" /> Internal note (visible to staff only)
              </span>
            </label>
          ) : (
            <span />
          )}

          <button
            className="btn py-2 px-4"
            disabled={loading || !content.trim()}
          >
            {loading ? "Sending..." : (
              <span className="inline-flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Send Message
              </span>
            )}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-red-400 text-sm mt-1">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}