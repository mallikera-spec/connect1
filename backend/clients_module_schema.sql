-- Create Clients Table
CREATE TABLE IF NOT EXISTS public.clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL, -- Optional link back to original lead
    company_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    status text DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Inactive', 'Archived')),
    owner_id uuid DEFAULT auth.uid() NOT NULL REFERENCES public.profiles(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RBAC Policies for Clients
-- Admins, Project Managers, and Sales Managers can view all clients
-- Otherwise, users can view clients if they are the owner
CREATE POLICY "Users can view accessible clients" ON public.clients
    FOR SELECT USING (
        auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('Super Admin', 'Admin', 'Project Manager', 'Sales Manager')
        )
    );

-- Authenticated users (like BDMs completing a sale) can insert clients
CREATE POLICY "Authenticated users can create clients" ON public.clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Authorized users can update clients
CREATE POLICY "Authorized users can update clients" ON public.clients
    FOR UPDATE USING (
        auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('Super Admin', 'Admin', 'Project Manager')
        )
    );

-- Authorized users can delete clients
CREATE POLICY "Authorized users can delete clients" ON public.clients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON r.id = ur.role_id
            WHERE ur.user_id = auth.uid() 
            AND r.name IN ('Super Admin', 'Admin')
        )
    );

-- Automatic Updated At Trigger
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
