import { supabaseAdmin } from '../../config/supabase.js';

const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate();
};

const getWorkingDays = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year);
    let workingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay();
        // Assuming Sat (6) and Sun (0) are weekends. 
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workingDays++;
        }
    }

    return workingDays;
};

export const calculatePayroll = async (month, year) => {
    // 1. Check if period exists
    let { data: period } = await supabaseAdmin
        .from('payroll_periods')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .single();

    if (!period) {
        const { data: newPeriod, error: pError } = await supabaseAdmin
            .from('payroll_periods')
            .insert({ month, year, status: 'draft' })
            .select()
            .single();

        if (pError) throw pError;
        period = newPeriod;
    } else if (period.status === 'published') {
        throw new Error('Payroll for this month is already published and cannot be recalculated.');
    }

    // 2. Fetch all active employees
    const { data: employees, error: eError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, ctc, joining_date')
        .eq('status', 'active');

    if (eError) throw eError;

    const totalDays = getDaysInMonth(month, year);
    const workingDays = getWorkingDays(month, year); // Just a standard estimate, adjustable per company

    // 3. For each employee, generate draft slip
    const slipsToUpsert = [];

    for (const emp of employees) {
        const annualCTC = parseFloat(emp.ctc || 0);
        const monthlyCTC = annualCTC / 12;

        // Let's assume standard breakdown: Basic = 50% of CTC, HRA = 30% of CTC, Special = 20%
        const basic_salary = monthlyCTC * 0.50;
        const hra = monthlyCTC * 0.30;
        const special_allowances = monthlyCTC * 0.20;
        const gross_salary = monthlyCTC; // Before deductions

        // Mocking attendance data for now. In a real system, you'd fetch from timesheets/attendance
        const present_days = workingDays;
        const paid_leaves = 0;
        const lwp_days = 0;

        const lwp_deduction = 0; // IF LWP > 0: (monthlyCTC / totalDays) * lwp_days

        // Standard Deductions mock
        const pf_deduction = basic_salary * 0.12; // 12% of basic
        const pt_deduction = 200; // standard 200 per month
        const tds_deduction = 0; // Simplified
        const total_deductions = lwp_deduction + pf_deduction + pt_deduction + tds_deduction;

        const net_payable = gross_salary - total_deductions;

        slipsToUpsert.push({
            payroll_period_id: period.id,
            user_id: emp.id,
            total_days: totalDays,
            working_days: workingDays,
            present_days,
            paid_leaves,
            lwp_days,
            basic_salary,
            hra,
            special_allowances,
            bonuses: 0,
            gross_salary,
            lwp_deduction,
            pf_deduction,
            pt_deduction,
            tds_deduction,
            total_deductions,
            net_payable
        });
    }

    // Need to clear old drafts for this period (except finalized/published ones but handled by period status check above)
    await supabaseAdmin
        .from('salary_slips')
        .delete()
        .eq('payroll_period_id', period.id);

    const { data: insertedSlips, error: iError } = await supabaseAdmin
        .from('salary_slips')
        .insert(slipsToUpsert)
        .select();

    if (iError) throw iError;

    return {
        period,
        count: insertedSlips.length
    };
};

export const publishPayroll = async (periodId) => {
    // 1. Check if period exists
    let { data: period, error: pError } = await supabaseAdmin
        .from('payroll_periods')
        .select('*')
        .eq('id', periodId)
        .single();

    if (pError || !period) throw new Error('Payroll period not found');
    if (period.status === 'published') throw new Error('Already published');

    // 2. Update status
    const { data, error } = await supabaseAdmin
        .from('payroll_periods')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', periodId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getPayrollPeriods = async () => {
    const { data, error } = await supabaseAdmin
        .from('payroll_periods')
        .select(`
            *,
            slips:salary_slips(count)
        `)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

    if (error) throw error;

    // Format slips count since Supabase returns [{count: N}]
    return data.map(p => ({
        ...p,
        slipCount: p.slips?.[0]?.count || 0
    }));
};

export const getSalarySlips = async (periodId) => {
    let query = supabaseAdmin
        .from('salary_slips')
        .select(`
            *,
            profile:profiles(id, full_name, email, designation, department)
        `)
        .order('created_at', { ascending: false });

    if (periodId) {
        query = query.eq('payroll_period_id', periodId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const getMySalarySlips = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('salary_slips')
        .select(`
            *,
            period:payroll_periods(month, year, status)
        `)
        .eq('user_id', userId)
        .eq('payroll_periods.status', 'published') // Only show published via RLS mostly, but explicit here
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter strictly to ensure only published periods (if RLS somehow bypassed or doing server side filter)
    return data.filter(d => d.period?.status === 'published');
};
