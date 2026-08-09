"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Listen for cross-component sync
    window.addEventListener("notifications-updated", fetchNotifications);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener("notifications-updated", fetchNotifications);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = async (id: string, ticketId?: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setIsOpen(false);
      window.dispatchEvent(new Event("notifications-updated"));
      
      if (ticketId) {
        router.push(`/tickets/${ticketId}`);
        router.refresh();
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-neutral-950 animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
            <h3 className="font-semibold text-neutral-200">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id, notification.ticketId)}
                    className={`w-full text-left p-4 hover:bg-neutral-800/50 transition-colors flex items-start gap-3 ${!notification.isRead ? 'bg-neutral-800/20' : ''}`}
                  >
                    <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-indigo-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'text-neutral-200 font-medium' : 'text-neutral-400'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {notification.ticketId && (
                      <ExternalLink className="w-4 h-4 text-neutral-500 shrink-0 mt-1" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-2 border-t border-neutral-800 bg-neutral-900/80">
            <Link 
              href="/notifications" 
              onClick={() => setIsOpen(false)}
              className="block w-full text-center py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-neutral-800 rounded-lg transition-colors font-medium"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
