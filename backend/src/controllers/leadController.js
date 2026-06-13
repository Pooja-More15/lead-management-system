const prisma = require('../config/db');
const { assignLeadToLeastLoadedAgent } = require('../services/assignmentService');
const { enrichLeadData } = require('../services/enrichmentService');
const { sendLeadAssignmentEmail } = require('../services/emailService');
const { logActivity } = require('../services/auditService');
const { emitGlobalUpdate, emitToUser } = require('../sockets/socket');
const { sendSuccess } = require('../utils/responseFormatter');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { isUUID } = require('../middlewares/validateUuid');

const createLead = asyncHandler(async (req, res) => {
  const { name, email, phone, source, priority, notes } = req.body;

  if (!name || !email || !phone || !source) {
    throw new ApiError(400, 'Name, email, phone, and source are required.');
  }

  // 1. Fetch Enrichment details (asynchronous, non-blocking fallback)
  const enrichment = await enrichLeadData(email);
  const enrichmentHeader = `\n\n--- Enriched Data ---\nCompany: ${enrichment.companyName}\nProfile: ${enrichment.companyDescription || 'No description available.'}`;
  const finalNotes = notes ? `${notes}${enrichmentHeader}` : enrichmentHeader;

  // 2. Perform safe, atomic, concurrent-safe assignment & creation in interactive transaction
  const result = await prisma.$transaction(async (tx) => {
    // Determine least-loaded agent
    const assignedAgent = await assignLeadToLeastLoadedAgent(tx);
    const assignedTo = assignedAgent ? assignedAgent.agentId : null;

    // Create the lead
    const lead = await tx.lead.create({
      data: {
        name,
        email,
        phone,
        source,
        priority: priority ? priority.toUpperCase() : 'MEDIUM',
        notes: finalNotes,
        createdBy: req.user.id,
        assignedTo,
      },
      include: {
        agent: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Write audit logs
    await tx.activityLog.create({
      data: {
        userId: req.user.id,
        leadId: lead.id,
        action: 'LEAD_CREATED',
        description: `Lead "${lead.name}" created by ${req.user.name}`,
      }
    });

    if (assignedTo) {
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          leadId: lead.id,
          action: 'LEAD_ASSIGNED',
          description: `Lead "${lead.name}" automatically assigned to agent ${assignedAgent.name}`,
        }
      });
    }

    return { lead, assignedAgent };
  }, {
    isolationLevel: 'Serializable', // Ensure concurrent safety
  });

  const { lead, assignedAgent } = result;

  // 3. Post-transaction operations: WebSockets and Emails (asynchronous, non-blocking)
  if (assignedAgent) {
    // Notify Agent via WebSockets
    emitToUser(assignedAgent.agentId, 'lead:assigned', {
      message: `New lead assigned: ${lead.name}`,
      leadId: lead.id,
      leadName: lead.name,
    });
    // Send email alert
    await sendLeadAssignmentEmail(assignedAgent.email, assignedAgent.name, lead.name, lead.notes);
  }

  // Notify dashboard statistics refresh
  emitGlobalUpdate('dashboard:refresh', { action: 'LEAD_CREATED' });

  return sendSuccess(res, 'Lead created and assigned successfully', lead, 201);
});

const getLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Query Params
  const { status, source, priority, assignedTo, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Build Filter object
  const filter = {
    isDeleted: false,
  };

  // RBAC constraints: Agent can only view their own leads
  if (req.user.role === 'AGENT') {
    filter.assignedTo = req.user.id;
  } else if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (status) filter.status = status.toUpperCase();
  if (source) filter.source = source;
  if (priority) filter.priority = priority.toUpperCase();

  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Validate sorting fields
  const allowedSortFields = ['createdAt', 'name', 'status', 'priority'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: filter,
      include: {
        agent: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortField]: order },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where: filter }),
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  return sendSuccess(res, 'Leads fetched successfully', leads, 200, pagination);
});

