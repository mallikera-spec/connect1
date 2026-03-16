-- ==========================================
-- FINANCE MODULE: DATABASE MIGRATION
-- ==========================================

-- 1. Entities Table (Accounts, Partners, Cash)
CREATE TABLE IF NOT EXISTS public.finance_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Bank', 'Cash', 'Partner')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Income Table
CREATE TABLE IF NOT EXISTS public.finance_income (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT DEFAULT 'INR',
    type TEXT NOT NULL CHECK (type IN ('Domestic', 'International')),
    entity_id UUID REFERENCES public.finance_entities(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    description TEXT,
    category TEXT DEFAULT 'Project',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- 3. Expenses Table
CREATE TABLE IF NOT EXISTS public.finance_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    category TEXT NOT NULL,
    description TEXT,
    entity_id UUID REFERENCES public.finance_entities(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id)
);

-- 4. Assets Table
CREATE TABLE IF NOT EXISTS public.finance_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_date DATE NOT NULL,
    item_name TEXT NOT NULL,
    cost NUMERIC NOT NULL CHECK (cost >= 0),
    entity_id UUID REFERENCES public.finance_entities(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Disposed', 'Sold')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Partners Table
CREATE TABLE IF NOT EXISTS public.finance_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    email TEXT,
    joined_date DATE NOT NULL,
    exit_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Settlement Records
CREATE TABLE IF NOT EXISTS public.finance_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_income NUMERIC NOT NULL,
    total_expenses NUMERIC NOT NULL,
    net_profit NUMERIC NOT NULL,
    settlement_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Partner Settlement Shares (Line Items)
CREATE TABLE IF NOT EXISTS public.finance_settlement_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID REFERENCES public.finance_settlements(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES public.finance_partners(id) ON DELETE CASCADE,
    share_percentage NUMERIC NOT NULL,
    amount_paid NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- INITIAL DATA SEEDING
-- ==========================================

-- Seed Partners
INSERT INTO public.finance_partners (name, joined_date, is_active) VALUES
('Chandan', '2024-09-01', true),
('Krishna', '2024-09-01', true),
('Rishabh', '2024-09-01', true),
('Vansh', '2024-09-01', true),
('Dr Chadha', '2026-01-28', true),
('Jitendra ji', '2026-01-28', true)
ON CONFLICT (name) DO NOTHING;

-- Seed Entities
INSERT INTO public.finance_entities (name, type) VALUES
('Account-ArgosMob', 'Bank'),
('Account-KiloWatt', 'Bank'),
('Cash', 'Cash'),
('Chandan', 'Partner'),
('Krishna', 'Partner'),
('Rishabh', 'Partner'),
('Vansh', 'Partner'),
('Dr Chadha', 'Partner'),
('Jitendra ji', 'Partner')
ON CONFLICT (name) DO NOTHING;

-- ==========================================
-- AI REPORTING VIEWS FOR FINANCE
-- ==========================================

CREATE OR REPLACE VIEW public.bi_finance_summary_view AS
SELECT 
    (SELECT COALESCE(SUM(amount), 0) FROM public.finance_income) AS total_income,
    (SELECT COALESCE(SUM(amount), 0) FROM public.finance_expenses) AS total_expenses,
    (SELECT COALESCE(SUM(cost), 0) FROM public.finance_assets WHERE status = 'Active') AS total_assets_value;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_analyst;
GRANT SELECT ON ALL VIEWS IN SCHEMA public TO ai_analyst;
