import api from '../../lib/api';

export const ClientsService = {
    // Get all clients with optional filters (status, search)
    getClients: (params) => api.get('/clients', { params }),

    // Get a specific client by ID
    getClientById: (id) => api.get(`/clients/${id}`),

    // Create a new client manually (optional, typically handled by Lead conversion)
    createClient: (data) => api.post('/clients', data),

    // Update an existing client
    updateClient: (id, data) => api.patch(`/clients/${id}`, data),

    // Delete a client
    deleteClient: (id) => api.delete(`/clients/${id}`),
};
