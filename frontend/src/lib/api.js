import axios from 'axios'
import { supabase } from './supabase'

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
})

// Attach Supabase JWT to every request
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
    }
    return config
})

// Normalize error messages
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const message = err.response?.data?.message || err.message || 'An error occurred'
        return Promise.reject(new Error(message))
    }
)

export default api
