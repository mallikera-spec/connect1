-- Supabase Migration: Invoice System

-- 1. Create Sequence for Invoice Numbering (Sequential)
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq;

-- 2. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT UNIQUE NOT NULL DEFAULT ('INV-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(NEXTVAL('public.invoice_number_seq'::regclass)::TEXT, 4, '0')),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'void', 'partially_paid')),
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    terms_and_conditions TEXT DEFAULT 'Please pay by the due date.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Invoice Items Table
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(15,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
    total DECIMAL(15,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Assuming a standard role-based check for high-level management
-- Replace with specific application roles if different
CREATE POLICY "Finance staff can manage invoices" ON public.invoices
    FOR ALL
    TO authenticated
    USING (
        auth.jwt()->>'role' IN ('super_admin', 'director', 'cfo')
    );

CREATE POLICY "Finance staff can manage invoice items" ON public.invoice_items
    FOR ALL
    TO authenticated
    USING (
        invoice_id IN (SELECT id FROM public.invoices)
    );

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Comments
COMMENT ON TABLE public.invoices IS 'Header level details for client invoices.';
COMMENT ON TABLE public.invoice_items IS 'Line items for specific invoices.';
