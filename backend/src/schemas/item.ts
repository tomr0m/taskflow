import { z } from 'zod';

const dateField = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) throw new Error('Invalid date');
    return d;
  });

const baseFields = {
  type: z.enum(['TASK', 'MEETING', 'REMINDER', 'DEADLINE', 'EVENT'] as const),
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 chars or less'),
  description: z.string().max(5000, 'Description too long').optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as const),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const),
  startDate: dateField,
  endDate: dateField,
  assigneeId: z.number().int().positive().optional().nullable(),
};

const dateRefinement = (data: { startDate?: Date | null; endDate?: Date | null }) => {
  if (data.startDate && data.endDate) return data.endDate >= data.startDate;
  return true;
};

export const CreateItemSchema = z
  .object({
    ...baseFields,
    status: baseFields.status.default('TODO'),
    priority: baseFields.priority.default('MEDIUM'),
  })
  .refine(dateRefinement, { message: 'End date must be on or after start date', path: ['endDate'] });

export const UpdateItemSchema = z
  .object({
    type: baseFields.type.optional(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).optional().nullable(),
    status: baseFields.status.optional(),
    priority: baseFields.priority.optional(),
    startDate: dateField,
    endDate: dateField,
    assigneeId: z.number().int().positive().optional().nullable(),
  })
  .refine(dateRefinement, { message: 'End date must be on or after start date', path: ['endDate'] });
