import express from 'express';
import * as financeController from './finance.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

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
router.put('/income/:id', financeController.updateIncome);
router.delete('/income/:id', financeController.deleteIncome);

router.post('/expenses', financeController.createExpense);
router.put('/expenses/:id', financeController.updateExpense);
router.delete('/expenses/:id', financeController.deleteExpense);

router.post('/assets', financeController.createAsset);

// Categories
router.get('/categories', financeController.listCategories);
router.post('/categories', financeController.createCategory);
router.put('/categories/:id', financeController.updateCategory);
router.delete('/categories/:id', financeController.deleteCategory);

export default router;
