import { z } from 'zod';

export const rolePermissionSchema = z.object({
    role_id: z.string().uuid(),
    permission_id: z.string().uuid(),
});
