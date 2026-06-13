const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .refine(
        (val) => /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val),
        'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number'
      ),
    role: z.enum(['ADMIN', 'MANAGER', 'AGENT']).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};
