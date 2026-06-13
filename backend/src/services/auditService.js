const prisma = require('../config/db');
const logger = require('../config/logger');

const logActivity = async ({ userId, leadId, targetUserId, action, description, req }) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        leadId: leadId || null,
        targetUserId: targetUserId || null,
        action,
        description,
        ipAddress: ipAddress ? String(ipAddress) : null,
        userAgent: userAgent ? String(userAgent) : null,
      },
    });
    logger.info(`[Audit Log] ${action}: ${description}`);
  } catch (error) {
    logger.error(`Failed to create audit log entry: ${error.message}`);
  }
};

module.exports = {
  logActivity,
};
