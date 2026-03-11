/** Abone / Tenant modelleri */

export type TenantStatus = 'trial' | 'active' | 'suspended' | 'cancelled';
export type PlanId = 'starter' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface Tenant {
    id: string;
    companyName: string;
    ownerName: string;
    email: string;
    phone: string;
    plan: PlanId;
    status: TenantStatus;
    billingCycle: BillingCycle;
    trialEndsAt: string | null;
    subscribedAt: string;
    lastActiveAt: string;
    monthlyRevenue: number;
    branchCount: number;
    userCount: number;
    productCount: number;
    transactionCount: number;
    city: string;
    notes: string;
}

export interface TenantUsageStats {
    tenantId: string;
    dailyTransactions: { date: string; count: number }[];
    topFeatures: { feature: string; usageCount: number }[];
    storageUsedMb: number;
    apiCallsThisMonth: number;
}

export interface TenantListFilter {
    search?: string;
    status?: TenantStatus | 'all';
    plan?: PlanId | 'all';
    billingCycle?: BillingCycle | 'all';
    page: number;
    pageSize: number;
}

export interface TenantListResponse {
    items: Tenant[];
    total: number;
    page: number;
    pageSize: number;
}

export interface UpdateTenantPlanRequest {
    tenantId: string;
    newPlan: PlanId;
    billingCycle: BillingCycle;
}

export interface UpdateTenantStatusRequest {
    tenantId: string;
    status: TenantStatus;
    reason?: string;
}
