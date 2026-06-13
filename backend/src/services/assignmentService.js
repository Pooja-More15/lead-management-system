const prisma = require('../config/db');
const logger = require('../config/logger');

async function assignLeadToLeastLoadedAgent(tx) {
  // Find all active agents
  const agents = await tx.user.findMany({
    where: {
      role: 'AGENT',
      isActive: true,
    },
  });

  if (agents.length === 0) {
    logger.warn('No active agents found in the system for auto-assignment.');
    return null;
  }

  // Count active open leads (not LOST, not deleted) for each active agent
  const activeLeadCounts = await Promise.all(
    agents.map(async (agent) => {
      const count = await tx.lead.count({
        where: {
          assignedTo: agent.id,
          isDeleted: false,
          status: {
            not: 'LOST',
          },
        },
      });
      return { agentId: agent.id, count, email: agent.email, name: agent.name };
    })
  );

  // Sort agents by active lead count ascending (least loaded agent first)
  activeLeadCounts.sort((a, b) => a.count - b.count);
  const selectedAgent = activeLeadCounts[0];

  logger.info(`Auto-assignment algorithm chose agent: ${selectedAgent.name} (Current Active Lead Count: ${selectedAgent.count})`);
  return selectedAgent;
}

module.exports = {
  assignLeadToLeastLoadedAgent,
};
