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

    // Determine status purely on time? Or wait for admin? 
    // Usually BDM works 9 hours. Let's set status = 'Pending' always, let Admin bulk approve.
    // We could calculate a recommended string if we wanted.

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

// --- Leave Requests ---

export const submitLeaveRequest = async (userId, payload) => {
    const { start_date, end_date, type, reason } = payload;
    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .insert({ user_id: userId, start_date, end_date, type, reason, status: 'Pending' })
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
        .select('*')
        .eq('status', 'Pending')
        .order('start_date', { ascending: true });
    if (error) throw error;

    if (!data || data.length === 0) return [];

    // Enrich with profile data (FK is to auth.users, not profiles)
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, user: profileMap[r.user_id] || null }));
};

export const updateLeaveStatus = async (id, status, adminId, adminComment) => {
    const { data, error } = await supabaseAdmin
        .from('leave_requests')
        .update({ status, approved_by: adminId, admin_comment: adminComment || null })
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;

    // Notify the employee about their leave status
    try {
        const emoji = status === 'Approved' ? '✅' : '❌';
        await createNotification({
            userId: data.user_id,
            type: 'leave_status',
            title: `Leave ${status}`,
            message: `${emoji} Your leave request (${data.start_date} → ${data.end_date}) has been ${status.toLowerCase()}.${adminComment ? ` Note: ${adminComment}` : ''
                }`,
            data: { leave_id: id, status }
        });
    } catch (_) { /* non-blocking */ }

    return data;
};

export const calculateAvailableLeaves = async (userId) => {
    // Fetch user profile with fallback to created_at
    const { data: profile, error: pErr } = await supabaseAdmin
        .from('profiles')
        .select('joining_date, created_at')
        .eq('id', userId)
        .single();

    if (pErr || !profile) return { totalAccrued: 0, used: 0, balance: 0 };

    // Use joining_date; fallback to created_at if not set or if set to today
    let joiningDate = profile.joining_date ? new Date(profile.joining_date) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!joiningDate || joiningDate.getTime() >= today.getTime()) {
        // Fall back to account creation date
        joiningDate = profile.created_at ? new Date(profile.created_at) : null;
    }

    // If still no valid date, grant a default 1-month accrual as grace
    const now = new Date();
    let monthsTenure = 0;
    if (joiningDate) {
        monthsTenure = (now.getFullYear() - joiningDate.getFullYear()) * 12 + (now.getMonth() - joiningDate.getMonth());
        if (now.getDate() < joiningDate.getDate()) monthsTenure--;
        if (monthsTenure < 0) monthsTenure = 0;
    }

    let totalAccrued = 0;
    if (monthsTenure <= 6) {
        totalAccrued = monthsTenure * 1.0;
    } else {
        totalAccrued = (6 * 1.0) + ((monthsTenure - 6) * 1.5);
    }

    // Ensure at least 1 leave for active employees
    if (totalAccrued < 1) totalAccrued = 1;

    // Fetch approved paid leaves
    const { data: leaves } = await supabaseAdmin
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'Approved')
        .eq('type', 'Paid Leave');

    let usedLeaves = 0;
    if (leaves) {
        leaves.forEach(l => {
            const sd = new Date(l.start_date);
            const ed = new Date(l.end_date);
            const diffTime = Math.abs(ed - sd);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            usedLeaves += diffDays;
        });
    }

    return {
        totalAccrued,
        used: usedLeaves,
        balance: Math.max(0, totalAccrued - usedLeaves),
        monthsTenure,
    };
};


// --- Salary Slips ---

// Logic for generating payroll 
export const generateSalarySlip = async (userId, month, year, adminId) => {
    // 1. Fetch profile for base salary
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('base_salary')
        .eq('id', userId)
        .single();

    const baseSalary = parseFloat(profile?.base_salary || 0);

    // 2. Fetch Unapproved/Absent tracking for deductions
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: dailyRecords } = await supabaseAdmin
        .from('attendance')
        .select('status, is_approved')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['Absent', 'Half Day']);

    let deductions = 0;
    let absentDays = 0;
    let halfDays = 0;

    if (dailyRecords) {
        dailyRecords.forEach(r => {
            // Unapproved absences or half days decrease pay. 
            // In a real system, you'd calculate exact daily wage. Let's assume daily wage = base_salary / 30
            const dailyWage = baseSalary / 30;
            if (r.status === 'Absent' && r.is_approved === false) {
                deductions += dailyWage;
                absentDays++;
            } else if (r.status === 'Half Day') {
                deductions += (dailyWage / 2);
                halfDays++;
            }
        });
    }

    // Also include Unpaid leaves approved
    const { data: leaves } = await supabaseAdmin
        .from('leave_requests')
        .select('start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'Approved')
        .eq('type', 'Unpaid Leave')
        .gte('start_date', startDate)
        .lte('start_date', endDate); // Simplification: assumes leave starts in this month

    let unpaidLeaveDays = 0;
    if (leaves) {
        leaves.forEach(l => {
            const sd = new Date(l.start_date);
            const ed = new Date(l.end_date);
            const diffDays = Math.ceil(Math.abs(ed - sd) / (1000 * 60 * 60 * 24)) + 1;
            unpaidLeaveDays += diffDays;
            deductions += (diffDays * (baseSalary / 30));
        });
    }

    const netSalary = Math.max(0, baseSalary - deductions);

    // Check if slip already exists
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
        details: { absentDays, halfDays, unpaidLeaveDays }
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

// Admin view 
export const getAllSalarySlips = async (month, year) => {
    let query = supabaseAdmin
        .from('salary_slips')
        .select('*');

    if (month) query = query.eq('month', month);
    if (year) query = query.eq('year', year);

    const { data: slips, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
    if (error) throw error;

    if (!slips || slips.length === 0) return [];

    // Enrich with profile data manually since relationship might not be detected
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

    // Enrich with profile data
    const uIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    return data.map(r => ({ ...r, user: profileMap[r.user_id] || null }));
};
