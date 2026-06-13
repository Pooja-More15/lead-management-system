const prisma = require('../config/db');
const { sendSuccess } = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

const getDashboardStats = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };

  // AGENT role restriction: Agents only get stats for their assigned leads
  if (req.user.role === 'AGENT') {
    filter.assignedTo = req.user.id;
  }

  // 1. KPI Cards data
  // Total Leads
  const totalLeads = await prisma.lead.count({ where: filter });

  // New Leads Today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newLeadsToday = await prisma.lead.count({
    where: {
      ...filter,
      createdAt: { gte: todayStart },
    },
  });

  // Conversion Rate (Qualified / Total)
  const qualifiedLeads = await prisma.lead.count({
    where: {
      ...filter,
      status: 'QUALIFIED',
    },
  });
  const conversionRate = totalLeads > 0 ? parseFloat(((qualifiedLeads / totalLeads) * 100).toFixed(2)) : 0;

  // Active Agents count
  const activeAgents = await prisma.user.count({
    where: { role: 'AGENT', isActive: true },
  });

  // Top Performing Agent (Agent with the most QUALIFIED leads)
  const topAgentAggregate = await prisma.lead.groupBy({
    by: ['assignedTo'],
    where: {
      isDeleted: false,
      status: 'QUALIFIED',
      assignedTo: { not: null },
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 1,
  });

  let topPerformingAgent = 'N/A';
  if (topAgentAggregate.length > 0 && topAgentAggregate[0].assignedTo) {
    const agentUser = await prisma.user.findUnique({
      where: { id: topAgentAggregate[0].assignedTo },
      select: { name: true },
    });
    if (agentUser) {
      topPerformingAgent = `${agentUser.name} (${topAgentAggregate[0]._count.id} Won)`;
    }
  }

  // 2. Charts data
  // Leads by Status
  const leadsByStatusRaw = await prisma.lead.groupBy({
    by: ['status'],
    where: filter,
    _count: { id: true },
  });
  const statusLabels = ['NEW', 'CONTACTED', 'QUALIFIED', 'LOST'];
  const leadsByStatus = statusLabels.map((status) => {
    const found = leadsByStatusRaw.find((s) => s.status === status);
    return {
      status,
      count: found ? found._count.id : 0,
    };
  });

  // Leads by Source
  const leadsBySourceRaw = await prisma.lead.groupBy({
    by: ['source'],
    where: filter,
    _count: { id: true },
  });
  const leadsBySource = leadsBySourceRaw.map((s) => ({
    source: s.source,
    count: s._count.id,
  }));

  // Agent Performance Chart: Agent name, total assigned leads, qualified leads
  const allAgents = await prisma.user.findMany({
    where: { role: 'AGENT', isActive: true },
    select: { id: true, name: true },
  });

  const agentPerformance = await Promise.all(
    allAgents.map(async (agent) => {
      const [total, won] = await Promise.all([
        prisma.lead.count({
          where: { assignedTo: agent.id, isDeleted: false },
        }),
        prisma.lead.count({
          where: { assignedTo: agent.id, isDeleted: false, status: 'QUALIFIED' },
        }),
      ]);
      return {
        name: agent.name,
        assigned: total,
        converted: won,
      };
    })
  );

  // Monthly Lead Growth (Last 6 months)
  const monthlyLeadGrowth = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const count = await prisma.lead.count({
      where: {
        ...filter,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const monthName = startOfMonth.toLocaleString('default', { month: 'short' });
    monthlyLeadGrowth.push({
      month: `${monthName} ${startOfMonth.getFullYear().toString().substr(-2)}`,
      leads: count,
    });
  }

  // 3. Recent Activities (limit 5)
  const recentActivities = await prisma.activityLog.findMany({
    where: req.user.role === 'AGENT' ? { userId: req.user.id } : {},
    include: {
      user: { select: { name: true } },
      lead: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // User Management metrics (Conditionally visible to Admin only)
  let userStats = null;
  if (req.user.role === 'ADMIN') {
    const [totalUsers, totalAgents, totalManagers, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'AGENT', isActive: true } }),
      prisma.user.count({ where: { role: 'MANAGER', isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);
    userStats = {
      totalUsers,
      totalAgents,
      totalManagers,
      activeUsers,
    };
  }

  const stats = {
    kpis: {
      totalLeads,
      newLeadsToday,
      conversionRate,
      activeAgents,
      topPerformingAgent,
    },
    userKpis: userStats,
    charts: {
      leadsByStatus,
      leadsBySource,
      agentPerformance,
      monthlyLeadGrowth,
    },
    recentActivities: recentActivities.map((act) => ({
      id: act.id,
      action: act.action,
      description: act.description,
      userName: act.user ? act.user.name : 'System',
      leadName: act.lead ? act.lead.name : null,
      createdAt: act.createdAt,
    })),
  };

  return sendSuccess(res, 'Dashboard statistics fetched successfully', stats);
});

module.exports = {
  getDashboardStats,
};
