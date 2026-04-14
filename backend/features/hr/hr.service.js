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

    // 2. Fetch all approved leave requests for this user in current FY
    const { data: approvedLeaves } = await supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'Approved')
        .gte('start_date', fyStartDate.toISOString());

    // Map used leaves by type
    const usedMap = {};
    (approvedLeaves || []).forEach(req => {
        if (!req.leave_type_id) return;
        const sd = new Date(req.start_date);
        const ed = new Date(req.end_date);
        let days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
        
        // Handle half-day
        if (req.is_half_day) {
            days = 0.5;
        }
        
        usedMap[req.leave_type_id] = (usedMap[req.leave_type_id] || 0) + days;
    });

    const toInsert = [];
    const updates = [];

    (types || []).forEach(t => {
        let targetAccrued = 0;
        const existingRecord = existingMap.get(t.id);
        const currentUsed = usedMap[t.id] || 0;

        const monthlyRate = 1.5;
        targetAccrued = monthlyRate * monthsToAccrue;
        targetAccrued = parseFloat(targetAccrued.toFixed(2));

        if (!existingRecord) {
            toInsert.push({
                user_id: userId,
                leave_type_id: t.id,
                accrued: targetAccrued,
                used: currentUsed,
                balance: targetAccrued - currentUsed,
                last_accrual_date: now.toISOString().split('T')[0]
            });
        } else {
            const currentAccrued = parseFloat(existingRecord.accrued);
            if (currentAccrued !== targetAccrued || parseFloat(existingRecord.used) !== currentUsed) {
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
    const { start_date, end_date, type, leave_type_id, reason, is_half_day, half_day_session } = payload;

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
        let days = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
        if (is_half_day) days = 0.5;

        if (bal && bal.balance < days) {
            throw new Error(`Insufficient leave balance. Required: ${days}, Available: ${bal.balance}`);
        }
    }

    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .insert({ 
            user_id: userId, 
            start_date, 
            end_date, 
            type, 
            leave_type_id, 
            reason, 
            status: 'Pending',
            is_half_day: is_half_day || false,
            half_day_session: half_day_session || null
        })
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

    if (status === 'Approved') {
        await ensureUserBalances(data.user_id);
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

export const getAllLeaveBalances = async () => {
    // 1. Optional Trigger: Check if we need a global sync (once per month)
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0].substring(0, 7); // "YYYY-MM"
    
    const { data: latest } = await supabaseAdmin
        .from('user_leave_balances')
        .select('last_accrual_date')
        .order('last_accrual_date', { ascending: false })
        .limit(1)
        .single();

    if (latest && latest.last_accrual_date && !latest.last_accrual_date.startsWith(todayStr)) {
        console.log('🔄 Stale data detected in getAllLeaveBalances, syncing all users...');
        await syncAllBalances();
    }

    const { data: balances, error } = await supabaseAdmin
        .from('user_leave_balances')
        .select(`
            *,
            user:profiles(id, full_name, email),
            leave_type:leave_types(id, name, is_paid)
        `)
        .order('user_id');

    if (error) throw error;
    return balances || [];
};

export const getLeaveBalanceHistory = async (balanceId) => {
    // 1. Fetch balance summary
    const { data: balance, error: balError } = await supabaseAdmin
        .from('user_leave_balances')
        .select(`
            *,
            user:profiles(id, full_name, email),
            leave_type:leave_types(id, name, is_paid)
        `)
        .eq('id', balanceId)
        .single();
    if (balError) throw balError;

    // 2. Fetch leave requests history for this user and leave type
    const { data: history, error: histError } = await supabaseAdmin
        .from('leave_requests')
        .select('*')
        .eq('user_id', balance.user_id)
        .eq('leave_type_id', balance.leave_type_id)
        .order('start_date', { ascending: false });
    if (histError) throw histError;

    return {
        balance,
        history: history || []
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
            if (r.status === 'Absent') {
                // All Absents are treated as Unpaid Leave (full day deduction)
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
        .select('start_date, end_date, is_half_day')
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
            let diffDays = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
            
            if (l.is_half_day) {
                diffDays = 0.5;
            }
            
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

// --- Attendance & Leave Global Calendar ---
const PUBLIC_HOLIDAYS_2026 = {
    '2026-01-26': 'Republic Day',
    '2026-02-15': 'Mahashivratri',
    '2026-03-05': 'Holi',
    '2026-08-28': 'Raksha Bandhan',
    '2026-10-02': 'Mahatma Gandhi Jayanti',
    '2026-10-20': 'Dussehra',
    '2026-11-10': 'Diwali-Balipratipada'
};

export const getCalendarConfigs = async (month, year) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    const { data, error } = await supabaseAdmin
        .from('calendar_configs')
        .select('*')
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0]);

    if (error) throw error;
    return data;
};

export const updateCalendarConfig = async (config) => {
    const { date, type, label, created_by } = config;
    const { data, error } = await supabaseAdmin
        .from('calendar_configs')
        .upsert({ date, type, label, created_by }, { onConflict: 'date' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getGlobalAttendanceCalendar = async (month, year, userId = null) => {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0).toISOString();

    // 1. Fetch profiles
    let query = supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, roles:user_roles(role:roles(name))');
    
    if (userId) {
        query = query.eq('id', userId);
    }

    const { data: profiles, error: pError } = await query;
    if (pError) throw pError;

    // 2. Fetch all approved leave requests for the month
    const { data: leaves, error: lError } = await supabaseAdmin
        .from('leave_requests')
        .select('user_id, start_date, end_date, status, is_half_day, half_day_session, leave_type:leave_types(name)')
        .eq('status', 'Approved')
        .gte('end_date', startDate)
        .lte('start_date', endDate);
    if (lError) throw lError;

    // 3. Fetch all attendance records for the month with timestamps
    const { data: attendance, error: aError } = await supabaseAdmin
        .from('attendance')
        .select('user_id, date, status, is_approved, check_in_time, check_out_time')
        .gte('date', startDate)
        .lte('date', endDate);
    if (aError) throw aError;

    // 4. Fetch dynamic calendar configs
    const configs = await getCalendarConfigs(month, year);
    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.date]: c }), {});

    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar = profiles.map(profile => {
        const userDays = {};

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            
            // Priority 1: Dynamic Database Config
            const dbConfig = configMap[dateStr];
            if (dbConfig) {
                if (dbConfig.type === 'Working' || dbConfig.type === 'WFH') {
                    // Fall through to occupancy check, but tag as WFH if no attendance record
                    if (dbConfig.type === 'WFH') {
                        // We'll let subsequent checks run, but store WFH as fallback
                        // (handled after attendance check below)
                    }
                } else {
                    userDays[d] = {
                        type: 'Off',
                        status: dbConfig.type,
                        label: dbConfig.label
                    };
                    continue;
                }
            }

            // Priority 2: Check Attendance Record
            const att = attendance.find(a => a.user_id === profile.id && (typeof a.date === 'string' ? a.date.split('T')[0] : a.date) === dateStr);

            // Priority 3: Check Approved Leaves
            const leave = leaves.find(l => {
                const start = new Date(l.start_date).toISOString().split('T')[0];
                const end = new Date(l.end_date).toISOString().split('T')[0];
                return l.user_id === profile.id && dateStr >= start && dateStr <= end;
            });

            // If half-day leave exists, it wins over or merges with attendance
            if (leave && leave.is_half_day) {
                userDays[d] = {
                    type: att ? 'Attendance' : 'Leave',
                    status: att ? 'Half Day' : 'Approved Leave',
                    is_half_day: true,
                    leave_type: leave.leave_type?.name,
                    session: leave.half_day_session,
                    check_in_time: att?.check_in_time || null,
                    check_out_time: att?.check_out_time || null
                };
                continue;
            }

            if (att) {
                userDays[d] = {
                    type: 'Attendance',
                    status: att.status,
                    is_approved: att.is_approved,
                    check_in_time: att.check_in_time,
                    check_out_time: att.check_out_time
                };
                continue;
            }

            if (leave) {
                userDays[d] = {
                    type: 'Leave',
                    status: 'Approved Leave',
                    leave_type: leave.leave_type?.name,
                    is_half_day: leave.is_half_day,
                    session: leave.half_day_session
                };
                continue;
            }

            // Priority 4: Check for Default Holidays and Week Offs
            const currentDayDate = new Date(year, month - 1, d);
            const holidayName = PUBLIC_HOLIDAYS_2026[dateStr];
            
            if (holidayName) {
                userDays[d] = {
                    type: 'Off',
                    status: 'Holiday',
                    label: holidayName
                };
                continue;
            }

            const dayOfWeek = currentDayDate.getDay(); // 0 = Sunday, 6 = Saturday
            if (dayOfWeek === 0) {
                userDays[d] = {
                    type: 'Off',
                    status: 'Week Off',
                    label: 'Sunday'
                };
                continue;
            }

            if (dayOfWeek === 6) {
                // 2nd Saturday: 8-14, 4th Saturday: 22-28
                const isSecondSat = d >= 8 && d <= 14;
                const isFourthSat = d >= 22 && d <= 28;
                if (isSecondSat || isFourthSat) {
                    userDays[d] = {
                        type: 'Off',
                        status: 'Week Off',
                        label: isSecondSat ? '2nd Saturday' : '4th Saturday'
                    };
                    continue;
                }
            }

            // Priority 5: WFH fallback (if declared as WFH day but no attendance record)
            if (dbConfig?.type === 'WFH') {
                userDays[d] = {
                    type: 'WFH',
                    status: 'WFH',
                    label: dbConfig.label || 'Work From Home'
                };
                continue;
            }

            // Priority 6: Default to Absent (only for past days)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (currentDayDate < today) {
                userDays[d] = {
                    type: 'Absent',
                    status: 'Absent'
                };
            } else {
                userDays[d] = null; // Future or current day with no record yet
            }
        }

        return {
            user: {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
                role: profile.roles?.[0]?.role?.name || '---'
            },
            days: userDays
        };
    });

    return calendar;
};

// --- Leave Report ---
export const getLeaveReport = async ({ userId, startDate, endDate, status }) => {
    let query = supabaseAdmin
        .from('leave_requests')
        .select('*, leave_type:leave_types(id, name)');

    if (userId) query = query.eq('user_id', userId);
    if (startDate) query = query.gte('start_date', startDate);
    if (endDate) query = query.lte('end_date', endDate);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('start_date', { ascending: false });
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
