import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import { NotificationList } from "./NotificationList";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  // Fetch all notifications for the user
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-400" />
            Notifications
          </h1>
          <p className="text-neutral-400 mt-1">
            You have {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}.
          </p>
        </div>
      </div>

      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
        {notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-neutral-800/50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-neutral-500" />
            </div>
            <h3 className="text-lg font-medium text-neutral-200">You're all caught up!</h3>
            <p className="text-neutral-400 mt-1 max-w-sm">
              When you get assigned to tickets or receive updates, they will appear here.
            </p>
          </div>
        ) : (
          <NotificationList initialNotifications={notifications} />
        )}
      </div>
    </div>
  );
}
