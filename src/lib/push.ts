import webpush from "web-push";
import { prisma } from "./prisma";
import { ticketWhere } from "./policy";
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, privateKey = process.env.VAPID_PRIVATE_KEY;
if (publicKey && privateKey) webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", publicKey, privateKey);
export async function sendPushNotification(userId: string, title: string, body: string, url = "/") {
  if (!publicKey || !privateKey) return false;
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId, user: { isActive: true } } });
  let success = true;
  for (const sub of subscriptions) {
    try { await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({ title, body, url }), { TTL: 300, timeout: 10000 }); }
    catch (error) {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) await prisma.pushSubscription.deleteMany({ where: { id: sub.id } });
      else success = false;
    }
  }
  return success;
}
export async function deliverNotifications() {
  if (!publicKey || !privateKey) return { delivered: 0, configured: false };
  const pending = await prisma.notification.findMany({ where: { pushSentAt: null, pushAttempts: { lt: 5 }, pushNextAttemptAt: { lte: new Date() } }, take: 50, orderBy: { createdAt: "asc" }, include: { user: { select: { id: true, role: true, isActive: true } } } });
  let delivered = 0;
  for (const item of pending) {
    const claim = await prisma.notification.updateMany({ where: { id: item.id, pushSentAt: null, pushNextAttemptAt: { lte: new Date() }, pushAttempts: item.pushAttempts }, data: { pushAttempts: { increment: 1 }, pushNextAttemptAt: new Date(Date.now() + 300000) } });
    if (!claim.count) continue;
    const allowed = item.user.isActive && (!item.ticketId || await prisma.ticket.findFirst({ where: { AND: [{ id: item.ticketId }, ticketWhere(item.user)] }, select: { id: true } }));
    // Notification bodies deliberately omit ticket text on shared-device lock screens.
    const success = !allowed || await sendPushNotification(item.userId, "Tickety update", "You have a ticket update. Sign in to view it.", item.ticketId ? "/tickets/" + item.ticketId : "/notifications");
    if (success) { await prisma.notification.update({ where: { id: item.id }, data: { pushSentAt: new Date() } }); delivered++; }
  }
  return { delivered, configured: true };
}