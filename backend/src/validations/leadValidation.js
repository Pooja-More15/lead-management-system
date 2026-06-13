const { z } = require('zod');

const createLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(5, 'Phone number must be at least 5 characters'),
    source: z.string().min(2, 'Source must be at least 2 characters'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    notes: z.string().optional(),
  }),
});

const updateLeadSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    email: z.string().email('Invalid email format').optional(),
    phone: z.string().min(5, 'Phone number must be at least 5 characters').optional(),
    source: z.string().min(2, 'Source must be at least 2 characters').optional(),
    status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'LOST']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    notes: z.string().optional(),
    assignedTo: z.string().uuid('Invalid agent ID format').nullable().optional(),
  }),
});

module.exports = {
  createLeadSchema,
  updateLeadSchema,
};
