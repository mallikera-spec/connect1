import api from '../../lib/api';

export const financeService = {
    getOverview: async (startDate, endDate) => {
        const response = await api.get('/finance/overview', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getEntities: async () => {
        const response = await api.get('/finance/entities');
        return response.data;
    },

    getPartners: async () => {
        const response = await api.get('/finance/partners');
        return response.data;
    },

    createIncome: async (data) => {
        const response = await api.post('/finance/income', data);
        return response.data;
    },

    updateIncome: async (id, data) => {
        const response = await api.put(`/finance/income/${id}`, data);
        return response.data;
    },

    deleteIncome: async (id) => {
        const response = await api.delete(`/finance/income/${id}`);
        return response.data;
    },

    createExpense: async (data) => {
        const response = await api.post('/finance/expenses', data);
        return response.data;
    },

    updateExpense: async (id, data) => {
        const response = await api.put(`/finance/expenses/${id}`, data);
        return response.data;
    },

    deleteExpense: async (id) => {
        const response = await api.delete(`/finance/expenses/${id}`);
        return response.data;
    },

    getIncomes: async (startDate, endDate) => {
        const response = await api.get('/finance/income', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getExpenses: async (startDate, endDate) => {
        const response = await api.get('/finance/expenses', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getAssets: async (startDate, endDate) => {
        const response = await api.get('/finance/assets', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    createAsset: async (data) => {
        const response = await api.post('/finance/assets', data);
        return response.data;
    },

    calculateSettlement: async (startDate, endDate) => {
        const response = await api.get('/finance/settlements/calculate', {
            params: { startDate, endDate }
        });
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/finance/categories');
        return response.data;
    },

    createCategory: async (data) => {
        const response = await api.post('/finance/categories', data);
        return response.data;
    },

    updateCategory: async (id, data) => {
        const response = await api.put(`/finance/categories/${id}`, data);
        return response.data;
    },

    deleteCategory: async (id) => {
        const response = await api.delete(`/finance/categories/${id}`);
        return response.data;
    }
};
