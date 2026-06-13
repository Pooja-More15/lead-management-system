const prisma = require('../config/db');
const { sendSuccess } = require('../utils/responseFormatter');
const asyncHandler = require('../utils/asyncHandler');

const getActivityLogs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = {};

  // AGENT can see their own actions, actions targeting them, or logs on leads assigned to them
  if (req.user.role === 'AGENT') {
    filter.OR = [
      { userId: req.user.id },
      { targetUserId: req.user.id },
      { lead: { assignedTo: req.user.id } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: filter,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        lead: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.activityLog.count({ where: filter }),
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  return sendSuccess(res, 'Activity logs fetched successfully', logs, 200, pagination);
});

module.exports = {
  getActivityLogs,
};
