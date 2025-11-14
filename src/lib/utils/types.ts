/**
 * Core service context types
 */

export interface ServerCtxType {
  accountUserId?: number;
  companyId?: number;
  companyUserId?: number;
  userRole?: 'admin' | 'supervisor' | 'user';
  permissions?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ServiceResponse<T> {
  data: T | null;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}