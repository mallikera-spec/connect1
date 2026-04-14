-- ==========================================
-- Migration: Add Missing Indexes for Performance
-- Purpose: Resolve 500/504 timeout errors by eliminating full table scans
-- ==========================================

-- 1. Authentication & Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_designation ON public.profiles(designation);

-- 2. Projects & Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON public.project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON public.project_milestones(status);

-- 3. Timesheets
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON public.timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_work_date ON public.timesheets(work_date);

CREATE INDEX IF NOT EXISTS idx_timesheet_entries_timesheet_id ON public.timesheet_entries(timesheet_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_task_id ON public.timesheet_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_project_id ON public.timesheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_timesheet_entries_status ON public.timesheet_entries(status);

-- 4. Sales & Leads
CREATE INDEX IF NOT EXISTS idx_leads_assigned_agent_id ON public.leads(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);

CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_id ON public.follow_ups(lead_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_agent_id ON public.follow_ups(agent_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_scheduled_at ON public.follow_ups(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON public.follow_ups(status);

-- 5. Clients & Invoices
CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON public.clients(lead_id);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON public.invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 6. Attendance & HR
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON public.attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON public.leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);

-- 7. Analytics Views Support (Composite Indexes for speed)
-- Optimizing bi_lead_conversion_history_view
CREATE INDEX IF NOT EXISTS idx_leads_status_source_created_at ON public.leads(status, source, created_at);
-- Optimizing bi_active_sales_pipeline_view
CREATE INDEX IF NOT EXISTS idx_leads_status_deal_value ON public.leads(status, deal_value);

-- End of Migration
