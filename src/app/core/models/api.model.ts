/** Shared API query/pagination interfaces — Backend uyumlu */

export interface ApiQueryParams {
    q?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
    [key: string]: any;
}
