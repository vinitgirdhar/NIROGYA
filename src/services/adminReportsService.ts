// src/services/adminReportsService.ts
/**
 * Admin Reports Service
 * Handles API calls for admin reports, analytics, system health, and audit logs
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

interface SummaryStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  total_actions: number;
  total_reports: number;
  api_health: number;
  database_health: number;
  system_uptime: number;
}

interface SystemHealthReport {
  metric: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  percentage?: number;
  timestamp: string;
}

interface UserReport {
  id: string;
  user_name: string;
  email: string;
  role: string;
  total_logins: number;
  last_login: string | null;
  actions_count: number;
  status: 'active' | 'inactive';
  created_at: string | null;
}

interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  resource: string;
  details: string;
  timestamp: string;
  status: 'success' | 'failed';
}

interface DataReport {
  date: string;
  users_created: number;
  reports_generated: number;
  api_calls: number;
  data_points: number;
}

class AdminReportsService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/api/admin/reports`,
      withCredentials: false,
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('paanicare-token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        console.log('DEBUG: Admin Reports API success', response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error('DEBUG: Admin Reports API error', error.config?.url, error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get summary statistics
   */
  async getSummaryStats(): Promise<SummaryStats> {
    try {
      const response = await this.api.get<SummaryStats>('/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching summary stats:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthReport[]> {
    try {
      const response = await this.api.get<SystemHealthReport[]>('/system-health');
      return response.data;
    } catch (error) {
      console.error('Error fetching system health:', error);
      throw error;
    }
  }

  /**
   * Get user reports with filtering
   */
  async getUserReports(params: {
    role?: string;
    status_filter?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<UserReport[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.role) queryParams.append('role', params.role);
      if (params.status_filter) queryParams.append('status_filter', params.status_filter);
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const response = await this.api.get<UserReport[]>(`/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user reports:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(params: {
    action_filter?: string;
    status_filter?: string;
    skip?: number;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.action_filter) queryParams.append('action_filter', params.action_filter);
      if (params.status_filter) queryParams.append('status_filter', params.status_filter);
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      const response = await this.api.get<AuditLog[]>(`/audit-logs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get data analytics over time
   */
  async getDataAnalytics(params: {
    start_date?: string;
    end_date?: string;
    days?: number;
  } = {}): Promise<DataReport[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      if (params.days !== undefined) queryParams.append('days', params.days.toString());

      const response = await this.api.get<DataReport[]>(`/data-analytics?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching data analytics:', error);
      throw error;
    }
  }
}

export default new AdminReportsService();
