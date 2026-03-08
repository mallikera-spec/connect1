-- SQL Script to fix missing relationship between follow_ups and profiles

-- 1. Ensure the agent_id column in follow_ups is correctly linked to public.profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'follow_ups_agent_id_fkey' 
        AND table_name = 'follow_ups'
    ) THEN
        ALTER TABLE public.follow_ups
        ADD CONSTRAINT follow_ups_agent_id_fkey
        FOREIGN KEY (agent_id) 
        REFERENCES public.profiles(id)
        ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Notify PostgREST to reload the schema cache so it picks up the new relationship
NOTIFY pgrst, 'reload schema';
