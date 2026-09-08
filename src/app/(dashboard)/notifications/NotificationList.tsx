"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";

type Notification = {
  id: string;
  message: string;
  ticketId: string | null;
  isRead: boolean;
  createdAt: Date;
};

export function NotificationList({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function mark(id?: string) {
    setBusy(true);
    setError("");
    try {
      await requestJson(
        "/api/notifications",
        jsonOptions("PATCH", id ? { id } : { markAll: true })
      );
      window.dispatchEvent(new Event("notifications-updated"));
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const hasUnread = initialNotifications.some((n) => !n.isRead);

  return (
    <div className="space-y-4">
      {error && (
        <p role="alert" className="text-rose-400 text-sm">
          {error}
        </p>
      )}
      {hasUnread && (
        <div className="flex justify-end pb-2">
          <button
            className="btn inline-flex items-center gap-1.5 text-xs"
            disabled={busy}
            onClick={() => mark()}
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        </div>
      )}
      <div className="space-y-3">
        {initialNotifications.map((n) => (
          <article
            className={`rounded-xl border p-4 space-y-2 transition-colors ${
              !n.isRead
                ? "border-rose-500/40 bg-rose-500/5 shadow-sm"
                : "border-neutral-800 bg-neutral-900/50"
            }`}
            key={n.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {!n.isRead ? (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-900/40" />
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-600" />
                )}
                <div>
                  <p
                    className={
                      !n.isRead
                        ? "text-neutral-100 font-medium"
                        : "text-neutral-300"
                    }
                  >
                    {n.message}
                  </p>
                  <p
                    suppressHydrationWarning
                    className="text-xs text-neutral-400 mt-1"
                  >
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2 border-t border-neutral-800/60 text-xs">
              {n.ticketId && (
                <Link
                  href={"/tickets/" + n.ticketId}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                  onClick={() => {
                    if (!n.isRead) mark(n.id);
                  }}
                >
                  View ticket &rarr;
                </Link>
              )}
              {!n.isRead && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => mark(n.id)}
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}