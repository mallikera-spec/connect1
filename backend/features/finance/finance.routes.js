import express from 'express';
import * as financeController from './finance.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { financeAuthMiddleware } from '../../middleware/financeAuth.middleware.js';

const router = express.Router();

router.use(authMiddleware); // Protect all finance routes

router.get('/overview', financeController.getOverview);
router.get('/entities', financeController.listEntities);
router.get('/partners', financeController.listPartners);
router.get('/settlements/calculate', financeController.getSettlementConfig);

router.get('/income', financeController.getIncomes);
router.get('/expenses', financeController.getExpenses);
router.get('/assets', financeController.getAssets);

router.post('/income', financeController.createIncome);
router.put('/income/:id', financeAuthMiddleware, financeController.updateIncome);
router.delete('/income/:id', financeAuthMiddleware, financeController.deleteIncome);

router.post('/expenses', financeController.createExpense);
router.put('/expenses/:id', financeAuthMiddleware, financeController.updateExpense);
router.delete('/expenses/:id', financeAuthMiddleware, financeController.deleteExpense);

router.post('/assets', financeController.createAsset);
router.put('/assets/:id', financeAuthMiddleware, financeController.updateAsset);
router.delete('/assets/:id', financeAuthMiddleware, financeController.deleteAsset);

router.get('/balance-payments', financeController.getProjectBalances);

// Categories
router.get('/categories', financeController.listCategories);
router.post('/categories', financeController.createCategory);
router.put('/categories/:id', financeAuthMiddleware, financeController.updateCategory);
router.delete('/categories/:id', financeAuthMiddleware, financeController.deleteCategory);

export default router;
