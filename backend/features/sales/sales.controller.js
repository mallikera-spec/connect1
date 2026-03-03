import * as salesService from './sales.service.js';

/**
 * Controller to handle lead creation.
 */
export const createLead = async (req, res, next) => {
    try {
        const lead = await salesService.createLead({
            ...req.body,
            owner_id: req.user.id
        });
        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to list all leads with filters.
 */
export const getLeads = async (req, res, next) => {
    try {
        const filters = { ...req.query };
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');

        const canManage = hasAdminRole || hasPermission;
        const isRestricted = !canManage;

        if (isRestricted) {
            filters.assigned_agent_id = req.user.id;
        }

        const result = await salesService.getAllLeads(filters);
        res.json({
            success: true,
            data: result.leads,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: Math.ceil(result.total / result.limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get a specific lead's profile.
 */
export const getLead = async (req, res, next) => {
    try {
        const lead = await salesService.getLeadById(req.params.id);
        res.json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to get a lead's complete journey.
 */
export const getLeadJourney = async (req, res, next) => {
    try {
        const journey = await salesService.getLeadJourney(req.params.id);
        res.json({ success: true, data: journey });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update lead info or status.
 */
export const updateLead = async (req, res, next) => {
    try {
        const lead = await salesService.updateLead(req.params.id, req.body);
        res.json({ success: true, data: lead });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to delete a lead.
 */
export const deleteLead = async (req, res, next) => {
    try {
        await salesService.deleteLead(req.params.id);
        res.json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to log/schedule a follow-up.
 */
export const createFollowUp = async (req, res, next) => {
    try {
        const followUp = await salesService.createFollowUp({
            ...req.body,
            lead_id: req.params.id,
            agent_id: req.user.id
        });
        res.status(201).json({ success: true, data: followUp });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to update follow-up status.
 */
export const updateFollowUp = async (req, res, next) => {
    try {
        const followUp = await salesService.updateFollowUp(req.params.fid, req.body);
        res.json({ success: true, data: followUp });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to fetch dashboard metrics.
 */
export const getMetrics = async (req, res, next) => {
    try {
        const filters = { ...req.query };
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');

        const canManage = hasAdminRole || hasPermission;
        const isRestricted = !canManage;

        if (isRestricted) {
            filters.assigned_agent_id = req.user.id;
        }

        const metrics = await salesService.getSalesMetrics(filters);
        res.json({ success: true, data: metrics });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to list all follow-ups with filters.
 */
export const getFollowUps = async (req, res, next) => {
    try {
        const filters = { ...req.query };
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');

        const canManage = hasAdminRole || hasPermission;
        const isRestricted = !canManage;

        if (isRestricted) {
            filters.agent_id = req.user.id;
        }

        const data = await salesService.getAllFollowUps(filters);
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle bulk lead assignment.
 */
export const bulkAssignLeads = async (req, res, next) => {
    try {
        const { leadIds, assigned_agent_id } = req.body;
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');
        const isAuthorized = hasAdminRole || hasPermission;

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        }

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
        }

        const data = await salesService.bulkAssignLeads(leadIds, assigned_agent_id);
        res.json({ success: true, data, message: `${data.length} leads assigned successfully` });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle bulk status updates.
 */
export const bulkUpdateStatus = async (req, res, next) => {
    try {
        const { leadIds, status } = req.body;
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');
        const isAuthorized = hasAdminRole || hasPermission;

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        }

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
        }

        const data = await salesService.bulkUpdateStatus(leadIds, status);
        res.json({ success: true, data, message: `${data.length} leads updated to ${status}` });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle bulk lead deletion.
 */
export const bulkDeleteLeads = async (req, res, next) => {
    try {
        const { leadIds } = req.body;
        const adminRoles = ['Super Admin', 'super_admin', 'Admin', 'Sales Manager'];
        const hasAdminRole = req.user.roles?.some(role => adminRoles.includes(role));
        const hasPermission = req.user.permissions?.includes('manage_leads') || req.user.permissions?.includes('admin');
        const isAuthorized = hasAdminRole || hasPermission;

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
        }

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid lead IDs provided' });
        }

        const data = await salesService.bulkDeleteLeads(leadIds);
        res.json({ success: true, data, message: `${data.length} leads deleted successfully` });
    } catch (error) {
        next(error);
    }
};

/**
 * Controller to handle bulk upload of leads via CSV parsed data.
 */
export const bulkUploadLeads = async (req, res, next) => {
    try {
        const { leadsData, assigned_agent_id } = req.body;

        if (!leadsData || !Array.isArray(leadsData) || leadsData.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or empty leads data provided' });
        }

        const insertedCount = await salesService.bulkUploadLeads(
            leadsData,
            req.user.id,
            assigned_agent_id
        );

        res.status(201).json({
            success: true,
            message: `Successfully uploaded ${insertedCount} leads.`
        });
    } catch (error) {
        next(error);
    }
};
