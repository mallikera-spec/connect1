import { supabaseAdmin } from '../../config/supabase.js';
import { createNotification } from '../notifications/notifications.service.js';

// --- Attendance ---

export const clockIn = async (userId, date, checkInTime) => {
    // Check if record exists
    const { data: existing } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

    if (existing) {
        throw new Error('Already an attendance record for today. You may need to clock out.');
    }

    const { data, error } = await supabaseAdmin
        .from('attendance')
        .insert({ user_id: userId, date, check_in_time: checkInTime, status: 'Pending' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const clockOut = async (userId, date, checkOutTime) => {
    const { data: existing } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

    if (!existing) {
        throw new Error('No clock in record found for today.');
    }
    if (existing.check_out_time) {
        throw new Error('Already clocked out today.');
    }

    const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({ check_out_time: checkOutTime })
        .eq('id', existing.id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getMyAttendance = async (userId, month, year) => {
    let query = supabaseAdmin.from('attendance').select('*').eq('user_id', userId);

    if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString();
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
        query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;
    return data;
};

export const getAllPendingAttendance = async () => {
    const { data, error } = await supabaseAdmin
        .from('attendance')
        .select('*')
        .eq('status', 'Pending')
        .order('date', { ascending: false });
    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Enrich with profile data
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, user: profileMap[r.user_id] || null }));
};

export const approveAttendance = async (id, status, isApproved, adminId, adminComment) => {
    const { data, error } = await supabaseAdmin
        .from('attendance')
        .update({ status, is_approved: isApproved, approved_by: adminId, admin_comment: adminComment || null })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
};

// --- Leave Policies ---

export const getLeaveTypes = async () => {
    const { data, error } = await supabaseAdmin.from('leave_types').select('*').order('name');
    if (error) throw error;
    return data;
};

const ensureUserBalances = async (userId) => {
    // 1. Fetch user profile for joining_date
    const { data: profile } = await supabaseAdmin.from('profiles').select('joining_date, created_at').eq('id', userId).single();
    const { data: types } = await supabaseAdmin.from('leave_types').select('*');
    const { data: existing } = await supabaseAdmin.from('user_leave_balances').select('*').eq('user_id', userId);

    const existingMap = new Map((existing || []).map(b => [b.leave_type_id, b]));
    const now = new Date();

    // Financial Year starts April 1st (month index 3)
    const currentFYYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fyStartDate = new Date(currentFYYear, 3, 1);

    // Effective start date: max(FY_Start, Joining_Date)
    let joiningDate = profile?.joining_date ? new Date(profile.joining_date) : (profile?.created_at ? new Date(profile.created_at) : fyStartDate);
    const accrualStartDate = joiningDate > fyStartDate ? joiningDate : fyStartDate;

    // Calculate months to accrue (pro-rated)
    let monthsToAccrue = (now.getFullYear() - accrualStartDate.getFullYear()) * 12 + (now.getMonth() - accrualStartDate.getMonth()) + 1;
    if (monthsToAccrue < 1) monthsToAccrue = 1;
    if (monthsToAccrue > 12) monthsToAccrue = 12;

    const toInsert = [];
    const updates = [];

    (types || []).forEach(t => {
        let targetAccrued = 0;
        const existingRecord = existingMap.get(t.id);

        // Check if we need to reset 'used' leaves (FY change detection)
        let resetUsed = false;
        if (existingRecord?.last_accrual_date) {
            const lastAccrual = new Date(existingRecord.last_accrual_date);
            if (lastAccrual < fyStartDate) {
                resetUsed = true;
            }
        }

        if (t.name === 'Earned Leave') {
            // Probation rule: 1 leave/month for first 6 months, then normal rate (annual_limit/12)
            const normalRate = t.annual_limit / 12;

            // Iterate months in current FY and check their "service month index"
            for (let i = 0; i < monthsToAccrue; i++) {
                // Determine which month of service this is
                const monthDate = new Date(accrualStartDate);
                monthDate.setMonth(monthDate.getMonth() + i);

                // total months from joining to this specific month
                const serviceMonths = (monthDate.getFullYear() - joiningDate.getFullYear()) * 12 + (monthDate.getMonth() - joiningDate.getMonth()) + 1;

                if (serviceMonths <= 6) {
                    targetAccrued += 1.0;
                } else {
                    targetAccrued += normalRate;
                }
            }
        } else {
            const monthlyRate = t.annual_limit / 12;
            targetAccrued = monthlyRate * monthsToAccrue;
        }

        targetAccrued = parseFloat(targetAccrued.toFixed(2));

        if (!existingRecord) {
            toInsert.push({
                user_id: userId,
                leave_type_id: t.id,
                accrued: targetAccrued,
                used: 0,
                balance: targetAccrued,
                last_accrual_date: now.toISOString().split('T')[0]
            });
        } else {
            // Update existing if accrued is out of sync or FY reset triggered
            const currentUsed = resetUsed ? 0 : parseFloat(existingRecord.used || 0);
            const currentAccrued = parseFloat(existingRecord.accrued);

            if (currentAccrued !== targetAccrued || resetUsed) {
                updates.push(
                    supabaseAdmin.from('user_leave_balances')
                        .update({
                            accrued: targetAccrued,
                            used: currentUsed,
                            balance: targetAccrued - currentUsed,
                            last_accrual_date: now.toISOString().split('T')[0]
                        })
                        .eq('id', existingRecord.id)
                );
            }
        }
    });

    if (toInsert.length > 0) {
        await supabaseAdmin.from('user_leave_balances').insert(toInsert);
    }
    if (updates.length > 0) {
        await Promise.all(updates);
    }
};

export const syncAllBalances = async () => {
    const { data: profiles, error } = await supabaseAdmin.from('profiles').select('id');
    if (error) throw error;
    if (!profiles) return;

    const results = [];
    for (const profile of profiles) {
        try {
            await ensureUserBalances(profile.id);
            results.push({ userId: profile.id, status: 'success' });
        } catch (err) {
            results.push({ userId: profile.id, status: 'error', error: err.message });
        }
    }
    return results;
};

// --- Leave Requests ---

export const submitLeaveRequest = async (userId, payload) => {
    const { start_date, end_date, type, leave_type_id, reason } = payload;

    // 1. Ensure balances are initialized
    await ensureUserBalances(userId);

    // 2. Validate balance if leave_type_id is provided
    if (leave_type_id) {
        const { data: bal } = await supabaseAdmin
            .from('user_leave_balances')
            .select('balance')
            .eq('user_id', userId)
            .eq('leave_type_id', leave_type_id)
            .single();

        const sd = new Date(start_date);
        const ed = new Date(end_date);
        const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;

        if (bal && bal.balance < days) {
            throw new Error(`Insufficient leave balance. Required: ${days}, Available: ${bal.balance}`);
        }
    }

    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .insert({ user_id: userId, start_date, end_date, type, leave_type_id, reason, status: 'Pending' })
        .select()
        .single();
    if (error) throw error;

    // Notify all Admins and HR Managers about the new leave request
    try {
        const { data: admins } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .in('id', (
                await supabaseAdmin
                    .from('user_roles')
                    .select('user_id, role:roles!inner(name)')
                    .in('roles.name', ['Admin', 'Super Admin', 'HR Manager'])
                    .then(r => (r.data || []).map(ur => ur.user_id))
            ));

        const { data: submitter } = await supabaseAdmin
            .from('profiles').select('full_name').eq('id', userId).single();

        await Promise.all((admins || []).map(admin =>
            createNotification({
                userId: admin.id,
                type: 'leave_request',
                title: 'New Leave Request',
                message: `${submitter?.full_name || 'An employee'} has submitted a ${type} request from ${start_date} to ${end_date}.`,
                data: { leave_id: data.id, user_id: userId }
            }).catch(() => { })
        ));
    } catch (_) { /* non-blocking */ }

    return data;
};

export const getMyLeaves = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
    if (error) throw error;
    return data;
};

export const getAllPendingLeaves = async () => {
    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .select('*, leave_type:leave_types(id, name)')
        .eq('status', 'Pending')
        .order('start_date', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) return [];

    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, user: profileMap[r.user_id] || null }));
};

