import { useState, useCallback, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginationResult<T> {
  /** Current page of items (after client-side search filter) */
  paginatedItems: T[];
  /** All items matching the search (for counts/stats) */
  filteredItems: T[];
  /** Total count of filtered items */
  totalFiltered: number;
  /** Total pages */
  totalPages: number;
  /** Current page (1-indexed) */
  page: number;
  /** Page size */
  pageSize: number;
  /** Whether there's a next page */
  hasNextPage: boolean;
  /** Whether there's a previous page */
  hasPrevPage: boolean;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Change page size */
  setPageSize: (size: number) => void;
}

export function usePaginatedData<T>(
  items: T[],
  searchFn?: (item: T, term: string) => boolean,
  searchTerm?: string,
  defaultPageSize = 25
): PaginationResult<T> {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: defaultPageSize,
  });

  const filteredItems = useMemo(() => {
    if (!searchTerm || !searchFn) return items;
    return items.filter((item) => searchFn(item, searchTerm));
  }, [items, searchTerm, searchFn]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pagination.pageSize));

  // Clamp page to valid range
  const currentPage = Math.min(pagination.page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pagination.pageSize;
    return filteredItems.slice(start, start + pagination.pageSize);
  }, [filteredItems, currentPage, pagination.pageSize]);

  const nextPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, Math.min(page, totalPages)) }));
  }, [totalPages]);

  const setPageSize = useCallback((size: number) => {
    setPagination({ page: 1, pageSize: size });
  }, []);

  return {
    paginatedItems,
    filteredItems,
    totalFiltered: filteredItems.length,
    totalPages,
    page: currentPage,
    pageSize: pagination.pageSize,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage,
    prevPage,
    goToPage,
    setPageSize,
  };
}
