-- ==========================================
-- EXECUTIVE BI: SUPABASE READ-ONLY ROLE & VIEWS SETUP
-- ==========================================

-- 1. CREATE THE READ-ONLY ROLE
-- First, we create a secure, passwordless role specifically for the AI Analyst.
-- This role cannot log in directly to the Supabase dashboard but can be used via the REST/GraphQL/Connection String.
CREATE ROLE ai_analyst NOLOGIN;

-- Grant basic usage to the public schema so the AI can see the tables/views inside it.
GRANT USAGE ON SCHEMA public TO ai_analyst;

-- Explicitly revoke all default privileges to ensure the AI has no write access anywhere
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM ai_analyst;


-- ==========================================
-- 2. CREATE SECURE VIEWS 
-- We create VIEWS instead of granting direct table access to prevent the AI from seeing 
-- highly sensitive columns (like passwords, auth tokens, or exact bank account numbers) 
-- while still exposing aggregated, meaningful data for dashboard queries.
-- ==========================================

-- A. BI Sales View (CRM Data)
-- Combines lead data with the basic profile of the assigned agent, stripping out PII where not needed for analytics.
CREATE OR REPLACE VIEW bi_sales_view AS 
SELECT 
    l.id AS lead_id,
    l.company,
    l.source,
    l.status AS lead_status,
    l.score as lead_score,
    l.deal_value,
    l.created_at AS lead_created_at,
    p.full_name AS agent_name,
    p.department AS agent_department
FROM leads l
LEFT JOIN profiles p ON l.assigned_agent_id = p.id;

-- B. BI HR & Payroll View (Employee Performance & Costs)
-- Joins salary slips with basic profile data to analyze cost centers without exposing bank details.
CREATE OR REPLACE VIEW bi_hr_payroll_view AS
SELECT
    ss.id AS slip_id,
    ss.payroll_period_id,
    pp.month,
    pp.year,
    ss.total_days,
    ss.working_days,
    ss.present_days,
    ss.lwp_days,
    ss.gross_salary,
    ss.net_payable,
    p.full_name AS employee_name,
    p.department AS employee_department,
    p.designation AS employee_designation,
    p.ctc AS employee_ctc
FROM salary_slips ss
JOIN profiles p ON ss.user_id = p.id
JOIN payroll_periods pp ON ss.payroll_period_id = pp.id;

-- C. BI Projects View (Operations & Delivery)
-- Joins projects with aggregated task data to see which projects are delayed or over budget on hours.
CREATE OR REPLACE VIEW bi_projects_view AS
SELECT 
    proj.id AS project_id,
    proj.name AS project_name,
    proj.status AS project_status,
    proj.deal_value AS project_deal_value,
    proj.due_date,
    proj.days_committed,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS completed_tasks,
    SUM(COALESCE(t.estimated_hours, 0)) AS total_estimated_hours,
    SUM(COALESCE(t.actual_hours, 0)) AS total_actual_hours
FROM projects proj
LEFT JOIN tasks t ON proj.id = t.project_id
GROUP BY proj.id, proj.name, proj.status, proj.deal_value, proj.due_date, proj.days_committed;


-- ==========================================
-- 3. GRANT SELECT ACCESS ON VIEWS ONLY
-- Now we grant the AI role purely SELECT (read) access to these specific views.
-- ==========================================

GRANT SELECT ON public.bi_sales_view TO ai_analyst;
GRANT SELECT ON public.bi_hr_payroll_view TO ai_analyst;
GRANT SELECT ON public.bi_projects_view TO ai_analyst;

-- Example showing we DO NOT grant access to the raw tables like `profiles` or `salary_slips` directly.
-- The AI can ONLY see what is explicitly queried inside `bi_sales_view`, `bi_hr_payroll_view`, and `bi_projects_view`.
