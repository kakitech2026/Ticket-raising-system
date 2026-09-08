"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";
import { requestJson, jsonOptions, errorMessage } from "@/lib/client-api";

type Notification = {
  id: string;
  message: string;
  ticketId: string | null;
  isRead: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [data, setData] = useState<{
    notifications: Notification[];
    unreadCount: number;
  }>({ notifications: [], unreadCount: 0 });
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      requestJson<typeof data>("/api/notifications")
        .then((v) => {
          if (active) setData(v);
        })
        .catch((e) => {
          if (active) setError(errorMessage(e));
        });
    };
    load();
    const timer = setInterval(load, 30000);
    window.addEventListener("notifications-updated", load);
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("notifications-updated", load);
      document.removeEventListener("mousedown", close);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-label={
          data.unreadCount > 0
            ? `${data.unreadCount} unread notifications`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <Bell className="w-5 h-5 text-neutral-200" />
        {data.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-rose-950/60 ring-2 ring-neutral-900 animate-pulse">
            {data.unreadCount > 99 ? "99+" : data.unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,90vw)] rounded-xl border border-neutral-700 bg-neutral-900 p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-neutral-100 text-sm">Notifications</h2>
              {data.unreadCount > 0 && (
                <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/30">
                  {data.unreadCount} new
                </span>
              )}
            </div>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-2 text-xs text-rose-400">
              {error}
            </p>
          )}

          {data.unreadCount > 0 && (
            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                onClick={async () => {
                  try {
                    await requestJson(
                      "/api/notifications",
                      jsonOptions("PATCH", { markAll: true })
                    );
                    window.dispatchEvent(new Event("notifications-updated"));
                  } catch (e) {
                    setError(errorMessage(e));
                  }
                }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>
          )}

          <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-neutral-800/60">
            {data.notifications.map((n) => (
              <Link
                key={n.id}
                href={n.ticketId ? "/tickets/" + n.ticketId : "/notifications"}
                className={`group block rounded-lg px-3 py-2.5 text-xs transition-colors my-1 ${
                  !n.isRead
                    ? "bg-rose-500/10 hover:bg-rose-500/15 border-l-2 border-rose-500 text-neutral-100 font-medium"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200"
                }`}
                onClick={async () => {
                  setOpen(false);
                  if (!n.isRead) {
                    try {
                      await requestJson(
                        "/api/notifications",
                        jsonOptions("PATCH", { id: n.id })
                      );
                      window.dispatchEvent(new Event("notifications-updated"));
                    } catch (e) {
                      setError(errorMessage(e));
                    }
                  }
                }}
              >
                <div className="flex items-start gap-2">
                  {!n.isRead && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500 ring-2 ring-rose-900/40" />
                  )}
                  <span className="leading-snug break-words">{n.message}</span>
                </div>
              </Link>
            ))}

            {!data.notifications.length && (
              <p className="py-6 text-center text-xs text-neutral-500">
                No notifications right now.
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-neutral-800 pt-2">
            <Link
              className="block text-center text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              href="/notifications"
              onClick={() => setOpen(false)}
            >
              View all notifications &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}