export const updateLeaveStatus = async (id, status, adminId, adminComment) => {
    const { data: oldReq } = await supabaseAdmin.from('leave_requests').select('*').eq('id', id).single();
    if (!oldReq) throw new Error('Leave request not found');

    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .update({ status, approved_by: adminId, admin_comment: adminComment || null })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;

    if (status === 'Approved' && data.leave_type_id) {
        const sd = new Date(data.start_date);
        const ed = new Date(data.end_date);
        const days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;

        const { data: bal } = await supabaseAdmin
            .from('user_leave_balances')
            .select('used, balance')
            .eq('user_id', data.user_id)
            .eq('leave_type_id', data.leave_type_id)
            .single();

        if (bal) {
            await supabaseAdmin
                .from('user_leave_balances')
                .update({
                    used: parseFloat(bal.used) + days,
                    balance: parseFloat(bal.balance) - days
                })
                .eq('user_id', data.user_id)
                .eq('leave_type_id', data.leave_type_id);
        }
    }

    try {
        const emoji = status === 'Approved' ? '✅' : '❌';
        await createNotification({
            userId: data.user_id,
            type: 'leave_status',
            title: `Leave ${status}`,
            message: `${emoji} Your leave request (${data.start_date} → ${data.end_date}) has been ${status.toLowerCase()}.${adminComment ? ` Note: ${adminComment}` : ''}`,
            data: { leave_id: id, status }
        });
    } catch (_) { /* non-blocking */ }

    return data;
};

