-- ==========================================
-- PHASE 2: EMPLOYEE PRODUCTIVITY & RETENTION (HR DATA)
-- ==========================================

-- 1. BI Employee Burnout & Flight Risk View
-- Analyzes attendance (overtime), leave frequency, and blocked projects.
CREATE OR REPLACE VIEW bi_employee_burnout_risk_view AS
SELECT 
    p.id AS user_id,
    p.full_name AS employee_name,
    p.department,
    -- Calculate average daily work hours from attendance
    COALESCE(AVG(EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600), 0) AS avg_daily_hours,
    -- Count of "Overtime" days (defined as > 9 hours)
    COUNT(a.id) FILTER (WHERE EXTRACT(EPOCH FROM (a.check_out_time - a.check_in_time)) / 3600 > 9) AS overtime_days_count,
    -- Count of Leave Requests in the last 60 days (approved or pending)
    (SELECT COUNT(*) FROM public.leave_requests lr 
     WHERE lr.user_id = p.id AND lr.start_date >= (CURRENT_DATE - INTERVAL '60 days')) AS recent_leaves_60d,
    -- Blocked Work: Count of tasks or timesheet entries with status 'blocked'
    (SELECT COUNT(*) FROM public.timesheet_entries te 
     WHERE te.timesheet_id IN (SELECT id FROM public.timesheets WHERE user_id = p.id) 
     AND te.status = 'blocked') AS blocked_tasks_count
FROM public.profiles p
LEFT JOIN public.attendance a ON p.id = a.user_id
GROUP BY p.id, p.full_name, p.department;

-- 2. BI Employee Performance Detailed View
-- Correlates estimates vs actuals and incorporates QA feedback.
CREATE OR REPLACE VIEW bi_employee_performance_detailed_view AS
SELECT 
    p.id AS user_id,
    p.full_name AS employee_name,
    p.designation,
    -- Total tasks completed
    COUNT(t.id) FILTER (WHERE t.status IN ('done', 'verified')) AS tasks_completed,
    -- Efficiency Ratio: Estimated vs Actual Hours
    COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status IN ('done', 'verified')), 0) AS total_estimated,
    COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status IN ('done', 'verified')), 0) AS total_actual,
    -- Percentage of tasks completed vs total assigned
    CASE 
        WHEN COUNT(t.id) > 0 THEN (COUNT(t.id) FILTER (WHERE t.status IN ('done', 'verified'))::float / COUNT(t.id)) * 100 
        ELSE 0 
    END AS completion_rate,
    -- QA Feedback count: How many times has this developer received feedback?
    (SELECT COUNT(*) FROM public.qa_feedback qf 
     WHERE qf.item_type = 'task' AND qf.item_id IN (SELECT id FROM public.tasks WHERE assigned_to = p.id)) AS qa_feedback_received
FROM public.profiles p
LEFT JOIN public.tasks t ON p.id = t.assigned_to
GROUP BY p.id, p.full_name, p.designation;

-- 3. GRANT SELECT ACCESS TO AI ANALYST
GRANT SELECT ON public.bi_employee_burnout_risk_view TO ai_analyst;
GRANT SELECT ON public.bi_employee_performance_detailed_view TO ai_analyst;
