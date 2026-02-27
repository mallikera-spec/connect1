-- Add client_id to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;

-- Update RLS policies?
-- A project should inherit view permissions if a user has access to a client, etc., but for now, rely on existing project view policies.
