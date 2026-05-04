export interface CollectionPlanSummary {
    totalAccountCount: number;
    plannedCount: number;
    criticalCount: number;
    totalOverdueAmount: number;
    plannedAmount: number;
}

export interface CollectionPlanItem {
    cariAccountId: string;
    cariCode: string;
    cariName: string;
    currentBalance: number;
    riskLimit: number;
    overdueAmount: number;
    overdueDays: number;
    riskUsageRate: number;
    suggestedPriority: number;
    suggestedAction: string;
    planEntryId?: string | null;
    title: string;
    priority: number;
    status: number;
    nextActionDateUtc?: string | null;
    promiseDateUtc?: string | null;
    assignedToUserName?: string | null;
    notes?: string | null;
    lastContactAtUtc?: string | null;
    lastContactNote?: string | null;
}

export interface CollectionPlanDashboard {
    summary: CollectionPlanSummary;
    items: CollectionPlanItem[];
}

export interface UpsertCollectionPlanRequest {
    cariAccountId: string;
    title?: string | null;
    priority: number;
    status: number;
    nextActionDateUtc?: string | null;
    promiseDateUtc?: string | null;
    assignedToUserName?: string | null;
    notes?: string | null;
    lastContactNote?: string | null;
}

export interface UpdateCollectionPlanStatusRequest {
    status: number;
    promiseDateUtc?: string | null;
    notes?: string | null;
    lastContactNote?: string | null;
}
