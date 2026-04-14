import { supabaseAdmin } from '../../config/supabase.js';

export const createInvoice = async (invoiceData, items) => {
    const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

    if (invoiceError) throw invoiceError;

    if (items && items.length > 0) {
        const itemsWithInvoiceId = items.map(item => ({
            ...item,
            invoice_id: invoice.id
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('invoice_items')
            .insert(itemsWithInvoiceId);

        if (itemsError) throw itemsError;
    }

    return getInvoiceById(invoice.id);
};

export const getAllInvoices = async (filters = {}) => {
    let query = supabaseAdmin
        .from('invoices')
        .select('*');

    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('issue_date', filters.startDate);
    if (filters.endDate) query = query.lte('issue_date', filters.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    // Manual join: batch-fetch unique clients and projects
    const clientIds = [...new Set(data.map(i => i.client_id).filter(Boolean))];
    const projectIds = [...new Set(data.map(i => i.project_id).filter(Boolean))];

    const [clientsRes, projectsRes] = await Promise.all([
        clientIds.length > 0
            ? supabaseAdmin.from('clients').select('id, company_name, contact_name').in('id', clientIds)
            : { data: [] },
        projectIds.length > 0
            ? supabaseAdmin.from('projects').select('id, name').in('id', projectIds)
            : { data: [] },
    ]);

    const clientMap = Object.fromEntries((clientsRes.data || []).map(c => [c.id, c]));
    const projectMap = Object.fromEntries((projectsRes.data || []).map(p => [p.id, p]));

    return data.map(inv => ({
        ...inv,
        client: clientMap[inv.client_id] || null,
        project: projectMap[inv.project_id] || null,
    }));
};

export const getInvoiceById = async (id) => {
    const { data: invoice, error } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;

    // Fetch related data in parallel via separate queries (no FK constraint required)
    const [itemsRes, clientRes, projectRes] = await Promise.all([
        supabaseAdmin.from('invoice_items').select('*').eq('invoice_id', id),
        invoice.client_id
            ? supabaseAdmin.from('clients').select('*').eq('id', invoice.client_id).single()
            : { data: null },
        invoice.project_id
            ? supabaseAdmin.from('projects').select('name').eq('id', invoice.project_id).single()
            : { data: null },
    ]);

    return {
        ...invoice,
        items: itemsRes.data || [],
        client: clientRes.data || null,
        project: projectRes.data || null,
    };
};


export const updateInvoice = async (id, updateData, items) => {
    // Strip out any joined/virtual fields that came back from the GET response
    // They are not real columns and will cause Supabase schema errors
    const { client, project, items: _items, invoice_items, created_at, ...cleanData } = updateData;

    const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

    if (invoiceError) throw invoiceError;

    if (items) {
        // Simple strategy: delete existing items and re-insert
        // A more robust strategy would be to diff them
        const { error: deleteError } = await supabaseAdmin
            .from('invoice_items')
            .delete()
            .eq('invoice_id', id);

        if (deleteError) throw deleteError;

        if (items.length > 0) {
            const itemsWithInvoiceId = items.map(item => ({
                ...item,
                invoice_id: id
            }));

            const { error: itemsError } = await supabaseAdmin
                .from('invoice_items')
                .insert(itemsWithInvoiceId);

            if (itemsError) throw itemsError;
        }
    }

    return getInvoiceById(id);
};

export const deleteInvoice = async (id) => {
    const { error } = await supabaseAdmin
        .from('invoices')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const updateInvoiceStatus = async (id, status) => {
    const { data, error } = await supabaseAdmin
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};
