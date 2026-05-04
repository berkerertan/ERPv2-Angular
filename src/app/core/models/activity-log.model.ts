export interface TenantActivityLogDto {
    id: string;
    tenantId?: string;
    userId?: string;
    userName?: string;
    description?: string;
    httpMethod?: string;
    path?: string;
    module?: string;
    statusCode: number;
    durationMs: number;
    ipAddress?: string;
    userAgent?: string;
    occurredAtUtc: string;
}

export interface TenantActivitySummaryDto {
    totalCount: number;
    todayCount: number;
    errorCount: number;
    averageDurationMs: number;
    lastActivityAtUtc?: string;
}

export interface TenantActivityFilter {
    statusCode?: number;
    onlyErrors?: boolean;
    fromUtc?: string;
    toUtc?: string;
    module?: string;
    httpMethod?: string;
    businessOnly?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
}