const getLeadById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const lead = await prisma.lead.findFirst({
    where: { id, isDeleted: false },
    include: {
      agent: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
      statusHistory: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { changedAt: 'desc' },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      }
    },
  });

  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  // RBAC constraints: Agent can only view their own leads
  if (req.user.role === 'AGENT' && lead.assignedTo !== req.user.id) {
    throw new ApiError(403, 'Forbidden: You do not have access to this lead');
  }

  return sendSuccess(res, 'Lead details fetched successfully', lead);
});

const updateLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, source, status, priority, notes, assignedTo } = req.body;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  if (assignedTo && !isUUID(assignedTo)) {
    throw new ApiError(400, 'Invalid Agent ID format');
  }

  // Retrieve current lead
  const currentLead = await prisma.lead.findFirst({
    where: { id, isDeleted: false },
  });

  if (!currentLead) {
    throw new ApiError(404, 'Lead not found');
  }

  // RBAC permissions: AGENT can only edit assigned leads, cannot change assignedTo or creator
  if (req.user.role === 'AGENT') {
    if (currentLead.assignedTo !== req.user.id) {
      throw new ApiError(403, 'Forbidden: You cannot modify this lead');
    }
    // Agents can only update status and notes
    if (name || email || phone || source || priority || (typeof assignedTo !== 'undefined' && assignedTo !== req.user.id)) {
      throw new ApiError(403, 'Forbidden: Agents can only update lead status and notes');
    }
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (source) updateData.source = source;
  if (notes) updateData.notes = notes;
  if (priority) updateData.priority = priority.toUpperCase();

  // Handle status update & history log
  let statusChanged = false;
  let oldStatus = currentLead.status;
  let newStatus = status ? status.toUpperCase() : null;

  if (newStatus && newStatus !== oldStatus) {
    updateData.status = newStatus;
    statusChanged = true;
  }

  // Handle assignment update
  let assignmentChanged = false;
  let oldAssignedAgent = currentLead.assignedTo;
  let newAssignedAgent = assignedTo || null;

  if (typeof assignedTo !== 'undefined' && newAssignedAgent !== oldAssignedAgent) {
    if (newAssignedAgent !== null) {
      const agent = await prisma.user.findFirst({
        where: { id: newAssignedAgent, role: 'AGENT', isActive: true },
      });
      if (!agent) {
        throw new ApiError(400, 'Agent not found or is inactive');
      }
    }
    updateData.assignedTo = newAssignedAgent;
    assignmentChanged = true;
  }

  console.log("Lead ID:", id);
  console.log("AssignedTo:", assignedTo);

  // Update inside interactive transaction to maintain history
  const updatedLead = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id },
      data: updateData,
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    // Audit logs & history
    if (statusChanged) {
      await tx.leadStatusHistory.create({
        data: {
          leadId: id,
          oldStatus,
          newStatus,
          changedBy: req.user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          leadId: id,
          action: 'STATUS_CHANGED',
          description: `Lead status changed from ${oldStatus} to ${newStatus} by ${req.user.name}`,
        },
      });
    }

    if (assignmentChanged) {
      const agentDetails = newAssignedAgent
        ? await tx.user.findUnique({ where: { id: newAssignedAgent } })
        : null;

      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          leadId: id,
          action: 'LEAD_ASSIGNED',
          description: agentDetails 
            ? `Lead assigned to agent ${agentDetails.name} by ${req.user.name}`
            : `Lead unassigned by ${req.user.name}`,
        },
      });
    }

    // General updates log
    if (!statusChanged && !assignmentChanged) {
      await tx.activityLog.create({
        data: {
          userId: req.user.id,
          leadId: id,
          action: 'LEAD_UPDATED',
          description: `Lead details updated by ${req.user.name}`,
        },
      });
    }

    return updated;
  });

  // Post transaction operations: WS & Emails
  if (assignmentChanged && updatedLead.agent) {
    emitToUser(updatedLead.assignedTo, 'lead:assigned', {
      message: `New lead assigned to you: ${updatedLead.name}`,
      leadId: updatedLead.id,
      leadName: updatedLead.name,
    });
    await sendLeadAssignmentEmail(
      updatedLead.agent.email,
      updatedLead.agent.name,
      updatedLead.name,
      updatedLead.notes
    );
  }

  if (statusChanged) {
    emitGlobalUpdate('lead:status_updated', {
      leadId: updatedLead.id,
      oldStatus,
      newStatus,
    });
  }

  emitGlobalUpdate('dashboard:refresh', { action: 'LEAD_UPDATED' });

  return sendSuccess(res, 'Lead updated successfully', updatedLead);
});

