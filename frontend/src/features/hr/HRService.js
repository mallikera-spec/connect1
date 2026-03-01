import axios from 'axios';
import { supabase } from '../../lib/supabase';

// HR-specific API instance — routes are mounted at /api/hr (not /api/v1)
const hrApi = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

hrApi.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
});

hrApi.interceptors.response.use(
    (res) => res,
    (err) => {
        const message = err.response?.data?.message || err.message || 'An error occurred';
        return Promise.reject(new Error(message));
    }
);

export const HRService = {
    // --- Attendance ---
    clockIn: async (data) => {
        const response = await hrApi.post('/hr/attendance/clock-in', data);
        return response.data;
    },
    clockOut: async (data) => {
        const response = await hrApi.post('/hr/attendance/clock-out', data);
        return response.data;
    },
    getMyAttendance: async (month, year) => {
        const response = await hrApi.get('/hr/attendance/my', { params: { month, year } });
        return response.data;
    },
    getPendingAttendance: async () => {
        const response = await hrApi.get('/hr/attendance/pending');
        return response.data;
    },
    approveAttendance: async (id, status, isApproved, adminComment) => {
        const response = await hrApi.patch(`/hr/attendance/${id}/approve`, { status, is_approved: isApproved, admin_comment: adminComment });
        return response.data;
    },
    getAttendanceReport: async (params) => {
        const response = await hrApi.get('/hr/attendance/report', { params });
        return response.data;
    },

    // --- Leaves ---
    submitLeaveRequest: async (data) => {
        const response = await hrApi.post('/hr/leaves', data);
        return response.data;
    },
    getMyLeaves: async () => {
        const response = await hrApi.get('/hr/leaves/my');
        return response.data;
    },
    getPendingLeaves: async () => {
        const response = await hrApi.get('/hr/leaves/pending');
        return response.data;
    },
    updateLeaveStatus: async (id, status, adminComment) => {
        const response = await hrApi.patch(`/hr/leaves/${id}/status`, { status, admin_comment: adminComment });
        return response.data;
    },
    getLeaveBalance: async (userId) => {
        const response = await hrApi.get('/hr/leaves/balance', { params: { userId } });
        return response.data;
    },

    // --- Payroll ---
    generateSalarySlips: async (data) => {
        const response = await hrApi.post('/hr/payroll/generate', data);
        return response.data;
    },
    getMySalarySlips: async () => {
        const response = await hrApi.get('/hr/payroll/my');
        return response.data;
    },
    getAllSalarySlips: async (month, year) => {
        const response = await hrApi.get('/hr/payroll/all', { params: { month, year } });
        return response.data;
    },
};
