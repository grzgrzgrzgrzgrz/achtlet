import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with your actual backend URL when deployed
const BASE_URL = 'https://your-backend-url.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include session cookie
api.interceptors.request.use(
  async (config) => {
    const sessionToken = await AsyncStorage.getItem('sessionToken');
    if (sessionToken) {
      config.headers.Authorization = `Bearer ${sessionToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      AsyncStorage.removeItem('isLoggedIn');
    }
    return Promise.reject(error);
  }
);

// API functions
export const login = async (password: string) => {
  try {
    const response = await api.post('/auth/login', { password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const response = await api.post('/auth/logout');
    await AsyncStorage.removeItem('sessionToken');
    return response.data;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const fetchWorkflows = async () => {
  try {
    const response = await api.get('/workflows');
    return response.data;
  } catch (error) {
    console.error('Fetch workflows error:', error);
    throw error;
  }
};

export const fetchExecutions = async (params?: {
  workflowId?: string;
  limit?: number;
  status?: string;
}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params?.workflowId) queryParams.append('workflowId', params.workflowId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);

    const response = await api.get(`/executions?${queryParams}`);
    return response.data;
  } catch (error) {
    console.error('Fetch executions error:', error);
    throw error;
  }
};

export const fetchExecutionDetails = async (id: string) => {
  try {
    const response = await api.get(`/executions/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch execution details error:', error);
    throw error;
  }
};

export const toggleWorkflow = async (id: string, active: boolean) => {
  try {
    const response = await api.patch(`/workflows/${id}`, { active });
    return response.data;
  } catch (error) {
    console.error('Toggle workflow error:', error);
    throw error;
  }
};

export const saveN8nConfig = async (url: string, apiKey: string) => {
  try {
    const response = await api.post('/config', { url, apiKey });
    return response.data;
  } catch (error) {
    console.error('Save config error:', error);
    throw error;
  }
};

export const checkApiStatus = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    console.error('API status check error:', error);
    return { connected: false };
  }
};

export default {
  login,
  logout,
  fetchWorkflows,
  fetchExecutions,
  fetchExecutionDetails,
  toggleWorkflow,
  saveN8nConfig,
  checkApiStatus,
};