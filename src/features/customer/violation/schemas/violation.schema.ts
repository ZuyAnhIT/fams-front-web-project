import { z } from 'zod';

export const violationResolutionSchema = z.object({
  action: z.enum(['confirm', 'dismiss']),
  note: z.string().max(1000, 'Nội dung tối đa 1000 ký tự.'),
}).superRefine((value, context) => {
  if (value.action === 'dismiss' && !value.note.trim()) {
    context.addIssue({ code: 'custom', path: ['note'], message: 'Lý do bỏ qua là bắt buộc.' });
  }
});
