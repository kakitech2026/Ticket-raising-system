"use client";

import { useState, useEffect } from "react";
import { Check, ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  message: string;
  ticketId: string | null;
  isRead: boolean;
  createdAt: Date;
}

export function NotificationList({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const router = useRouter();

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    const handleUpdate = () => {
      router.refresh(); // Tells Next.js to re-fetch the Server Component and pass down new props
    };
    window.addEventListener("notifications-updated", handleUpdate);
    return () => window.removeEventListener("notifications-updated", handleUpdate);
  }, [router]);

  const markAsRead = async (id: string, ticketId: string | null) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      window.dispatchEvent(new Event("notifications-updated"));
      
      if (ticketId) {
        router.push(`/tickets/${ticketId}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true })
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      {unreadCount > 0 && (
        <div className="p-4 border-b border-neutral-800 bg-neutral-900/30 flex justify-end">
          <button 
            onClick={markAllAsRead}
            className="text-sm text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 transition-colors bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      <div className="divide-y divide-neutral-800">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`p-5 md:p-6 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${!notification.isRead ? 'bg-neutral-800/20' : 'hover:bg-neutral-900/40'}`}
          >
            <div className="flex items-start gap-4">
              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${!notification.isRead ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-transparent'}`} />
              <div>
                <p className={`text-base ${!notification.isRead ? 'text-neutral-100 font-medium' : 'text-neutral-300'}`}>
                  {notification.message}
                </p>
                <p className="text-sm text-neutral-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString(undefined, { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-6 sm:pl-0">
              {notification.ticketId && (
                <button
                  onClick={() => markAsRead(notification.id, notification.ticketId)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-sm font-medium rounded-lg transition-colors border border-neutral-700"
                >
                  View Ticket
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
              {!notification.isRead && (
                <button
                  onClick={() => markAsRead(notification.id, null)}
                  className="p-2 text-neutral-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
