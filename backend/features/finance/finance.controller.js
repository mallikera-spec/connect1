import * as financeService from './finance.service.js';

export const getOverview = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const overview = await financeService.getFinanceOverview(startDate, endDate);
        res.json({ success: true, data: overview });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createIncome = async (req, res) => {
    try {
        const incomeData = {
            ...req.body,
            created_by: req.user.id
        };
        const income = await financeService.addIncome(incomeData);
        res.status(201).json({ success: true, data: income });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateIncome = async (req, res) => {
    try {
        const income = await financeService.updateIncome(req.params.id, req.body);
        res.json({ success: true, data: income });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteIncome = async (req, res) => {
    try {
        await financeService.deleteIncome(req.params.id);
        res.json({ success: true, message: 'Income deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createExpense = async (req, res) => {
    try {
        const expenseData = {
            ...req.body,
            created_by: req.user.id
        };
        const expense = await financeService.addExpense(expenseData);
        res.status(201).json({ success: true, data: expense });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateExpense = async (req, res) => {
    try {
        const expense = await financeService.updateExpense(req.params.id, req.body);
        res.json({ success: true, data: expense });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteExpense = async (req, res) => {
    try {
        await financeService.deleteExpense(req.params.id);
        res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getIncomes = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const incomes = await financeService.getIncomes(startDate, endDate);
        res.json({ success: true, data: incomes });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getExpenses = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const expenses = await financeService.getExpenses(startDate, endDate);
        res.json({ success: true, data: expenses });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAssets = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const assets = await financeService.getAssets(startDate, endDate);
        res.json({ success: true, data: assets });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createAsset = async (req, res) => {
    try {
        const asset = await financeService.addAsset(req.body);
        res.status(201).json({ success: true, data: asset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const asset = await financeService.updateAsset(req.params.id, req.body);
        res.json({ success: true, data: asset });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        await financeService.deleteAsset(req.params.id);
        res.json({ success: true, message: 'Asset deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const listEntities = async (req, res) => {
    try {
        const entities = await financeService.getEntities();
        res.json({ success: true, data: entities });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const listPartners = async (req, res) => {
    try {
        const partners = await financeService.getPartners();
        res.json({ success: true, data: partners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getSettlementConfig = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'startDate and endDate are required' });
        }
        const settlement = await financeService.calculateSettlement(startDate, endDate);
        res.json({ success: true, data: settlement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Category Controllers
export const listCategories = async (req, res) => {
    try {
        const categories = await financeService.getCategories();
        res.json({ success: true, data: categories });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const createCategory = async (req, res) => {
    try {
        const category = await financeService.createCategory(req.body);
        res.status(201).json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateCategory = async (req, res) => {
    try {
        const category = await financeService.updateCategory(req.params.id, req.body);
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        await financeService.deleteCategory(req.params.id);
        res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getProjectBalances = async (req, res) => {
    try {
        const balances = await financeService.getProjectBalancePayments();
        res.json({ success: true, data: balances });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
