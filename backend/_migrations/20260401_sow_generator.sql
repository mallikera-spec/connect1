-- Projects table (stores all generated data)
CREATE TABLE IF NOT EXISTS public.sow_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  form_data JSONB NOT NULL,          -- Raw PM input
  sow_data JSONB,                    -- AI generated SoW content
  dev_tasks JSONB,                   -- AI generated dev tasks array
  qa_tasks JSONB,                    -- AI generated QA tasks array
  deployment_tasks JSONB,            -- AI generated deployment tasks
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'finalized', 'sent')), -- draft | finalized | sent
  pdf_url TEXT,                      -- Cloudinary URL of generated PDF
  docx_url TEXT,                     -- Cloudinary URL of generated DOCX
  dev_csv_url TEXT,
  qa_csv_url TEXT,
  deployment_csv_url TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generation log (tracks API calls and costs)
CREATE TABLE IF NOT EXISTS public.sow_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.sow_projects(id) ON DELETE CASCADE,
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd DECIMAL(10,6),
  duration_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Templates (for custom SoW templates per project type)
CREATE TABLE IF NOT EXISTS public.sow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  project_type TEXT,
  system_prompt TEXT,
  html_template TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger for sow_projects
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sow_projects_updated_at
BEFORE UPDATE ON public.sow_projects
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
