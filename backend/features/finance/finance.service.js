import { supabaseAdmin } from '../../config/supabase.js';

export const getFinanceOverview = async (startDate, endDate) => {
    // 1. Fetch data with date boundaries
    let incomeQuery = supabaseAdmin.from('finance_income').select('amount, date, entity_id, finance_entities(name, type)');
    let expenseQuery = supabaseAdmin.from('finance_expenses').select('amount, date, entity_id, finance_entities(name, type)');
    let assetQuery = supabaseAdmin.from('finance_assets').select('cost, purchase_date, entity_id, finance_entities(name, type)');
    let projectsQuery = supabaseAdmin.from('projects').select('deal_value, acquisition_date').not('acquisition_date', 'is', null);

    if (startDate) {
        incomeQuery = incomeQuery.gte('date', startDate);
        expenseQuery = expenseQuery.gte('date', startDate);
        assetQuery = assetQuery.gte('purchase_date', startDate);
        projectsQuery = projectsQuery.gte('acquisition_date', startDate);
    }
    if (endDate) {
        incomeQuery = incomeQuery.lte('date', endDate);
        expenseQuery = expenseQuery.lte('date', endDate);
        assetQuery = assetQuery.lte('purchase_date', endDate);
        projectsQuery = projectsQuery.lte('acquisition_date', endDate);
    }

    const [{ data: income }, { data: expenses }, { data: assets }, { data: projects }, { data: entities }] = await Promise.all([
        incomeQuery,
        expenseQuery,
        assetQuery,
        projectsQuery,
        supabaseAdmin.from('finance_entities').select('*').eq('is_active', true)
    ]);

    // 2. Aggregate P&L
    const totalIncomeValue = income?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalExpensesValue = expenses?.reduce((sum, item) => sum + parseFloat(item.amount), 0) || 0;
    const totalAssetsValue = assets?.reduce((sum, item) => sum + parseFloat(item.cost), 0) || 0;
    const totalContractValue = projects?.reduce((sum, item) => sum + parseFloat(item.deal_value || 0), 0) || 0;

    // 3. Generate Monthly Breakdown
    const monthlyData = {};
    
    // Helper to get month key
    const getMonthKey = (dateStr) => {
        const d = new Date(dateStr);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    // Initialize all months in range
    if (startDate && endDate) {
        let curr = new Date(startDate);
        const end = new Date(endDate);
        while (curr <= end) {
            const key = getMonthKey(curr);
            monthlyData[key] = {
                date: new Date(curr.getFullYear(), curr.getMonth(), 1),
                month: curr.toLocaleString('default', { month: 'long' }),
                year: curr.getFullYear(),
                dealWins: 0,
                contractValue: 0,
                income: 0,
                expense: 0,
                profit: 0,
                momContractGrowth: 0,
                momProfitGrowth: 0
            };
            curr.setMonth(curr.getMonth() + 1);
        }
    }

    // Populate data
    projects?.forEach(l => {
        const key = getMonthKey(l.acquisition_date);
        if (monthlyData[key]) {
            monthlyData[key].dealWins += 1;
            monthlyData[key].contractValue += parseFloat(l.deal_value || 0);
        }
    });

    income?.forEach(i => {
        const key = getMonthKey(i.date);
        if (monthlyData[key]) monthlyData[key].income += parseFloat(i.amount || 0);
    });

    expenses?.forEach(e => {
        const key = getMonthKey(e.date);
        if (monthlyData[key]) monthlyData[key].expense += parseFloat(e.amount || 0);
    });

    // Calculate profit and growth
    const sortedKeys = Object.keys(monthlyData).sort();
    sortedKeys.forEach((key, index) => {
        const current = monthlyData[key];
        current.profit = current.income - current.expense;

        if (index > 0) {
            const prev = monthlyData[sortedKeys[index - 1]];
            
            // MOM Contract Growth
            if (prev.contractValue > 0) {
                current.momContractGrowth = ((current.contractValue - prev.contractValue) / prev.contractValue) * 100;
            } else if (current.contractValue > 0) {
                current.momContractGrowth = 100;
            } else if (current.contractValue === 0 && prev.contractValue === 0) {
                current.momContractGrowth = 0;
            } else {
                current.momContractGrowth = -100;
            }

            // MOM Profit Growth
            if (prev.profit !== 0) {
                current.momProfitGrowth = ((current.profit - prev.profit) / Math.abs(prev.profit)) * 100;
            } else if (current.profit !== 0) {
                current.momProfitGrowth = 100;
            }
        }
    });

    return {
        totalIncome: totalIncomeValue,
        totalExpenses: totalExpensesValue,
        netProfit: totalIncomeValue - totalExpensesValue,
        totalAssets: totalAssetsValue,
        totalContractValue,
        pendingAmount: totalContractValue - totalIncomeValue,
        monthlyBreakdown: Object.values(monthlyData).sort((a,b) => a.date - b.date)
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
        .select('*, entity:finance_entities(name), client:clients(company_name), project:projects(name)');
    
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

export const updateAsset = async (id, assetData) => {
    const { data, error } = await supabaseAdmin
        .from('finance_assets')
        .update(assetData)
        .eq('id', id)
        .select();
    if (error) throw error;
    return data[0];
};

export const deleteAsset = async (id) => {
    const { error } = await supabaseAdmin
        .from('finance_assets')
        .delete()
        .eq('id', id);
    if (error) throw error;
    return true;
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

export const getProjectBalancePayments = async () => {
    // 1. Fetch all projects with acquisition date
    const { data: projects, error: projectsError } = await supabaseAdmin
        .from('projects')
        .select('id, name, client_name, deal_value, acquisition_date')
        .not('acquisition_date', 'is', null);

    if (projectsError) throw projectsError;

    // 2. Fetch all income records
    const { data: income, error: incomeError } = await supabaseAdmin
        .from('finance_income')
        .select('amount, project_id');

    if (incomeError) throw incomeError;

    // 3. Aggregate income per project
    const incomeByProject = income.reduce((acc, curr) => {
        if (!curr.project_id) return acc;
        acc[curr.project_id] = (acc[curr.project_id] || 0) + parseFloat(curr.amount || 0);
        return acc;
    }, {});

    // 4. Combine data
    const result = projects.map(p => {
        const received = incomeByProject[p.id] || 0;
        const dealValue = parseFloat(p.deal_value || 0);
        return {
            id: p.id,
            acquisition_date: p.acquisition_date,
            project_name: p.name,
            client_name: p.client_name,
            amount_received: received,
            amount_pending: dealValue - received,
            deal_value: dealValue
        };
    });

    return result;
};
