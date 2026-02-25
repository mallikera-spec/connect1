import { z } from 'zod';

export const userRoleSchema = z.object({
    user_id: z.string().uuid(),
    role_id: z.string().uuid(),
});
