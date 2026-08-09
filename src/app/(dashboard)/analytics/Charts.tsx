"use client";

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar, Legend
} from 'recharts';

export function AnalyticsCharts({ 
  ticketsOverTime, 
  ticketsByDepartment, 
  techPerformance 
}: { 
  ticketsOverTime: any[], 
  ticketsByDepartment: any[], 
  techPerformance: any[] 
}) {
  const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#60a5fa'];

  return (
    <div className="space-y-6">
      
      {/* Time Series Chart */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-neutral-200 mb-6 uppercase tracking-wider">Tickets Created vs Resolved (Last 30 Days)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ticketsOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
              <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                itemStyle={{ color: '#e5e5e5' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Line type="monotone" dataKey="created" name="Created" stroke="#818cf8" strokeWidth={3} dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Pie Chart */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-neutral-200 mb-6 uppercase tracking-wider">Volume by Department</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ticketsByDepartment}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {ticketsByDepartment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                  itemStyle={{ color: '#e5e5e5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tech Performance Bar Chart */}
        <div className="bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-neutral-200 mb-6 uppercase tracking-wider">Tech Performance (Resolved)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techPerformance} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
                  cursor={{ fill: '#262626' }}
                />
                <Bar dataKey="resolved" name="Tickets Resolved" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
