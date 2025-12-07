// src/services/userManagementService.ts
/**
 * User Management Service
 * Handles API calls for managing users (view, edit, deactivate, delete, reset password)
 */

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  organization?: string;
  location?: string;
  phone?: string;
  status: string;
  created_at?: string;
  last_login?: string;
  district?: string;
}

interface UserFilters {
  role?: string;
  status?: string;
  district?: string;
  search?: string;
  skip?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: number;
}

interface UserCounts {
  total_count: number;
  admin_count: number;
  government_count: number;
  asha_count: number;
  community_count: number;
}

interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  timestamp: string;
  changes: Record<string, any>;
}

interface UserActivityLog {
  action: string;
  performed_by: string;
  timestamp: string;
  changes: Record<string, any>;
}

class UserManagementService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/users`,
      withCredentials: false,  // Don't send cookies - we use Bearer token instead
    });

    // Add token to requests
    this.api.interceptors.request.use((config) => {
      // Reuse the same token key as AuthContext to avoid unauthorized calls
      const token = localStorage.getItem('paanicare-token');
      console.log('DEBUG: Request interceptor - token exists?', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for debugging
    this.api.interceptors.response.use(
      (response) => {
        console.log('DEBUG: API response success', response.config.url, response.status);
        return response;
      },
      (error) => {
        console.error('DEBUG: API response error', error.config?.url, error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(filters: UserFilters = {}): Promise<User[]> {
    const params = new URLSearchParams();
    
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status_filter', filters.status);
    if (filters.district) params.append('district', filters.district);
    if (filters.search) params.append('search', filters.search);
    params.append('skip', String(filters.skip || 0));
    params.append('limit', String(filters.limit || 50));
    if (filters.sortBy) params.append('sort_by', filters.sortBy);
    params.append('sort_order', String(filters.sortOrder || -1));
    // Prevent caching
    params.append('_t', String(Date.now()));

    const response = await this.api.get<User[]>('/list', { params });
    console.log('DEBUG: getAllUsers response', response.data);
    return response.data;
  }

  /**
   * Get user count statistics
   */
  async getUserCounts(role?: string, status?: string): Promise<UserCounts> {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status_filter', status);

    const response = await this.api.get<UserCounts>('/count', { params });
    return response.data;
  }

  /**
   * Get detailed user information
   */
  async getUserDetail(userId: string): Promise<User> {
    const response = await this.api.get<User>(`/${userId}`);
    return response.data;
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId: string, skip: number = 0, limit: number = 100): Promise<UserActivityLog[]> {
    const params = new URLSearchParams();
    params.append('skip', String(skip));
    params.append('limit', String(limit));

    const response = await this.api.get<UserActivityLog[]>(
      `/${userId}/activity-logs`,
      { params }
    );
    return response.data;
  }

  /**
   * Update user information
   */
  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    const response = await this.api.put<User>(`/${userId}`, updateData);
    return response.data;
  }

  /**
   * Toggle user status (active/inactive)
   */
  async toggleUserStatus(userId: string, newStatus: 'active' | 'inactive'): Promise<{ user_id: string; new_status: string; timestamp: string }> {
    const response = await this.api.patch<{ user_id: string; new_status: string; timestamp: string }>(
      `/${userId}/status`,
      { status: newStatus }
    );
    return response.data;
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{ temp_password: string; expires_in_hours: number }> {
    const response = await this.api.post<{ temp_password: string; expires_in_hours: number }>(
      `/${userId}/reset-password`
    );
    return response.data;
  }

  /**
   * Delete user account
   */
  async deleteUser(userId: string): Promise<{ user_id: string; message: string; timestamp: string }> {
    const response = await this.api.delete<{ user_id: string; message: string; timestamp: string }>(
      `/${userId}`
    );
    return response.data;
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(action?: string, skip: number = 0, limit: number = 100): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (action) params.append('action', action);
    params.append('skip', String(skip));
    params.append('limit', String(limit));

    const response = await this.api.get<AuditLog[]>('/admin/audit-logs', { params });
    return response.data;
  }
}

export default new UserManagementService();
export type { User, UserFilters, UserCounts, AuditLog, UserActivityLog };
