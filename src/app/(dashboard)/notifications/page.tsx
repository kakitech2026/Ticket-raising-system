import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ticketWhere } from "@/lib/policy";
import { Pagination } from "@/components/Pagination";
import { NotificationList } from "./NotificationList";
export default async function NotificationsPage({searchParams}:{searchParams:Promise<{page?:string}>}){
  const session=await getServerSession(authOptions);if(!session?.user?.id)return null;
  const page=Math.max(1,Number((await searchParams).page)||1);
  const where={userId:session.user.id,OR:[{ticketId:null},{ticket:ticketWhere(session.user)}]};
  const [notifications,total,unread]=await Promise.all([prisma.notification.findMany({where,take:25,skip:(page-1)*25,orderBy:{createdAt:"desc"}}),prisma.notification.count({where}),prisma.notification.count({where:{...where,isRead:false}})]);
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {unread > 0 ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            {unread} unread
          </span>
        ) : (
          <span className="text-xs text-neutral-400">All caught up</span>
        )}
      </div>
      <section className="panel">
        {notifications.length ? (
          <NotificationList initialNotifications={notifications} />
        ) : (
          <p className="text-neutral-400 text-sm">No notifications found.</p>
        )}
      </section>
      <Pagination page={page} total={total} base="/notifications" />
    </div>
  );
}