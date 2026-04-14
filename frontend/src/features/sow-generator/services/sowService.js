import axios from 'axios';
import { supabase } from '../../../lib/supabase';

const sowApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1/sow`,
});

sowApi.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const generateSoW = async (formData) => {
  const response = await sowApi.post('/generate', { formData });
  return response.data;
};

export const finalizeSoW = async (id) => {
  const response = await sowApi.post(`/finalize/${id}`);
  return response.data;
};

export const listProjects = async () => {
  const response = await sowApi.get('/projects');
  return response.data;
};

export const getProject = async (id) => {
  const response = await sowApi.get(`/projects/${id}`);
  return response.data;
};

export const updateProject = async (id, data) => {
  const response = await sowApi.put(`/projects/${id}`, data);
  return response.data;
};

export const deleteProject = async (id) => {
  const response = await sowApi.delete(`/projects/${id}`);
  return response.data;
};
