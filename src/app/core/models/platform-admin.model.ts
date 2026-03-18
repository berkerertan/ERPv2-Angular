/** PlatformAdmin module — Backend API DTO eşleştirmesi */
import { SubscriptionPlan, SubscriptionStatus } from './user.model';

export interface AdminOverviewDto {
    totalSubscribers: number;
    activeSubscribers: number;
    suspendedSubscribers: number;
    cancelledSubscribers: number;
    totalUsers: number;
    totalMonthlyRecurringRevenue: number;
    todayActiveUsers: number;
    todayRequestCount: number;
}

export interface AdminActivityLogDto {
    id: string;
    tenantId?: string;
    userId?: string;
    userName?: string;
    httpMethod?: string;
    path?: string;
    statusCode: number;
    durationMs: number;
    occurredAtUtc: string;
}

export interface AdminAuditLogDto {
    id: string;
    tenantId?: string;
    userId?: string;
    userName?: string;
    httpMethod?: string;
    path?: string;
    statusCode: number;
    durationMs: number;
    ipAddress?: string;
    userAgent?: string;
    occurredAtUtc: string;
}

export interface AdminAuditLogSummaryDto {
    totalCount: number;
    errorCount: number;
    todayCount: number;
    uniqueUsers: number;
    uniqueTenants: number;
    averageDurationMs: number;
}

export interface AdminRevenuePointDto {
    plan?: string;
    subscriberCount: number;
    monthlyPrice: number;
    revenue: number;
}

export interface AdminRevenueSummaryDto {
    totalMonthlyRevenue: number;
    breakdown?: AdminRevenuePointDto[];
}

export interface AdminTenantListItemDto {
    tenantId: string;
    name?: string;
    code?: string;
    plan: SubscriptionPlan;
    assignedRole?: string;
    status: SubscriptionStatus;
    maxUsers: number;
    currentUserCount: number;
    subscriptionStartAtUtc: string;
    subscriptionEndAtUtc?: string;
    lastActivityAtUtc?: string;
    monthlyPrice: number;
}

export interface AdminTenantDetailDto {
    tenantId: string;
    name?: string;
    code?: string;
    plan: SubscriptionPlan;
    assignedRole?: string;
    status: SubscriptionStatus;
    maxUsers: number;
    currentUserCount: number;
    subscriptionStartAtUtc: string;
    subscriptionEndAtUtc?: string;
    monthlyPrice: number;
    features?: string[];
    recentActivities?: AdminActivityLogDto[];
}

export interface UpdateTenantSubscriptionRequest {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    subscriptionEndAtUtc?: string;
}

export interface LandingPageContentDto {
    key?: string;
    title?: string;
    content?: string;
    isPublished: boolean;
    sortOrder: number;
    updatedAtUtc: string;
}

export interface UpdateLandingPageContentRequest {
    title?: string;
    content?: string;
    isPublished: boolean;
    sortOrder: number;
}

export interface UpdatePlanSettingRequest {
    displayName?: string;
    monthlyPrice: number;
    maxUsers: number;
    isActive: boolean;
    features?: string[];
}

// ── System Health ──────────────────────────────────────────────────────────

export interface HealthProbeDto {
    status: string;
    utc: string;
    authorizationEnforced: boolean;
}

export interface SystemHealthOverviewDto {
    status: string;                // "Healthy" | "Unhealthy" | "Degraded"
    currentUtc: string;
    startedAtUtc: string;
    uptimeSeconds: number;
    environment: string;
    version: string;
    authorizationEnforced: boolean;
    databaseReachable: boolean;
    requestsLastHour: number;
    errorsLastHour: number;
    errorRateLastHour: number;
    averageDurationMs: number;
    activeUsersToday: number;
    activeTenantsToday: number;
    lastRequestAtUtc: string;
    lastErrorAtUtc: string;
}

export interface SystemHealthDependencyDto {
    name: string;                  // "database" | "authorization" | "api"
    status: string;                // "Healthy" | "Unhealthy" | "Degraded"
    responseTimeMs: number;
    message: string;
    checkedAtUtc: string;
}

export interface SystemHealthTimelinePointDto {
    bucketStartUtc: string;
    requestCount: number;
    errorCount: number;
    averageDurationMs: number;
}

export interface SystemHealthTimelineDto {
    rangeMinutes: number;
    bucketMinutes: number;
    points: SystemHealthTimelinePointDto[];
}

export interface AuditLogFilter {
    q?: string;
    tenantId?: string;
    userId?: string;
    statusCode?: number;
    fromUtc?: string;
    toUtc?: string;
    onlyErrors?: boolean;
    page?: number;
    pageSize?: number;
}
