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
        .select('*, client:clients(company_name, contact_name), project:projects(name)');

    if (filters.clientId) query = query.eq('client_id', filters.clientId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.startDate) query = query.gte('issue_date', filters.startDate);
    if (filters.endDate) query = query.lte('issue_date', filters.endDate);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

export const getInvoiceById = async (id) => {
    const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('*, client:clients(*), project:projects(name), items:invoice_items(*)')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const updateInvoice = async (id, updateData, items) => {
    const { data: invoice, error: invoiceError } = await supabaseAdmin
        .from('invoices')
        .update(updateData)
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
