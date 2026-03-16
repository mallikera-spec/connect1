import { supabaseAdmin } from '../../config/supabase.js';

export const getFinanceOverview = async (startDate, endDate) => {
    // Basic aggregation queries
    let incomeQuery = supabaseAdmin.from('finance_income').select('amount, entity_id, finance_entities(name, type)');
    let expenseQuery = supabaseAdmin.from('finance_expenses').select('amount, entity_id, finance_entities(name, type)');
    let assetQuery = supabaseAdmin.from('finance_assets').select('cost, entity_id, finance_entities(name, type)');

    if (startDate) {
        incomeQuery = incomeQuery.gte('date', startDate);
        expenseQuery = expenseQuery.gte('date', startDate);
        assetQuery = assetQuery.gte('purchase_date', startDate);
    }
    if (endDate) {
        incomeQuery = incomeQuery.lte('date', endDate);
        expenseQuery = expenseQuery.lte('date', endDate);
        assetQuery = assetQuery.lte('purchase_date', endDate);
    }

    const [{ data: income }, { data: expenses }, { data: assets }, { data: entities }] = await Promise.all([
        incomeQuery,
        expenseQuery,
        assetQuery,
        supabaseAdmin.from('finance_entities').select('*').eq('is_active', true)
    ]);

    const totalIncome = income?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalAssets = assets?.reduce((sum, item) => sum + parseFloat(item.cost), 0) || 0;

    // Calculate balances per entity
    const entityBalances = entities?.map(entity => {
        const entityIncome = income?.filter(i => i.entity_id === entity.id)
            .reduce((sum, i) => sum + parseFloat(i.amount), 0) || 0;
        const entityExpenses = expenses?.filter(e => e.entity_id === entity.id)
            .reduce((sum, e) => sum + parseFloat(e.amount), 0) || 0;
        const entityAssets = assets?.filter(a => a.entity_id === entity.id)
            .reduce((sum, a) => sum + parseFloat(a.cost), 0) || 0;

        return {
            ...entity,
            balance: entityIncome - entityExpenses - entityAssets
        };
    }) || [];

    return {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        totalAssets,
        entityBalances
    };
};

export const addIncome = async (incomeData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_income')
        .insert([incomeData])
        .select();
    if (error) throw error;
    return data[0];
};

export const updateIncome = async (id, incomeData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_income')
        .update(incomeData)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteIncome = async (id) => {
    const { error } = await supabaseAdmin
        .from('finance_income')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

export const addExpense = async (expenseData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_expenses')
        .insert([expenseData])
        .select('*, entity:finance_entities(name), category_info:finance_categories(name, color, icon)');
    if (error) throw error;
    return data[0];
};

export const updateExpense = async (id, expenseData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_expenses')
        .update(expenseData)
        .eq('id', id)
        .select('*, entity:finance_entities(name), category_info:finance_categories(name, color, icon)');
    if (error) throw error;
    return data[0];
};

export const deleteExpense = async (id) => {
    const { error } = await supabaseAdmin
        .from('finance_expenses')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
};

export const getIncomes = async (startDate, endDate) => {
    let query = supabaseAdmin
        .from('finance_income')
        .select('*, entity:finance_entities(name), client:clients(company_name)');
    
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
};

export const getExpenses = async (startDate, endDate) => {
    let query = supabaseAdmin
        .from('finance_expenses')
        .select('*, entity:finance_entities(name), category_info:finance_categories(name, color, icon)');

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
};

export const getAssets = async (startDate, endDate) => {
    let query = supabaseAdmin
        .from('finance_assets')
        .select('*, entity:finance_entities(name)');

    if (startDate) query = query.gte('purchase_date', startDate);
    if (endDate) query = query.lte('purchase_date', endDate);

    const { data, error } = await query.order('purchase_date', { ascending: false });
    if (error) throw error;
    return data;
};

export const addAsset = async (assetData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_assets')
        .insert([assetData])
        .select();
    if (error) throw error;
    return data[0];
};

export const getEntities = async () => {
    const { data, error } = await supabaseAdmin
        .from('finance_entities')
        .select('*')
        .eq('is_active', true);
    if (error) throw error;
    return data;
};

export const getPartners = async () => {
    const { data, error } = await supabaseAdmin
        .from('finance_partners')
        .select('*')
        .eq('is_active', true);
    if (error) throw error;
    return data;
};

// Category Management
export const getCategories = async () => {
    const { data, error } = await supabaseAdmin
        .from('finance_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
    if (error) throw error;
    return data;
};

export const createCategory = async (categoryData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_categories')
        .insert([categoryData])
        .select();
    if (error) throw error;
    return data[0];
};

export const updateCategory = async (id, categoryData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_categories')
        .update(categoryData)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteCategory = async (id) => {
    const { error } = await supabaseAdmin
        .from('finance_categories')
        .update({ is_active: false })
        .eq('id', id);
    if (error) throw error;
    return true;
};

export const calculateSettlement = async (startDate, endDate) => {
    // 1. Get Income
    const { data: income } = await supabaseAdmin
        .from('finance_income')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate);

    // 2. Get Expenses
    const { data: expenses } = await supabaseAdmin
        .from('finance_expenses')
        .select('amount')
        .gte('date', startDate)
        .lte('date', endDate);

    // 3. Get Payroll Costs (Staff Salaries)
    // Assuming payroll_periods match dates
    const { data: salaries } = await supabaseAdmin
        .from('salary_slips')
        .select('gross_salary');
    // Note: In real logic, we'd filter salaries by the payroll_period matching the dates

    const totalIncome = income?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalSalaries = salaries?.reduce((sum, item) => sum + parseFloat(item.gross_salary), 0) || 0;

    const netProfit = totalIncome - totalExpenses - totalSalaries;

    // 4. Get active partners for this period
    const { data: partners } = await supabaseAdmin
        .from('finance_partners')
        .select('*')
        .or(`exit_date.is.null,exit_date.gt.${startDate}`)
        .lte('joined_date', endDate);

    const partnerCount = partners?.length || 0;
    const sharePerPartner = partnerCount > 0 ? netProfit / partnerCount : 0;

    return {
        totalIncome,
        totalExpenses,
        totalSalaries,
        netProfit,
        partnerSettlements: partners?.map(p => ({
            partner_id: p.id,
            partner_name: p.name,
            share_amount: sharePerPartner
        })) || []
    };
};
