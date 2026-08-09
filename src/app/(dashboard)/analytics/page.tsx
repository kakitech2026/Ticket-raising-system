import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import { AnalyticsCharts } from "./Charts";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSLAStatus } from "@/lib/sla";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role === "EMPLOYEE") {
    return notFound(); // Only Admins and Techs
  }

  // Fetch all tickets for aggregation
  const allTickets = await prisma.ticket.findMany({
    include: {
      assignee: true,
    }
  });

  // Calculate Average Resolution Time
  const resolvedTickets = allTickets.filter(t => t.status === "COMPLETED");
  let avgResolutionHours = 0;
  if (resolvedTickets.length > 0) {
    const totalMs = resolvedTickets.reduce((acc, t) => {
      return acc + (t.updatedAt.getTime() - t.createdAt.getTime());
    }, 0);
    avgResolutionHours = totalMs / resolvedTickets.length / (1000 * 60 * 60);
  }

  // Calculate SLA Breach Rate
  let breachedCount = 0;
  allTickets.forEach(t => {
    const slaStatus = getSLAStatus(t.createdAt, t.priority, t.status === "COMPLETED");
    if (slaStatus === "BREACHED") breachedCount++;
  });
  const breachRate = allTickets.length > 0 ? ((breachedCount / allTickets.length) * 100).toFixed(1) : "0.0";

  // Aggregate tickets by department
  const deptCount: Record<string, number> = {};
  allTickets.forEach(t => {
    deptCount[t.department] = (deptCount[t.department] || 0) + 1;
  });
  const ticketsByDepartment = Object.keys(deptCount).map(key => ({
    name: key || "Unknown",
    value: deptCount[key]
  }));

  // Tech Performance (Tickets resolved by assignee)
  const techCount: Record<string, number> = {};
  resolvedTickets.forEach(t => {
    if (t.assignee) {
      techCount[t.assignee.name] = (techCount[t.assignee.name] || 0) + 1;
    }
  });
  const techPerformance = Object.keys(techCount).map(key => ({
    name: key,
    resolved: techCount[key]
  })).sort((a, b) => b.resolved - a.resolved);

  // Time Series (Last 30 Days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const timeSeriesData: Record<string, { created: number, resolved: number }> = {};
  
  // Initialize last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    timeSeriesData[dateStr] = { created: 0, resolved: 0 };
  }

  allTickets.forEach(t => {
    if (t.createdAt >= thirtyDaysAgo) {
      const createdStr = t.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timeSeriesData[createdStr]) timeSeriesData[createdStr].created++;
    }
    if (t.status === "COMPLETED" && t.updatedAt >= thirtyDaysAgo) {
      const resolvedStr = t.updatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (timeSeriesData[resolvedStr]) timeSeriesData[resolvedStr].resolved++;
    }
  });

  const ticketsOverTime = Object.keys(timeSeriesData).map(date => ({
    date,
    created: timeSeriesData[date].created,
    resolved: timeSeriesData[date].resolved
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-100">Analytics & Reports</h1>
        <p className="text-neutral-400 mt-1">Overview of support performance and ticket volume.</p>
      </div>

      {/* High-Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">Avg Resolution Time</p>
            <p className="text-3xl font-bold text-neutral-100 mt-1">
              {avgResolutionHours < 1 ? "< 1h" : `${avgResolutionHours.toFixed(1)}h`}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">SLA Breach Rate</p>
            <p className="text-3xl font-bold text-neutral-100 mt-1">
              {breachRate}%
            </p>
          </div>
          <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-400">Total Resolved</p>
            <p className="text-3xl font-bold text-neutral-100 mt-1">
              {resolvedTickets.length} <span className="text-lg text-neutral-500">/ {allTickets.length}</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Render Recharts Client Component */}
      <AnalyticsCharts 
        ticketsOverTime={ticketsOverTime}
        ticketsByDepartment={ticketsByDepartment}
        techPerformance={techPerformance}
      />
      
    </div>
  );
}
