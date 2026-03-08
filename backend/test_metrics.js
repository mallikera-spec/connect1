import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zcmeduttgckvjtdrjbme.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjbWVkdXR0Z2Nrdmp0ZHJqYm1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAyNDYzOSwiZXhwIjoyMDg3NjAwNjM5fQ.jmsKs9l_ZrvQorgWPu35sUOSbWDK7WwggiOtJZ3IuQw';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export const getSalesMetricsTest = async (filters = {}) => {
    let query = supabaseAdmin
        .from('leads')
        .select('id, name, status, deal_value, created_at')
        .limit(10000);

    if (filters.assigned_agent_id) query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) {
        const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59.999`;
        query = query.lte('created_at', end);
    }

    const { data, error } = await query;
    if (error) throw error;

    console.log(`Processing ${data.length} leads...`);

    const stats = data.reduce((acc, lead) => {
        const val = parseFloat(lead.deal_value || 0);
        const status = String(lead.status || '').toLowerCase();

        if (status === 'won') {
            console.log(`Found Won Lead: ID=${lead.id}, Name=${lead.name}, Value=${val}, Created=${lead.created_at}`);
            acc.wonValue += val;
            acc.Won += 1;
        } else if (['proposal', 'proposal sent', 'meeting', 'meeting scheduled', 'negotiation', 'qualified'].includes(status)) {
            acc.pipelineValue += val;
            if (status.includes('proposal')) acc.Proposal += 1;
        }

        if (['proposal', 'proposal sent', 'meeting', 'meeting scheduled', 'negotiation', 'won'].includes(status)) {
            acc.quotationCount += 1;
        }

        const capitalizedStatus = status.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
        if (!acc.statusBreakdown) acc.statusBreakdown = {};
        acc.statusBreakdown[capitalizedStatus] = (acc.statusBreakdown[capitalizedStatus] || 0) + 1;

        acc.total += 1;
        acc.totalValue += val;
        return acc;
    }, {
        total: 0, wonValue: 0, pipelineValue: 0, totalValue: 0,
        quotationCount: 0, Won: 0, Proposal: 0, statusBreakdown: {}
    });

    Object.assign(stats, stats.statusBreakdown);
    delete stats.statusBreakdown;
    stats.wonCount = stats.Won;
    stats.conversionRate = stats.total > 0 ? ((stats.Won || 0) / stats.total) * 100 : 0;

    return stats;
};

const run = async () => {
    const filters = {
        startDate: '2026-03-01',
        endDate: '2026-03-06'
    };
    const res = await getSalesMetricsTest(filters);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
};

run();
