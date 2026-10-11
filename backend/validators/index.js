import { z } from 'zod';

export const registerSchema = z.object({
  name:       z.string().min(2, 'Name must be at least 2 characters').max(80),
  email:      z.string().email('Invalid email address').max(150),
  password:   z.string().min(6, 'Password must be at least 6 characters').max(128),
  campus:     z.string().min(2, 'Campus is required').max(100),
  role:       z.enum(['requester', 'carrier']).optional().default('requester'),
  phone:      z.string().max(15).optional().nullable(),
});

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createRequestSchema = z.object({
  title:           z.string().min(3, 'Title must be at least 3 characters').max(150),
  description:     z.string().max(500).optional().nullable(),
  pickup_location: z.string().min(3, 'Pickup location required').max(200),
  dropoff_location:z.string().min(3, 'Dropoff location required').max(200),
  reward:          z.number({ required_error: 'Reward is required' }).positive('Reward must be positive'),
  weight_kg:       z.number().positive().max(100).optional().nullable(),
  deadline:        z.string().optional().nullable(),
});

export const acceptRequestSchema = z.object({});

export const cancelRequestSchema = z.object({});

export const updateStatusSchema = z.object({
  status: z.enum(['open', 'accepted', 'in_progress', 'delivered', 'cancelled']),
});

export const locationUpdateSchema = z.object({
  lat:      z.number({ required_error: 'lat is required' }).min(-90).max(90),
  lng:      z.number({ required_error: 'lng is required' }).min(-180).max(180),
  request_id: z.number().optional().nullable(),
});

export const feedbackSchema = z.object({
  request_id: z.number({ required_error: 'request_id is required' }).positive(),
  to_user_id: z.number({ required_error: 'to_user_id is required' }).positive(),
  rating:     z.number().int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5'),
  comment:    z.string().max(500).optional().nullable(),
});

export const chatMessageSchema = z.object({
  request_id: z.number({ required_error: 'request_id is required' }).positive(),
  message:    z.string().min(1, 'Message cannot be empty').max(2000),
});

export const updateUserSchema = z.object({
  name:       z.string().min(2).max(80).optional(),
  campus:     z.string().min(2).max(100).optional(),
  bio:        z.string().max(300).optional().nullable(),
  avatar_url: z.string().url('Must be a valid URL').optional().nullable(),
});

export const reportSchema = z.object({
  reported_user_id: z.number().positive().optional(),
  request_id:       z.number().positive().optional().nullable(),
  reason:           z.string().min(10, 'Reason must be at least 10 characters').max(500),
});

export const withdrawalSchema = z.object({
  amount:  z.number().positive('Amount must be positive').max(100000),
  upi_id:  z.string().regex(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/, 'Invalid UPI ID format'),
});

export const feedbackCheckSchema = z.object({
  requestId: z.coerce.number().positive(),
});

export const userParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

export const notificationReadSchema = z.object({
  id: z.coerce.number().positive(),
});

export const locationParamsSchema = z.object({
  userId: z.coerce.number().positive(),
});

/**
 * Type exports (for TypeScript consumers — ignored by plain JS)
 * These use TS syntax; if you're using plain JS, import the schemas directly.
 */
// export type RegisterInput     = z.infer<typeof registerSchema>;
// export type LoginInput        = z.infer<typeof loginSchema>;
// export type CreateRequestInput = z.infer<typeof createRequestSchema>;
// export type UpdateStatusInput  = z.infer<typeof updateStatusSchema>;
// export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>;
// export type FeedbackInput      = z.infer<typeof feedbackSchema>;
// export type ChatMessageInput   = z.infer<typeof chatMessageSchema>;
// export type UpdateUserInput    = z.infer<typeof updateUserSchema>;
// export type ReportInput        = z.infer<typeof reportSchema>;
// export type WithdrawalInput    = z.infer<typeof withdrawalSchema>;
