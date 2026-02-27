-- Create Sales Module Tables
-- 1. Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    name text NOT NULL,
    company text,
    email text,
    phone text,
    source text,
    status text DEFAULT 'New' NOT NULL CHECK (status IN ('New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost')),
    score integer DEFAULT 1 CHECK (score >= 1 AND score <= 10),
    deal_value numeric(12, 2) DEFAULT 0,
    assigned_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    owner_id uuid DEFAULT auth.uid() NOT NULL REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Follow-Ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('Call', 'Email', 'Meeting', 'Note')),
    notes text,
    status text DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    scheduled_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

-- RBAC Policies for Leads
-- Sales Agents can view leads assigned to them or created by them
-- Managers can view all leads
CREATE POLICY "Users can view accessible leads" ON public.leads
    FOR SELECT USING (
        auth.uid() = assigned_agent_id 
        OR auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('Super Admin', 'Sales Manager')
        )
    );

-- Users can insert leads if authenticated
CREATE POLICY "Authenticated users can create leads" ON public.leads
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Leads can be updated by their owner, assigned agent, or a manager
CREATE POLICY "Authorized users can update leads" ON public.leads
    FOR UPDATE USING (
        auth.uid() = assigned_agent_id 
        OR auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('Super Admin', 'Sales Manager')
        )
    );

-- RBAC Policies for Follow-Ups
CREATE POLICY "Users can view follow-ups for accessible leads" ON public.follow_ups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = follow_ups.lead_id 
            AND (
                leads.assigned_agent_id = auth.uid() 
                OR leads.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    JOIN public.roles r ON r.id = ur.role_id
                    WHERE ur.user_id = auth.uid() 
                    AND r.name IN ('Super Admin', 'Sales Manager')
                )
            )
        )
    );

CREATE POLICY "Users can create follow-ups for accessible leads" ON public.follow_ups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = follow_ups.lead_id 
            AND (
                leads.assigned_agent_id = auth.uid() 
                OR leads.owner_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.user_roles ur
                    JOIN public.roles r ON r.id = ur.role_id
                    WHERE ur.user_id = auth.uid() 
                    AND r.name IN ('Super Admin', 'Sales Manager')
                )
            )
        )
    );

-- Automatic Updated At Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_follow_ups_updated_at ON public.follow_ups;
CREATE TRIGGER update_follow_ups_updated_at BEFORE UPDATE ON public.follow_ups FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();