-- ==========================================
-- PHASE 3: PROJECT HEALTH & RISK ANALYSIS (OPS DATA)
-- ==========================================

-- 1. BI Project Health Detailed View
-- Aggregates task estimates vs actual timesheet entries to detect burn rate risks.
-- This supports "Predictive Delay Alerts".
CREATE OR REPLACE VIEW bi_project_health_detailed_view AS
SELECT 
    p.id AS project_id,
    p.name AS project_name,
    p.status AS project_status,
    p.due_date,
    COALESCE(SUM(t.estimated_hours), 0) AS total_estimated_hours,
    COALESCE(SUM(t.actual_hours), 0) AS total_actual_hours_tasks,
    -- Join timesheet_entries manually to ensure precision if needed, or use subquery
    (SELECT COALESCE(SUM(
        CASE 
            WHEN te.hours_spent ~ '^[0-9]+:[0-9]+$' THEN 
                split_part(te.hours_spent, ':', 1)::numeric + split_part(te.hours_spent, ':', 2)::numeric / 60.0
            WHEN te.hours_spent ~ '^[0-9.]+$' THEN 
                te.hours_spent::numeric
            ELSE 0 
        END
    ), 0) FROM public.timesheet_entries te WHERE te.project_id = p.id) AS total_hours_spent_timesheet,
    COUNT(t.id) AS total_tasks,
    SUM(CASE WHEN t.status IN ('done', 'verified') THEN 1 ELSE 0 END) AS completed_tasks,
    p.due_date - CURRENT_DATE AS days_until_deadline
FROM public.projects p
LEFT JOIN public.tasks t ON p.id = t.project_id
GROUP BY p.id, p.name, p.status, p.due_date;

-- 2. BI Developer Bandwidth & Velocity View
-- Shows current workload and historical performance for resource allocation.
-- This supports "Smart Resource Allocation".
CREATE OR REPLACE VIEW bi_developer_bandwidth_view AS
SELECT 
    prof.id AS developer_id,
    prof.full_name AS developer_name,
    prof.department,
    -- Active tasks (todo, in_progress, etc.)
    COUNT(t.id) FILTER (WHERE t.status NOT IN ('done', 'verified', 'failed')) AS active_tasks_count,
    -- Completed tasks
    COUNT(t.id) FILTER (WHERE t.status IN ('done', 'verified')) AS completed_tasks_count,
    -- Historical performance: total hours logged vs estimated for completed tasks
    COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status IN ('done', 'verified')), 0) AS total_actual_hours_logged,
    -- Velocity factor (Actual / Estimated). < 1 means faster than estimated, > 1 means slower.
    COALESCE(
        AVG(CASE WHEN t.status IN ('done', 'verified') AND t.estimated_hours > 0 
                 THEN t.actual_hours / t.estimated_hours 
            END), 
    1.0) AS historical_velocity_factor
FROM public.profiles prof
LEFT JOIN public.tasks t ON prof.id = t.assigned_to
GROUP BY prof.id, prof.full_name, prof.department;

-- 3. GRANT SELECT ACCESS TO AI ANALYST
GRANT SELECT ON public.bi_project_health_detailed_view TO ai_analyst;
GRANT SELECT ON public.bi_developer_bandwidth_view TO ai_analyst;