export const calculateAvailableLeaves = async (userId) => {
    await ensureUserBalances(userId);

    const { data: balances, error } = await supabaseAdmin
        .from('user_leave_balances')
        .select(`
            accrued, used, balance,
            leave_type:leave_types(id, name, is_paid)
        `)
        .eq('user_id', userId);

    if (error) throw error;

    const totalAccrued = (balances || []).reduce((sum, b) => sum + parseFloat(b.accrued || 0), 0);
    const totalUsed = (balances || []).reduce((sum, b) => sum + parseFloat(b.used || 0), 0);
    const totalBalance = (balances || []).reduce((sum, b) => sum + parseFloat(b.balance || 0), 0);

    return {
        totalAccrued,
        used: totalUsed,
        balance: totalBalance,
        breakdown: balances || []
    };
};

// --- Salary Slips ---

export const generateSalarySlip = async (userId, month, year, adminId) => {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('base_salary')
        .eq('id', userId)
        .single();

    const baseSalary = parseFloat(profile?.base_salary || 0);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 2. Determine payable days and date range
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyWage = baseSalary / daysInMonth;

    let payableDays = daysInMonth;
    let effectiveEndDate;

    if (year > currentYear || (year === currentYear && month > currentMonth)) {
        // Future month
        payableDays = 0;
        effectiveEndDate = new Date(year, month - 1, 1);
    } else if (year === currentYear && month === currentMonth) {
        // Current month: pay up to yesterday
        payableDays = Math.max(0, now.getDate() - 1);
        effectiveEndDate = new Date(year, month - 1, payableDays, 23, 59, 59);
    } else {
        // Past month: pay full
        payableDays = daysInMonth;
        effectiveEndDate = new Date(year, month, 0, 23, 59, 59);
    }

    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDateString = effectiveEndDate.toISOString();

    const { data: dailyRecords } = await supabaseAdmin
        .from('attendance')
        .select('status, is_approved')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDateString)
        .in('status', ['Absent', 'Half Day']);

    let deductions = 0;
    let absentDays = 0;
    let halfDays = 0;

    if (dailyRecords) {
        dailyRecords.forEach(r => {
            if (r.status === 'Absent' && r.is_approved === false) {
                deductions += dailyWage;
                absentDays++;
            } else if (r.status === 'Half Day') {
                deductions += (dailyWage / 2);
                halfDays++;
            }
        });
    }

    const { data: leaves } = await supabaseAdmin
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'Approved')
        .eq('type', 'Unpaid Leave')
        .gte('start_date', startDate)
        .lte('start_date', endDateString);

    let unpaidLeaveDays = 0;
    if (leaves) {
        leaves.forEach(l => {
            const sd = new Date(l.start_date);
            const ed = new Date(l.end_date);
            const diffDays = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
            unpaidLeaveDays += diffDays;
            deductions += (diffDays * dailyWage);
        });
    }

    const grossSalary = dailyWage * payableDays;
    const netSalary = Math.max(0, grossSalary - deductions);

    const { data: existingSlip } = await supabaseAdmin
        .from('salary_slips')
        .select('id')
        .eq('user_id', userId)
        .eq('month', month)
        .eq('year', year)
        .single();

    const payload = {
        user_id: userId,
        month,
        year,
        base_salary: baseSalary,
        deductions,
        net_salary: netSalary,
        status: 'Generated',
        details: { absentDays, halfDays, unpaidLeaveDays, payableDays, gross_salary: grossSalary }
    };

    let result;
    if (existingSlip) {
        const { data, error } = await supabaseAdmin
            .from('salary_slips')
            .update(payload)
            .eq('id', existingSlip.id)
            .select()
            .single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await supabaseAdmin
            .from('salary_slips')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        result = data;
    }

    return result;
};

export const generateAllSalarySlips = async (month, year, adminId) => {
    const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('id');

    if (error) throw error;
    if (!profiles || profiles.length === 0) return [];

    const results = [];
    for (const profile of profiles) {
        try {
            const slip = await generateSalarySlip(profile.id, month, year, adminId);
            results.push({ user_id: profile.id, status: 'success', slip_id: slip.id });
        } catch (err) {
            results.push({ user_id: profile.id, status: 'error', error: err.message });
        }
    }
    return results;
};

export const getMySalarySlips = async (userId) => {
    const { data, error } = await supabaseAdmin
        .from('salary_slips')
        .select('*')
        .eq('user_id', userId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });
    if (error) throw error;
    return data;
};

export const getAllSalarySlips = async (month, year) => {
    let query = supabaseAdmin
        .from('salary_slips')
        .select('*');

    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);

    const { data: slips, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
    if (error) throw error;

    if (!slips || slips.length === 0) return [];

    const userIds = [...new Set(slips.map(s => s.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return slips.map(s => ({ ...s, user: profileMap[s.user_id] || null }));
};

// --- Attendance Report ---
export const getAttendanceReport = async ({ userId, startDate, endDate, status }) => {
    let query = supabaseAdmin
        .from('attendance')
        .select('*');

    if (userId) query = query.eq('user_id', userId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('date', { ascending: false });
    if (error) throw error;

    if (!data || data.length === 0) return [];

    const uIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, user: profileMap[r.user_id] || null }));
};
