import { getAuthUser, fetchUserPermissions } from './auth.service.js';
import { getQuoteOfTheDay } from './quote.service.js';
import { successResponse } from '../../utils/apiResponse.js';

export const getMe = async (req, res) => {
    const data = await getAuthUser(req.user);
    successResponse(res, data, 'Authenticated user fetched');
};

export const refreshPermissions = async (req, res) => {
    const data = await fetchUserPermissions(req.user.id);
    successResponse(res, data, 'Permissions refreshed');
};

export const getDailyQuote = async (req, res) => {
    const data = await getQuoteOfTheDay();
    successResponse(res, data, 'Daily quote fetched');
};
