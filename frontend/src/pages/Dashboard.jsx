import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import {
  TrendingUp, Users, Target, UserCheck, Inbox,
  Clock, ArrowUpRight, Shield
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const fetchStats = useCallback(async () => {
    try {
      const res = await apiClient.get('/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    if (socket) {
      socket.on('dashboard:refresh', () => {
        fetchStats();
      });
      return () => {
        socket.off('dashboard:refresh');
      };
    }
  }, [socket, fetchStats]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const { kpis, charts, recentActivities } = stats || {
    kpis: {}, charts: { leadsByStatus: [], leadsBySource: [], agentPerformance: [], monthlyLeadGrowth: [] }, recentActivities: []
  };

  const allCardData = [
    { title: user?.role === 'AGENT' ? 'Assigned Leads' : 'Total Leads', value: kpis.totalLeads, icon: Inbox, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-400' },
    { title: 'New Leads Today', value: kpis.newLeadsToday, icon: Clock, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { title: 'Conversion Rate', value: `${kpis.conversionRate}%`, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { title: 'Active Agents', value: kpis.activeAgents, icon: Users, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400', roles: ['ADMIN', 'MANAGER'] },
    { title: 'Top Agent', value: kpis.topPerformingAgent?.split(' (')[0] || 'N/A', sub: kpis.topPerformingAgent?.includes('(') ? kpis.topPerformingAgent.split(' (')[1].replace(')', '') : '', icon: UserCheck, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400', roles: ['ADMIN', 'MANAGER'] },
  ];

  const cardData = allCardData.filter(card => !card.roles || card.roles.includes(user?.role));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold dark:text-slate-100">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Real-time statistics & pipeline analytics</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {cardData.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card-premium shadow-premium-hover p-5 flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-bold mt-1.5 dark:text-slate-100">{card.value}</h3>
              {card.sub && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">{card.sub}</p>}
            </div>
            <div className={`p-3 rounded-lg ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Admin User Management KPIs */}
      {stats?.userKpis && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-650 dark:text-indigo-400" />
            <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User Directory Summary</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Total Registered Users', value: stats.userKpis.totalUsers, icon: Users, color: 'text-purple-650 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
              { title: 'Active Managers', value: stats.userKpis.totalManagers, icon: Shield, color: 'text-blue-650 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
              { title: 'Active Sales Agents', value: stats.userKpis.totalAgents, icon: UserCheck, color: 'text-emerald-650 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
              { title: 'Active Accounts', value: stats.userKpis.activeUsers, icon: TrendingUp, color: 'text-amber-650 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
            ].map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card-premium shadow-premium-hover p-5 flex items-center justify-between cursor-pointer border-l-4 border-l-indigo-500/40 dark:border-l-indigo-400/40"
              >
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1.5 dark:text-slate-100">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="card-premium p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 uppercase tracking-wider">Leads by Status</h3>
          <div className="h-64 flex flex-col sm:flex-row items-center justify-around">
            <div className="w-full h-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.leadsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {charts.leadsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Leads`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Status Legend */}
            <div className="space-y-2.5">
              {charts.leadsByStatus.map((entry, index) => (
                <div key={entry.status} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase w-24">{entry.status}</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Growth Chart */}
        <div className="card-premium p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 uppercase tracking-wider">Monthly Lead Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthlyLeadGrowth} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className={user?.role === 'AGENT' ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
        {/* Agent Performance Chart */}
        {user?.role !== 'AGENT' && (
          <div className="card-premium p-6">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 uppercase tracking-wider">Agent Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.agentPerformance} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" className="dark:stroke-slate-800" />
                  <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="assigned" fill="#a5b4fc" name="Leads Assigned" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="converted" fill="#6366f1" name="Leads Converted" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Recent Activity Logs */}
        <div className="card-premium p-6 flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Recent Activity</h3>
          <div className="flex-1 space-y-4 max-h-64 overflow-y-auto pr-1">
            {recentActivities.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                No activity logged yet
              </div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex gap-3 text-xs pb-3.5 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center flex-shrink-0 font-bold uppercase">
                    {act.userName.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{act.description}</p>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                      <span>{act.userName}</span>
                      <span>•</span>
                      <span>{new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
