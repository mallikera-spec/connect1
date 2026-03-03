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
        `, { count: 'exact' });

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

    // Pagination (defaults to page 1, 50 items if not specified)
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // We do a second query with just the count to avoid heavy selects if needed, 
    // or just pass { count: 'exact' } to the main query.
    const { data, error, count } = await query.range(from, to);
    if (error) throw error;
    return { leads: data, total: count || 0, page, limit };
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
    const chunked = [];
    for (let i = 0; i < leadIds.length; i += 100) {
        chunked.push(leadIds.slice(i, i + 100));
    }

    const allData = [];
    for (const chunk of chunked) {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .update({ assigned_agent_id: agentId || null })
            .in('id', chunk)
            .select();

        if (error) throw error;
        allData.push(...(data || []));
    }

    return allData;
};

/**
 * Updates the status of multiple leads in bulk.
 * @param {Array<string>} leadIds - List of lead UUIDs.
 * @param {string} status - New status.
 */
export const bulkUpdateStatus = async (leadIds, status) => {
    const chunked = [];
    for (let i = 0; i < leadIds.length; i += 100) {
        chunked.push(leadIds.slice(i, i + 100));
    }

    const allData = [];
    for (const chunk of chunked) {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .update({ status })
            .in('id', chunk)
            .select();

        if (error) throw error;
        allData.push(...(data || []));
    }

    // Auto-convert to clients if status is 'Won'
    if (status === 'Won' && allData.length > 0) {
        for (const lead of allData) {
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

    return allData;
};

/**
 * Deletes multiple leads in bulk.
 * @param {Array<string>} leadIds - List of lead UUIDs.
 */
export const bulkDeleteLeads = async (leadIds) => {
    const chunked = [];
    for (let i = 0; i < leadIds.length; i += 100) {
        chunked.push(leadIds.slice(i, i + 100));
    }

    const allData = [];
    for (const chunk of chunked) {
        const { data, error } = await supabaseAdmin
            .from('leads')
            .delete()
            .in('id', chunk)
            .select();

        if (error) throw error;
        allData.push(...(data || []));
    }

    return allData;
};

/**
 * Bulk uploads an array of leads.
 * @param {Array} leadsData - Array of lead objects parsed from CSV.
 * @param {string} ownerId - ID of the user uploading the leads.
 * @param {string} [defaultAssignedAgentId] - Optional default agent ID.
 * @returns {Promise<number>} Number of leads inserted.
 */
export const bulkUploadLeads = async (leadsData, ownerId, defaultAssignedAgentId = null) => {
    // 1. Fetch profiles to map BDM names/emails to their UUIDs
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email');

    const agentMap = {};
    if (profiles) {
        profiles.forEach(p => {
            if (p.full_name) agentMap[p.full_name.toLowerCase().trim()] = p.id;
            if (p.email) agentMap[p.email.toLowerCase().trim()] = p.id;
        });
    }

    // 2. Sanitize and prepare data
    const preparedLeads = leadsData.map(lead => {
        let assigned_agent_id = defaultAssignedAgentId;
        let bdmKey = null;

        // If CSV provided a BDM name or email, try to resolve it
        if (lead.assigned_bdm && lead.assigned_bdm.trim()) {
            bdmKey = lead.assigned_bdm.toLowerCase().trim();
            if (agentMap[bdmKey]) {
                assigned_agent_id = agentMap[bdmKey];
            }
        }

        return {
            name: lead.name,
            company: lead.company || null,
            email: lead.email || null,
            phone: lead.phone || 'N/A', // fallback if empty but schema requires it
            source: lead.source || 'Other',
            status: lead.status || 'New',
            score: parseInt(lead.score) || 1,
            deal_value: parseFloat(lead.deal_value) || 0,
            owner_id: ownerId,
            assigned_agent_id: assigned_agent_id,
            // Temporary field to hold the note for the secondary insert
            _temp_note: lead.notes || null,
            _temp_note_date: lead.notes_date || null,
            _temp_original_agent: bdmKey || null
        };
    });

    // 3. Separate actual DB fields from temp fields
    const leadsToInsert = preparedLeads.map(({ _temp_note, _temp_note_date, _temp_original_agent, ...dbFields }) => dbFields);

    // 4. Insert leads and get IDs back
    const { data: insertedLeads, error } = await supabaseAdmin
        .from('leads')
        .insert(leadsToInsert)
        .select('*');

    if (error) {
        console.error('Bulk upload error:', error);
        throw new Error(`Failed to insert leads: ${error.message}`);
    }

    // 5. Create Follow-up records for leads that had notes
    const followUpsToInsert = [];

    // We assume the returned `insertedLeads` array matches the order of `preparedLeads`.
    // (Usually true for bulk inserts, but we map by index just in case)
    insertedLeads.forEach((leadRow, index) => {
        const correspondingTemp = preparedLeads[index];
        if (correspondingTemp && correspondingTemp._temp_note && correspondingTemp._temp_note.trim() !== '') {

            // Validate and parse the date, fallback to current time if invalid
            let historicalDate = new Date().toISOString();
            if (correspondingTemp._temp_note_date) {
                const parsedDate = new Date(correspondingTemp._temp_note_date);
                if (!isNaN(parsedDate.valueOf())) historicalDate = parsedDate.toISOString();
            }

            followUpsToInsert.push({
                lead_id: leadRow.id,
                agent_id: correspondingTemp.assigned_agent_id || ownerId, // Attribute note to assigned BDM or uploader
                type: 'Note',
                status: 'Completed',
                notes: `Historical Note (via CSV Import): ${correspondingTemp._temp_note}`,
                created_at: historicalDate,
                scheduled_at: historicalDate // Sync scheduled_at so it shows correctly in timeline orders
            });
        }
    });

    if (followUpsToInsert.length > 0) {
        const { error: followUpError } = await supabaseAdmin
            .from('follow_ups')
            .insert(followUpsToInsert);

        if (followUpError) {
            console.error('Failed to insert historical notes as follow_ups:', followUpError);
            // We do not throw here to prevent failing the entire lead upload if only notes failed
        }
    }

    return insertedLeads.length;
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
 * Fetches all follow-ups with optional filtering (Admin sees all, BDM sees assigned).
 * @param {Object} filters - Filter by agent, status, date range.
 * @returns {Promise<Array>} List of follow-ups.
 */
export const getAllFollowUps = async (filters = {}) => {
    let query = supabaseAdmin
        .from('follow_ups')
        .select(`
            *,
            lead:leads(id, name, company, status, phone, email),
            agent:profiles(id, full_name, email)
        `);

    if (filters.agent_id) query = query.eq('agent_id', filters.agent_id);
    if (filters.status) query = query.eq('status', filters.status);

    // Scheduled Date Range
    if (filters.startDate) query = query.gte('scheduled_at', filters.startDate);
    if (filters.endDate) {
        const end = filters.endDate.includes('T') ? filters.endDate : `${filters.endDate} 23:59:59.999`;
        query = query.lte('scheduled_at', end);
    }

    query = query.order('scheduled_at', { ascending: true });

    const { data, error } = await query;
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
        const status = String(lead.status || '').toLowerCase();

        // Use normalized names for specific counters
        if (status === 'won') {
            acc.wonCount = (acc.wonCount || 0) + 1;
            acc.wonValue = (acc.wonValue || 0) + val;
        } else if (status === 'proposal') {
            acc.pipelineValue = (acc.pipelineValue || 0) + val;
        }

        // Maintain original status mapping for dynamic frontend list if needed, 
        // but normalize for consistent access
        acc[status] = (acc[status] || 0) + 1;
        // Keep "Won" for backward compatibility if conversionRate logic uses it specifically
        if (status === 'won') acc.Won = (acc.Won || 0) + 1;

        acc.total = (acc.total || 0) + 1;
        acc.totalValue = (acc.totalValue || 0) + val;
        return acc;
    }, {
        total: 0,
        wonValue: 0,
        pipelineValue: 0,
        totalValue: 0,
        wonCount: 0,
        Won: 0
    });

    // Calculate conversion rate: (Won / Total) * 100
    stats.conversionRate = stats.total > 0 ? ((stats.Won || 0) / stats.total) * 100 : 0;

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
