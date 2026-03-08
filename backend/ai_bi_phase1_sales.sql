-- ==========================================
-- PHASE 1: CRM & REVENUE INTELLIGENCE (SALES DATA)
-- ==========================================

-- 1. BI Lead Conversion History View
-- Analysis of Won vs Lost leads to identify winning patterns.
CREATE OR REPLACE VIEW bi_lead_conversion_history_view AS
SELECT 
    l.id AS lead_id,
    l.source,
    l.location,
    l.deal_value,
    l.status AS final_status,
    l.created_at,
    l.updated_at,
    -- Time to close (if Won or Lost)
    EXTRACT(DAY FROM (l.updated_at - l.created_at)) AS days_to_close,
    -- Total follow-ups count
    (SELECT COUNT(*) FROM public.follow_ups f WHERE f.lead_id = l.id) AS total_follow_ups,
    -- Types of follow-ups
    (SELECT COUNT(*) FROM public.follow_ups f WHERE f.lead_id = l.id AND f.type = 'Meeting') AS meeting_count,
    (SELECT COUNT(*) FROM public.follow_ups f WHERE f.lead_id = l.id AND f.type = 'Call') AS call_count
FROM public.leads l
WHERE l.status IN ('Won', 'Lost');

-- 2. BI Active Sales Pipeline View
-- Forecast-ready data for active leads.
CREATE OR REPLACE VIEW bi_active_sales_pipeline_view AS
SELECT 
    l.id AS lead_id,
    l.name AS lead_name,
    l.company,
    l.status AS stage,
    l.deal_value,
    l."source",
    l.created_at,
    -- Probability Weighting (Conceptual - AI will refine this)
    CASE 
        WHEN l.status = 'Negotiation' THEN 0.8
        WHEN l.status = 'Proposal' THEN 0.6
        WHEN l.status = 'Meeting' THEN 0.4
        WHEN l.status = 'Qualified' THEN 0.2
        ELSE 0.1
    END AS baseline_probability,
    (SELECT MAX(f.scheduled_at) FROM public.follow_ups f WHERE f.lead_id = l.id AND f.status = 'Pending') AS next_follow_up_date
FROM public.leads l
WHERE l.status NOT IN ('Won', 'Lost', 'Invalid');

-- 3. BI Follow-up Analysis View
-- Detailed sequence of actions to suggest "Next Best Action".
CREATE OR REPLACE VIEW bi_follow_up_analysis_view AS
SELECT 
    f.id AS follow_up_id,
    f.lead_id,
    l.name AS lead_name,
    l.status AS lead_status,
    f.type AS action_type,
    f.notes,
    f.status AS action_status,
    f.created_at,
    f.completed_at
FROM public.follow_ups f
JOIN public.leads l ON f.lead_id = l.id
ORDER BY f.lead_id, f.created_at DESC;

-- 4. GRANT SELECT ACCESS TO AI ANALYST
GRANT SELECT ON public.bi_lead_conversion_history_view TO ai_analyst;
GRANT SELECT ON public.bi_active_sales_pipeline_view TO ai_analyst;
GRANT SELECT ON public.bi_follow_up_analysis_view TO ai_analyst;
