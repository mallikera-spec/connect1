-- ==========================================
-- FINANCE MODULE: CATEGORY MIGRATION
-- ==========================================

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS public.finance_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#6366f1',
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Seed Initial Categories
INSERT INTO public.finance_categories (name, color, icon) VALUES
('Salaries', '#10b981', 'Users'),
('Rent', '#f59e0b', 'Home'),
('Utilities', '#3b82f6', 'Zap'),
('Marketing', '#ec4899', 'Megaphone'),
('Food', '#f97316', 'Coffee'),
('Office', '#64748b', 'Briefcase'),
('Software', '#8b5cf6', 'Code'),
('Personal', '#6366f1', 'User'),
('Legal', '#ef4444', 'Gavel'),
('Hosting', '#06b6d4', 'Server')
ON CONFLICT (name) DO NOTHING;

-- 3. Update Expenses Table
-- Add category_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'finance_expenses' AND column_name = 'category_id') THEN
        ALTER TABLE public.finance_expenses ADD COLUMN category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Migrate Existing Data
-- Map the text 'category' to the new UUID 'category_id'
UPDATE public.finance_expenses e
SET category_id = c.id
FROM public.finance_categories c
WHERE lower(e.category) = lower(c.name)
AND e.category_id IS NULL;

-- 5. Optional: Make category_id NOT NULL after migration if desired
-- ALTER TABLE public.finance_expenses ALTER COLUMN category_id SET NOT NULL;

-- 6. Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_categories TO authenticated;
GRANT SELECT ON public.finance_categories TO ai_analyst;