const deleteLead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  const lead = await prisma.lead.findFirst({
    where: { id, isDeleted: false },
  });

  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  // Soft Delete
  await prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    await tx.activityLog.create({
      data: {
        userId: req.user.id,
        leadId: id,
        action: 'LEAD_DELETED',
        description: `Lead "${lead.name}" soft deleted by ${req.user.name}`,
      },
    });
  });

  emitGlobalUpdate('dashboard:refresh', { action: 'LEAD_DELETED' });

  return sendSuccess(res, 'Lead deleted successfully');
});

// GET /api/v1/leads/my-leads (Agent only)
const getMyLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const { status, source, priority, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  const filter = {
    isDeleted: false,
    assignedTo: req.user.id, // Enforce Agent view bounds
  };

  if (status) filter.status = status.toUpperCase();
  if (source) filter.source = source;
  if (priority) filter.priority = priority.toUpperCase();

  if (search) {
    filter.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const allowedSortFields = ['createdAt', 'name', 'status', 'priority'];
  const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const order = ['asc', 'desc'].includes(sortOrder.toLowerCase()) ? sortOrder.toLowerCase() : 'desc';

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: filter,
      include: {
        agent: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sortField]: order },
      skip,
      take: limit,
    }),
    prisma.lead.count({ where: filter }),
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };

  return sendSuccess(res, 'Agent leads fetched successfully', leads, 200, pagination);
});

// PATCH /api/v1/leads/:id/assign (Admin, Manager only)
const assignLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assignedTo } = req.body;

  if (!isUUID(id)) {
    throw new ApiError(400, 'Invalid ID format');
  }

  if (!assignedTo || !isUUID(assignedTo)) {
    throw new ApiError(400, 'Agent ID (assignedTo) is required and must be a valid UUID');
  }

  const lead = await prisma.lead.findFirst({
    where: { id, isDeleted: false },
  });

  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  const agent = await prisma.user.findFirst({
    where: { id: assignedTo, role: 'AGENT', isActive: true },
  });

  if (!agent) {
    throw new ApiError(400, 'Agent not found or is inactive');
  }

  const updatedLead = await prisma.$transaction(async (tx) => {
    const updated = await tx.lead.update({
      where: { id },
      data: { assignedTo },
      include: {
        agent: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.activityLog.create({
      data: {
        userId: req.user.id,
        leadId: id,
        action: 'LEAD_ASSIGNED',
        description: `Lead assigned to agent "${agent.name}" by ${req.user.name}`,
      },
    });

    return updated;
  });

  // Emit WebSocket notifications
  emitToUser(assignedTo, 'lead:assigned', {
    message: `New lead assigned to you: ${updatedLead.name}`,
    leadId: updatedLead.id,
    leadName: updatedLead.name,
  });

  // Send assignment email simulation
  await sendLeadAssignmentEmail(
    updatedLead.agent.email,
    updatedLead.agent.name,
    updatedLead.name,
    updatedLead.notes
  );

  emitGlobalUpdate('dashboard:refresh', { action: 'LEAD_ASSIGNED' });

  return sendSuccess(res, 'Lead assigned successfully', updatedLead);
});

module.exports = {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getMyLeads,
  assignLead,
};
