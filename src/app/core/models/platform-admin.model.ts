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

// ── Admin Users (Tüm platform kullanıcıları) ──────────────────────────────

export interface AdminUserListItemDto {
    userId: string;
    userName: string;
    email?: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    tenantCode?: string;
    isActive: boolean;
    createdAtUtc: string;
    lastLoginAtUtc?: string;
}

export interface AdminUserDetailDto {
    userId: string;
    userName: string;
    email?: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    tenantCode?: string;
    isActive: boolean;
    createdAtUtc: string;
    lastLoginAtUtc?: string;
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: SubscriptionStatus;
    recentActivities?: AdminActivityLogDto[];
}

export interface AdminUserFilter {
    q?: string;
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    pageSize?: number;
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

// ── Email Templates ────────────────────────────────────────────────────────

export interface EmailTemplateDto {
    id?: string;
    key: string;
    name: string;
    description?: string;
    subjectTemplate: string;
    bodyTemplate: string;
    isActive: boolean;
    createdAtUtc?: string;
    updatedAtUtc?: string;
}

export interface UpdateEmailTemplateRequest {
    subjectTemplate: string;
    bodyTemplate: string;
    isActive: boolean;
    name?: string;
    description?: string;
}

// ── Email Campaigns ────────────────────────────────────────────────────────

export enum PlatformEmailCampaignStatus {
    Draft             = 1,
    Scheduled         = 2,
    Queued            = 3,
    Processing        = 4,
    Completed         = 5,
    CompletedWithErrors = 6,
    Cancelled         = 7,
}

export enum PlatformEmailRecipientStatus {
    Pending   = 1,
    Sent      = 2,
    Failed    = 3,
    Skipped   = 4,
    Cancelled = 5,
}

export interface CampaignPreviewRequest {
    templateKey: string;
    tenantIds?: string[];
    sendToAllActiveTenants: boolean;
    sendToAllTenantUsers: boolean;
}

export interface CampaignPreviewRecipientDto {
    tenantId: string;
    tenantCode: string;
    tenantName: string;
    recipientEmail: string;
}

export interface CampaignPreviewDto {
    tenantCount: number;
    recipientCount: number;
    recipientsSample: CampaignPreviewRecipientDto[];
}

export interface CreateCampaignRequest {
    name: string;
    description?: string;
    templateKey: string;
    tenantIds?: string[];
    sendToAllActiveTenants: boolean;
    sendToAllTenantUsers: boolean;
    subjectOverride?: string;
    bodyOverride?: string;
    variables?: Record<string, string>;
    scheduledAtUtc?: string;
    isHtml: boolean;
}

export interface EmailCampaignListItemDto {
    campaignId: string;
    name: string;
    description?: string;
    templateKey: string;
    status: PlatformEmailCampaignStatus;
    recipientCount: number;
    sentCount: number;
    failedCount: number;
    scheduledAtUtc?: string;
    createdAtUtc: string;
    completedAtUtc?: string;
}

export interface EmailCampaignDetailDto extends EmailCampaignListItemDto {
    sendToAllActiveTenants: boolean;
    sendToAllTenantUsers: boolean;
    subjectOverride?: string;
    bodyOverride?: string;
    variables?: Record<string, string>;
    isHtml: boolean;
}

export interface EmailCampaignRecipientDto {
    recipientId: string;
    tenantId: string;
    tenantCode?: string;
    tenantName?: string;
    recipientEmail: string;
    status: PlatformEmailRecipientStatus;
    sentAtUtc?: string;
    errorMessage?: string;
}

export interface CampaignFilter {
    q?: string;
    status?: number;
    page?: number;
    pageSize?: number;
}

// ── Email Logs ─────────────────────────────────────────────────────────────

export interface EmailLogDto {
    id: string;
    campaignId?: string;
    campaignName?: string;
    tenantId?: string;
    tenantName?: string;
    recipientEmail: string;
    subject: string;
    status: string;
    sentAtUtc?: string;
    errorMessage?: string;
}

export interface EmailLogFilter {
    q?: string;
    campaignId?: string;
    tenantId?: string;
    status?: string;
    fromUtc?: string;
    toUtc?: string;
    page?: number;
    pageSize?: number;
}
