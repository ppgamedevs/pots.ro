export interface PaginationParams {
  page?: number | string;
  pageSize?: number | string;
  maxPageSize?: number;
  defaultPageSize?: number;
}

export type PageParams = PaginationParams;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPagination({
  page = 1,
  pageSize = 24,
  maxPageSize = 60,
  defaultPageSize = 24,
}: PaginationParams = {}): { offset: number; limit: number; meta: PaginationMeta } {
  const pageNum = typeof page === 'string' ? parseInt(page, 10) : page;
  const pageSizeNum = typeof pageSize === 'string' ? parseInt(pageSize, 10) : pageSize;
  
  const normalizedPage = Math.max(1, pageNum);
  const normalizedPageSize = Math.min(
    Math.max(1, pageSizeNum),
    maxPageSize
  );
  
  const offset = (normalizedPage - 1) * normalizedPageSize;
  
  return {
    offset,
    limit: normalizedPageSize,
    meta: {
      page: normalizedPage,
      pageSize: normalizedPageSize,
      totalItems: 0, // Will be set by caller
      totalPages: 0, // Will be set by caller
      hasNext: false, // Will be set by caller
      hasPrev: normalizedPage > 1,
    },
  };
}

export function buildPaginationMeta(
  page: number,
  pageSize: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.ceil(totalItems / pageSize);
  
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}