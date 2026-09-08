import { getServerSession } from "next-auth/next";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { analytics } from "@/lib/reporting";
import { AnalyticsCharts } from "./Charts";
export default async function AnalyticsPage(){
  const session=await getServerSession(authOptions);if(!session?.user?.id||session.user.role==="EMPLOYEE")return notFound();
  const data=await analytics(session.user),s=data.summary;
  return <div className="space-y-6"><h1 className="text-2xl font-semibold">Analytics</h1><p className="text-neutral-400">Last 30 days (UTC). Reopened tickets retain previous cycle results. Technicians see their own work.</p><dl className="grid sm:grid-cols-3 gap-4">{[["Average resolution",s.average===null?"No completed cycles":s.average.toFixed(1)+" hours"],["Closed-cycle SLA breach rate",s.closed?(100*s.breached/s.closed).toFixed(1)+"%":"No closed cycles"],["Completed cycles",s.resolved]].map(([label,value])=><div key={label} className="panel"><dt className="text-neutral-400">{label}</dt><dd className="text-2xl font-semibold mt-2">{value}</dd></div>)}</dl><AnalyticsCharts ticketsOverTime={data.ticketsOverTime} ticketsByDepartment={data.ticketsByDepartment} techPerformance={data.techPerformance}/></div>;
}