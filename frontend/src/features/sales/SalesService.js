import api from '../../lib/api';

/**
 * Service to handle all sales-related API interactions.
 */
export const SalesService = {
    /**
     * Fetches the list of leads with optional sorting and filtering.
     */
    getLeads: async (params = {}) => {
        const response = await api.get('/sales/leads', { params });
        return response.data;
    },

    /**
     * Retrieves single lead details by ID.
     */
    getLead: async (id) => {
        const response = await api.get(`/sales/leads/${id}`);
        return response.data;
    },

    /**
     * Retrieves the complete journey of a lead.
     */
    getLeadJourney: async (id) => {
        const response = await api.get(`/sales/leads/${id}/journey`);
        return response.data;
    },

    /**
     * Submits a request to create a new lead.
     */
    createLead: async (leadData) => {
        // Sanitize: ensure no joined objects or metadata fields are sent
        const { assigned_agent, owner, follow_ups, created_at, updated_at, id, ...cleanData } = leadData;
        const response = await api.post('/sales/leads', cleanData);
        return response.data;
    },

    /**
     * Sends updates for an existing lead.
     */
    updateLead: async (id, updates) => {
        // Sanitize: only send fields that are actual database columns
        const { assigned_agent, owner, follow_ups, created_at, updated_at, ...cleanUpdates } = updates;
        const response = await api.patch(`/sales/leads/${id}`, cleanUpdates);
        return response.data;
    },

    /**
     * Removes a lead from the system.
     */
    deleteLead: async (id) => {
        const response = await api.delete(`/sales/leads/${id}`);
        return response.data;
    },

    /**
     * Uploads an array of leads in bulk via CSV.
     */
    bulkUploadLeads: async (leadsData, assigned_agent_id = null) => {
        const response = await api.post('/sales/leads/bulk/upload', { leadsData, assigned_agent_id });
        return response.data;
    },

    /**
     * Assigns multiple leads to a specific agent in bulk.
     */
    bulkAssignLeads: async (leadIds, assigned_agent_id) => {
        const response = await api.patch('/sales/leads/bulk/assign', { leadIds, assigned_agent_id });
        return response.data;
    },

    /**
     * Updates the status of multiple leads in bulk.
     */
    bulkUpdateLeadsStatus: async (leadIds, status) => {
        const response = await api.patch('/sales/leads/bulk/status', { leadIds, status });
        return response.data;
    },

    /**
     * Deletes multiple leads in bulk.
     */
    bulkDeleteLeads: async (leadIds) => {
        const response = await api.delete('/sales/leads/bulk/delete', { data: { leadIds } });
        return response.data;
    },

    /**
     * Logs or schedules a follow-up interaction.
     */
    createFollowUp: async (leadId, followUpData) => {
        const response = await api.post(`/sales/leads/${leadId}/follow-ups`, followUpData);
        return response.data;
    },

    /**
     * Updates follow-up status or notes.
     */
    updateFollowUp: async (leadId, followUpId, updates) => {
        const response = await api.patch(`/sales/leads/${leadId}/follow-ups/${followUpId}`, updates);
        return response.data;
    },

    /**
     * Fetches aggregated sales performance metrics.
     */
    getMetrics: async (params = {}) => {
        const response = await api.get('/sales/metrics', { params });
        return response.data;
    },

    /**
     * Fetches all follow-ups with optional filtering.
     */
    getFollowUps: async (params = {}) => {
        const response = await api.get('/sales/follow-ups', { params });
        return response.data;
    },

    /**
     * Deletes a follow-up by ID.
     */
    deleteFollowUp: async (leadId, followUpId) => {
        const response = await api.delete(`/sales/leads/${leadId}/follow-ups/${followUpId}`);
        return response.data;
    },

    /**
     * Onboards a lead (Won -> Client -> Project).
     */
    onboardLead: async (id, onboardingData) => {
        const response = await api.post(`/sales/leads/${id}/onboard`, onboardingData);
        return response.data;
    },

    /**
     * Lead File Management
     */
    getLeadFiles: async (leadId) => {
        const response = await api.get(`/lead-files/${leadId}`);
        return response.data;
    },

    uploadLeadFile: async (leadId, formData) => {
        const response = await api.post(`/lead-files/${leadId}/upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteLeadFile: async (fileId) => {
        const response = await api.delete(`/lead-files/${fileId}`);
        return response.data;
    }
};
