import OpenAI from 'openai';
import { supabaseAdmin } from '../../config/supabase.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// The DDL of our read-only views so the AI knows EXACTLY what tables/columns exist.
const BI_SCHEMA_CONTEXT = `
You are an expert Data Analyst. You have READ-ONLY access to the following views via a JSON query builder.
You must ONLY query these views. Do NOT invent tables or columns.

Table: bi_lead_conversion_history_view (Historical Win/Loss Patterns)
Columns:
- source (text)
- location (text)
- deal_value (numeric)
- final_status (text) - 'Won' or 'Lost'.
- days_to_close (numeric)
- total_follow_ups (bigint)
- meeting_count, call_count

Table: bi_active_sales_pipeline_view (Active Leads & Forecasting)
Columns:
- lead_id (uuid)
- lead_name (text)
- company (text)
- stage (text) - 'Proposal', 'Negotiation', 'Qualified', etc.
- deal_value (numeric)
- source (text)
- baseline_probability (numeric) - 0.1 to 0.8 based on stage.
- next_follow_up_date (timestamp)

Table: bi_follow_up_analysis_view (Interaction Sequence)
Columns:
- lead_id (uuid)
- lead_name (text)
- lead_status (text)
- action_type (text) - 'Call', 'Meeting', 'Email', etc.
- notes (text)
- action_status (text)
- created_at, completed_at

Table: bi_hr_payroll_view (Employee Costs)
Columns:
- slip_id, payroll_period_id, month, year, gross_salary, net_payable, employee_name, employee_department, employee_designation, employee_ctc

Table: bi_employee_burnout_risk_view (Burnout & Retention Analysis)
Columns:
- user_id (uuid)
- employee_name (text)
- department (text)
- avg_daily_hours (numeric)
- overtime_days_count (bigint) - Days > 9h.
- recent_leaves_60d (bigint)
- blocked_tasks_count (bigint) - Tasks marked as 'blocked'.

Table: bi_employee_performance_detailed_view (Detailed Performance Review)
Columns:
- user_id (uuid)
- employee_name (text)
- designation (text)
- tasks_completed (bigint)
- total_estimated (numeric)
- total_actual (numeric)
- completion_rate (numeric) - % of assigned tasks completed.
- qa_feedback_received (bigint)

Table: bi_projects_view (Operations & Delivery Summary)
Columns:
- project_id (uuid)
- project_name (text)
- project_status (text)
- project_deal_value (numeric)
- due_date (date)
- days_committed (integer)
- total_tasks (bigint)
- completed_tasks (bigint)
- total_estimated_hours (numeric)
- total_actual_hours (numeric)

Table: bi_project_health_detailed_view (Granular Project Risk Data)
Columns:
- project_id (uuid)
- project_name (text)
- project_status (text)
- due_date (date)
- total_estimated_hours (numeric)
- total_actual_hours_tasks (numeric)
- total_hours_spent_timesheet (numeric)
- total_tasks (bigint)
- completed_tasks (bigint)
- days_until_deadline (integer) - Negative if overdue.

Table: bi_developer_bandwidth_view (Resource Allocation & Velocity)
Columns:
- developer_id (uuid)
- developer_name (text)
- department (text)
- active_tasks_count (bigint)
- completed_tasks_count (bigint)
- total_actual_hours_logged (numeric)
- historical_velocity_factor (numeric) - Value > 1.0 means the dev typically takes MORE time than estimated.

CRITICAL INSTRUCTIONS:
1. You must respond with a JSON object specifying parameters for a Supabase query.
2. JSON structure:
   {
     "view": "bi_sales_view" | "bi_hr_payroll_view" | "bi_projects_view" | "bi_project_health_detailed_view" | "bi_developer_bandwidth_view" | "bi_employee_burnout_risk_view" | "bi_employee_performance_detailed_view",
     "select": "col1,col2,col3",
     "limit": 100
   }
3. DO NOT use SQL functions like count(), sum(), or group by. The library does NOT support them in the select parameter.
4. If the user asks for a total or count, just SELECT the relevant columns for all rows, and the second step will summarize them.
5. If the user asks which Project is at risk, use "bi_project_health_detailed_view" and compare total_estimated_hours vs total_hours_spent_timesheet.
6. If the user asks for a developer recommendation, use "bi_developer_bandwidth_view" and look for low active_tasks_count and low historical_velocity_factor.
7. For burnout detection, use "bi_employee_burnout_risk_view". Look for high avg_daily_hours (>9) and high recent_leaves_60d or blocked_tasks_count.
8. For performance reviews, use "bi_employee_performance_detailed_view". Correlate completion_rate with qa_feedback_received.
9. For lead scoring, use "bi_lead_conversion_history_view" to find winning patterns (source/count) and apply to active leads.
10. For revenue forecasting, use "bi_active_sales_pipeline_view" and multiply deal_value by baseline_probability.
11. For next-best-action, use "bi_follow_up_analysis_view" to see what actions preceded "Won" status in history.
12. ONLY return valid JSON. No markdown.
`;

export const executeAIQuery = async (userQuestion) => {
    try {
        // Step 1: LLM translates Question -> Query Config
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: BI_SCHEMA_CONTEXT },
                { role: 'user', content: `Translate this question to a query config: "${userQuestion}"` }
            ],
            temperature: 0,
        });

        const queryConfig = JSON.parse(aiResponse.choices[0].message.content);

        // Step 2: Execute using the standard Supabase JS client (works over HTTP/IPv4)
        const { data: rawData, error: dbError } = await supabaseAdmin
            .from(queryConfig.view)
            .select(queryConfig.select || '*')
            .limit(queryConfig.limit || 500);

        if (dbError) {
            console.error('Supabase Client Error:', dbError);
            throw new Error('Database Error: ' + dbError.message);
        }

        // If no data, return early
        if (!rawData || rawData.length === 0) {
            return {
                summary: "I ran the query, but no data matched your request.",
                chartType: "table",
                chartData: []
            };
        }

        // Step 3: LLM formats the raw JSON rows into a neat Chart object for the Frontend
        const formatResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            messages: [
                {
                    role: 'system',
                    content: `You are a Data Visualization expert. Look at the provided RAW DATABASE OUTPUT.
Return a JSON object containing EXACTLY these keys:
- "summary": A concise, natural language explanation of the data (1-2 sentences). You can perform calculations like sums, averages, and counts based on the raw data.
- "chartType": Must be one of: "bar", "line", "pie", or "table". (If it's a simple list with > 15 rows or non-numeric, use "table").
- "chartData": An array of objects formatted for Recharts.

Rules for Recharts:
- If "chartType" is "bar" or "line", "chartData" should be an array of objects where one key is a category (e.g. "name", "month") and other keys are numeric values. Aggregations (like group by) must be done by YOU here in this step.
- If "chartType" is "pie", "chartData" should be an array of objects with "name" and "value" keys.
- If "chartType" is "table", "chartData" is just the array of row objects.

RAW DATABASE OUTPUT:`
                },
                { role: 'user', content: JSON.stringify(rawData) }
            ],
            temperature: 0,
        });

        const finalOutput = JSON.parse(formatResponse.choices[0].message.content);
        return {
            ...finalOutput,
            queryConfig // Include the query config for transparency
        };

    } catch (error) {
        console.error('AI Query Error:', error);
        throw new Error('Failed to process AI Query: ' + error.message);
    }
};
