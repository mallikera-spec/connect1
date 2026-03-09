import OpenAI from 'openai';
import { supabaseAdmin } from '../../config/supabase.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// The DDL of our read-only views so the AI knows EXACTLY what tables/columns exist.
const BI_SCHEMA_CONTEXT = `
You are an expert Data Analyst. You have READ-ONLY access to the following views via a JSON query builder.
You must ONLY query these views. Do NOT invent tables or columns.

Table: bi_sales_view (General Sales Summary)
Columns: lead_id, company, source, lead_status, lead_score, deal_value, lead_created_at, agent_name, agent_department

Table: bi_lead_conversion_history_view (Historical Win/Loss Patterns)
Columns: source, location, deal_value, final_status ('Won' or 'Lost'), days_to_close, total_follow_ups, meeting_count, call_count

Table: bi_active_sales_pipeline_view (Active Leads & Forecasting)
Columns: lead_id, lead_name, company, stage, deal_value, source, baseline_probability (0.1 to 0.8), next_follow_up_date

Table: bi_follow_up_analysis_view (Interaction Sequence)
Columns: lead_id, lead_name, lead_status, action_type, notes, action_status, created_at, completed_at

Table: bi_hr_payroll_view (Employee Costs)
Columns: slip_id, payroll_period_id, month, year, gross_salary, net_payable, employee_name, employee_department, employee_designation, employee_ctc

Table: bi_employee_burnout_risk_view (Burnout & Retention Analysis)
Columns: user_id, employee_name, department, avg_daily_hours, overtime_days_count, recent_leaves_60d, blocked_tasks_count

Table: bi_employee_performance_detailed_view (Detailed Performance Review)
Columns: user_id, employee_name, designation, tasks_completed, total_estimated, total_actual, completion_rate (%), qa_feedback_received

Table: bi_projects_view (Operations & Delivery Summary)
Columns: project_id, project_name, project_status, project_deal_value, due_date, days_committed, total_tasks, completed_tasks, total_estimated_hours, total_actual_hours

Table: bi_project_health_detailed_view (Granular Project Risk Data)
Columns: project_id, project_name, project_status, due_date, total_estimated_hours, total_actual_hours_tasks, total_hours_spent_timesheet, total_tasks, completed_tasks, days_until_deadline

CRITICAL INSTRUCTIONS:
1. You must respond with a JSON object specifying parameters for a Supabase query.
2. JSON structure:
   {
     "view": "view_name",
     "select": "col1,col2,col3",
     "limit": 100,
     "filter": { "column": "col_name", "operator": "eq|gte|lte", "value": "some_value" }
   }
4. DO NOT use SQL functions like count(), sum(), or group by in the select parameter.
5. Filter Usage: Use "gte" with YYYY-MM-DD for date ranges (e.g. for "last month", filter lead_created_at gte 2024-02-01).
6. For forecasting, use "bi_active_sales_pipeline_view" and deal_value * baseline_probability.
7. For project risk, compare total_estimated_hours vs total_hours_spent_timesheet in "bi_project_health_detailed_view".
8. Focus on providing data that can be displayed in a table.
9. ONLY return valid JSON. No markdown.
`;

export const executeAIQuery = async (userQuestion) => {
    try {
        // Step 1: LLM translates Question -> Query Config
        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            messages: [
                { role: 'system', content: BI_SCHEMA_CONTEXT },
                { role: 'user', content: `Current Date is ${new Date().toISOString().split('T')[0]}. Translate this question to a query config: "${userQuestion}"` }
            ],
            temperature: 0,
        });

        const queryConfig = JSON.parse(aiResponse.choices[0].message.content);

        // Step 2: Execute using the standard Supabase JS client
        let query = supabaseAdmin
            .from(queryConfig.view)
            .select(queryConfig.select || '*')
            .limit(queryConfig.limit || 100);

        // Apply dynamic filter if provided
        if (queryConfig.filter) {
            const { column, operator, value } = queryConfig.filter;
            if (operator === 'eq') query = query.eq(column, value);
            else if (operator === 'gte') query = query.gte(column, value);
            else if (operator === 'lte') query = query.lte(column, value);
        }

        const { data: rawData, error: dbError } = await query;

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
        // TOKEN OPTIMIZATION: If rawData is very large (> 50 rows), send a sample to the LLM 
        // for summary/chart logic to stay under 429 limits. The Frontend still gets the full data.
        const previewData = rawData.length > 50 ? rawData.slice(0, 50) : rawData;
        const isTruncated = rawData.length > 50;

        const formatResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            response_format: { type: "json_object" },
            messages: [
                {
                    role: 'system',
                    content: `You are a Data Visualization expert. Look at the provided RAW DATABASE OUTPUT.
Return a JSON object containing EXACTLY these keys:
- "summary": A concise explanation. ${isTruncated ? `NOTE: The data below is a SAMPLE (first 50 rows). The full dataset has ${rawData.length} rows. Provide a summary based on this sample.` : 'Perform calculations like sums/averages for the summary.'}
- "chartType": "bar", "line", "pie", or "table".
- "chartData": Aggregated rows for Recharts. (If data > 50 rows or non-numeric, use "table").

RAW DATABASE OUTPUT (SAMPLE):`
                },
                { role: 'user', content: JSON.stringify(previewData) }
            ],
            temperature: 0,
        });

        const finalOutput = JSON.parse(formatResponse.choices[0].message.content);

        // Ensure we return the FULL rawData if it's a table
        return {
            ...finalOutput,
            chartData: finalOutput.chartType === 'table' ? rawData : finalOutput.chartData,
            queryConfig
        };

    } catch (error) {
        console.error('AI Query Error:', error);
        throw new Error('Failed to process AI Query: ' + error.message);
    }
};
