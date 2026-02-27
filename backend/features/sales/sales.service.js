import { supabaseAdmin } from '../../config/supabase.js';
import { createClient } from '../clients/clients.service.js';

/**
 * Sanitizes lead data by removing joined objects and internal fields.
 * @param {Object} data - Raw lead data.
 */
const sanitizeLeadData = (data) => {
    const sanitized = { ...data };
    const fieldsToRemove = [
        'assigned_agent',
        'owner',
        'follow_ups',
        'created_at',
        'updated_at',
        'id',
        'leadIds',
        'leadid'
    ];
    fieldsToRemove.forEach(field => delete sanitized[field]);
    return sanitized;
};

/**
 * Creates a new lead in the database.
 * @param {Object} leadData - Lead details.
 * @returns {Promise<Object>} The created lead.
 */
export const createLead = async (leadData) => {
    const sanitized = sanitizeLeadData(leadData);
    const { data, error } = await supabaseAdmin
        .from('leads')
        .insert(sanitized)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Fetches all leads with optional filtering.
 * @param {Object} filters - Search and status filters.
 * @returns {Promise<Array>} List of leads.
 */
export const getAllLeads = async (filters = {}) => {
    let query = supabaseAdmin
        .from('leads')
        .select(`
            *,
            assigned_agent:profiles!assigned_agent_id(id, full_name, email),
            owner:profiles!owner_id(id, full_name, email),
            follow_ups(id, type, status, scheduled_at)
        `);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.assigned_agent_id) query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    if (filters.source) query = query.eq('source', filters.source);

    // Date Range
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) {
        // If it's a date string without time, append end-of-day time
        const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59.999`;
        query = query.lte('created_at', end);
    }

    // Value Range
    if (filters.minValue) query = query.gte('deal_value', filters.minValue);
    if (filters.maxValue) query = query.lte('deal_value', filters.maxValue);

    if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
    }

    // Dynamic Soring
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';

    // Note: If sorting by a name/company, we might need a join or specific logic if it's not a direct column
    // For now we assume the frontend sends direct column names (e.g., 'deal_value', 'name', 'created_at')
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

/**
 * Retrieves a single lead by ID with its follow-up history.
 * @param {string} id - Lead UUID.
 * @returns {Promise<Object>} Lead details with follow-ups.
 */
export const getLeadById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('leads')
        .select(`
            *,
            assigned_agent:profiles!assigned_agent_id(id, full_name, email),
            owner:profiles!owner_id(id, full_name, email),
            follow_ups(*)
        `)
        .eq('id', id)
        .single();
    if (error) throw error;
    return data;
};

/**
 * Retrieves the complete journey of a lead including follow-ups, client status, and execution projects.
 * @param {string} leadId - Lead UUID.
 * @returns {Promise<Object>} Aggregated journey data.
 */
export const getLeadJourney = async (leadId) => {
    // 1. Fetch Lead and Follow Ups
    const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select(`
            *,
            follow_ups(*),
            assigned_agent:profiles!assigned_agent_id(id, full_name),
            owner:profiles!owner_id(id, full_name)
        `)
        .eq('id', leadId)
        .single();

    if (leadError) throw leadError;

    let client = null;
    let projects = [];

    // 2. Fetch Client if Lead reached 'Won' or is already a client
    const { data: clientData, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

    if (clientData) {
        client = clientData;

        // 3. Fetch Projects for this client
        const { data: projectsData, error: projectsError } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('client_id', client.id);

        if (!projectsError && projectsData) {
            projects = projectsData;
        }
    }

    return {
        lead,
        client,
        projects
    };
};

/**
 * Updates an existing lead's details or status.
 * @param {string} id - Lead UUID.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object>} The updated lead.
 */
export const updateLead = async (id, updates) => {
    const sanitized = sanitizeLeadData(updates);

    const { data, error } = await supabaseAdmin
        .from('leads')
        .update(sanitized)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;

    // Auto-convert to client if status is marked as 'Won'
    if (updates.status === 'Won') {
        try {
            await createClient({
                company_name: data.company || data.name,
                contact_name: data.name,
                email: data.email || '',
                phone: data.phone || '',
                status: 'Active',
                lead_id: data.id
            }, data.owner_id);
        } catch (clientErr) {
            console.error('Auto-convert to client failed:', clientErr);
            // Optionally decide if you want to throw here, or just log
        }
    }

    return data;
};

/**
 * Deletes a lead and its associated follow-ups (via cascade).
 * @param {string} id - Lead UUID.
 * @returns {Promise<Object>} Deleted lead ID.
 */
export const deleteLead = async (id) => {
    const { error } = await supabaseAdmin.from('leads').delete().eq('id', id);
    if (error) throw error;
    return { id };
};

/**
 * Assigns multiple leads to a specific agent in bulk.
 * @param {Array<string>} leadIds - List of lead UUIDs.
 * @param {string} agentId - Agent UUID.
 */
export const bulkAssignLeads = async (leadIds, agentId) => {
    const { data, error } = await supabaseAdmin
        .from('leads')
        .update({ assigned_agent_id: agentId || null })
        .in('id', leadIds)
        .select();

    if (error) throw error;
    return data;
};

/**
 * Updates the status of multiple leads in bulk.
 * @param {Array<string>} leadIds - List of lead UUIDs.
 * @param {string} status - New status.
 */
export const bulkUpdateStatus = async (leadIds, status) => {
    const { data, error } = await supabaseAdmin
        .from('leads')
        .update({ status })
        .in('id', leadIds)
        .select();

    if (error) throw error;

    // Auto-convert to clients if status is 'Won'
    if (status === 'Won' && data && data.length > 0) {
        for (const lead of data) {
            try {
                await createClient({
                    company_name: lead.company || lead.name,
                    contact_name: lead.name,
                    email: lead.email || '',
                    phone: lead.phone || '',
                    status: 'Active',
                    lead_id: lead.id
                }, lead.owner_id);
            } catch (clientErr) {
                console.error(`Auto-convert failed for lead ${lead.id}:`, clientErr);
            }
        }
    }

    return data;
};

/**
 * Deletes multiple leads in bulk.
 * @param {Array<string>} leadIds - List of lead UUIDs.
 */
export const bulkDeleteLeads = async (leadIds) => {
    const { data, error } = await supabaseAdmin
        .from('leads')
        .delete()
        .in('id', leadIds)
        .select();

    if (error) throw error;
    return data;
};

/* ── Follow-Up Operations ────────────────────────────────── */

/**
 * Logs a new follow-up interaction or schedules a future task.
 * @param {Object} followUpData - Follow-up details.
 * @returns {Promise<Object>} The created follow-up.
 */
export const createFollowUp = async (followUpData) => {
    const { data, error } = await supabaseAdmin
        .from('follow_ups')
        .insert(followUpData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Fetches follow-ups for a specific lead.
 * @param {string} leadId - Lead UUID.
 * @returns {Promise<Array>} List of follow-ups.
 */
export const getLeadFollowUps = async (leadId) => {
    const { data, error } = await supabaseAdmin
        .from('follow_ups')
        .select(`
            *,
            agent:profiles(id, full_name, email)
        `)
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

/**
 * Updates a follow-up (e.g., marks it as completed).
 * @param {string} id - Follow-up UUID.
 * @param {Object} updates - Fields to update.
 * @returns {Promise<Object>} The updated follow-up.
 */
export const updateFollowUp = async (id, updates) => {
    const { data, error } = await supabaseAdmin
        .from('follow_ups')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

/**
 * Aggregates lead data for the sales dashboard.
 * @param {Object} filters - Optional filters (e.g., agentId).
 * @returns {Promise<Object>} Lead status metrics.
 */
export const getSalesMetrics = async (filters = {}) => {
    let query = supabaseAdmin
        .from('leads')
        .select('status, deal_value, created_at');

    if (filters.assigned_agent_id) query = query.eq('assigned_agent_id', filters.assigned_agent_id);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) {
        const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59.999`;
        query = query.lte('created_at', end);
    }

    const { data, error } = await query;

    if (error) throw error;

    const stats = data.reduce((acc, lead) => {
        const val = parseFloat(lead.deal_value || 0);
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        acc.total = (acc.total || 0) + 1;

        if (lead.status === 'Won') {
            acc.wonValue = (acc.wonValue || 0) + val;
        } else if (lead.status === 'Proposal') {
            acc.pipelineValue = (acc.pipelineValue || 0) + val;
        }

        acc.totalValue = (acc.totalValue || 0) + val;
        return acc;
    }, {
        total: 0,
        wonValue: 0,
        pipelineValue: 0,
        totalValue: 0
    });

    // Also get quotation count (from leads that reached Proposal or Won)
    stats.quotationCount = data.filter(l => ['Proposal', 'Won'].includes(l.status)).length;

    // Fetch pending follow-ups
    let followUpQuery = supabaseAdmin
        .from('follow_ups')
        .select(`
            id, type, notes, scheduled_at, status, 
            lead:leads(id, name, company, status)
        `)
        .eq('status', 'Pending')
        .order('scheduled_at', { ascending: true }); // Earliest first

    if (filters.assigned_agent_id) {
        followUpQuery = followUpQuery.eq('agent_id', filters.assigned_agent_id);
    }

    const { data: followUpsData, error: followUpsError } = await followUpQuery;

    if (followUpsError) {
        console.error('Failed to fetch pending follow ups:', followUpsError);
        stats.pendingFollowUps = [];
    } else {
        stats.pendingFollowUps = followUpsData;
    }

    return stats;
};
