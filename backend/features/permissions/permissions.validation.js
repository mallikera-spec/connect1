import { z } from 'zod';

// permissions table uses 'name' column (not slug)
export const createPermissionSchema = z.object({
    name: z.string().min(1).regex(/^[a-z_]+$/, 'Name must be lowercase with underscores'),
    description: z.string().optional(),
});
