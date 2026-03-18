import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionPlan, SubscriptionStatus, SubscriptionPlanOptionDto } from '../models/user.model';
import {
    AdminOverviewDto,
    AdminTenantListItemDto,
    AdminTenantDetailDto,
    AdminActivityLogDto,
    UpdateTenantSubscriptionRequest,
    UpdatePlanSettingRequest,
    LandingPageContentDto,
    UpdateLandingPageContentRequest,
    AdminRevenueSummaryDto,
    AdminAuditLogDto,
    AdminAuditLogSummaryDto,
    AuditLogFilter,
    HealthProbeDto,
    SystemHealthOverviewDto,
    SystemHealthDependencyDto,
    SystemHealthTimelineDto
} from '../models/platform-admin.model';

@Injectable({ providedIn: 'root' })
export class PlatformAdminService {
    private readonly apiUrl = `${environment.apiUrl}/api/platform-admin`;

    constructor(private http: HttpClient) {}

    // ── Dashboard Overview ─────────────────────────────────────────────
    getOverview(): Observable<AdminOverviewDto> {
        return this.http.get<AdminOverviewDto>(`${this.apiUrl}/dashboard/overview`);
    }

    // ── Subscribers (Tenants) ──────────────────────────────────────────
    getSubscribers(q?: string, plan?: SubscriptionPlan, status?: SubscriptionStatus, page?: number, pageSize?: number): Observable<AdminTenantListItemDto[]> {
        let params = new HttpParams();
        if (q) params = params.set('q', q);
        if (plan !== undefined) params = params.set('plan', plan.toString());
        if (status !== undefined) params = params.set('status', status.toString());
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<AdminTenantListItemDto[]>(`${this.apiUrl}/subscribers`, { params });
    }

    getSubscriberDetail(tenantId: string): Observable<AdminTenantDetailDto> {
        return this.http.get<AdminTenantDetailDto>(`${this.apiUrl}/subscribers/${tenantId}`);
    }

    getSubscriberActivities(tenantId: string, fromUtc?: string, toUtc?: string, page?: number, pageSize?: number): Observable<AdminActivityLogDto[]> {
        let params = new HttpParams();
        if (fromUtc) params = params.set('fromUtc', fromUtc);
        if (toUtc) params = params.set('toUtc', toUtc);
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<AdminActivityLogDto[]>(`${this.apiUrl}/subscribers/${tenantId}/activities`, { params });
    }

    updateSubscription(tenantId: string, req: UpdateTenantSubscriptionRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/subscribers/${tenantId}/subscription`, req);
    }

    // ── Plans ──────────────────────────────────────────────────────────
    getPlans(): Observable<SubscriptionPlanOptionDto[]> {
        return this.http.get<SubscriptionPlanOptionDto[]>(`${this.apiUrl}/plans`);
    }

    updatePlan(plan: SubscriptionPlan, req: UpdatePlanSettingRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/plans/${plan}`, req);
    }

    // ── Landing Content ────────────────────────────────────────────────
    getLandingContent(): Observable<LandingPageContentDto[]> {
        return this.http.get<LandingPageContentDto[]>(`${this.apiUrl}/landing-content`);
    }

    updateLandingContent(key: string, req: UpdateLandingPageContentRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/landing-content/${key}`, req);
    }

    // ── Revenue Analytics ──────────────────────────────────────────────
    getRevenueSummary(): Observable<AdminRevenueSummaryDto> {
        return this.http.get<AdminRevenueSummaryDto>(`${this.apiUrl}/analytics/revenue`);
    }

    // ── Audit Logs ─────────────────────────────────────────────────────
    getAuditLogSummary(filter?: Partial<AuditLogFilter>): Observable<AdminAuditLogSummaryDto> {
        return this.http.get<AdminAuditLogSummaryDto>(`${this.apiUrl}/audit-logs/summary`, { params: this.buildParams(filter) });
    }

    getAuditLogs(filter?: AuditLogFilter): Observable<AdminAuditLogDto[]> {
        return this.http.get<AdminAuditLogDto[]>(`${this.apiUrl}/audit-logs`, { params: this.buildParams(filter) });
    }

    getAuditLog(id: string): Observable<AdminAuditLogDto> {
        return this.http.get<AdminAuditLogDto>(`${this.apiUrl}/audit-logs/${id}`);
    }

    // ── System Health ──────────────────────────────────────────────────
    getHealthProbe(): Observable<HealthProbeDto> {
        return this.http.get<HealthProbeDto>(`${environment.apiUrl}/health`);
    }

    getSystemHealthOverview(): Observable<SystemHealthOverviewDto> {
        return this.http.get<SystemHealthOverviewDto>(`${this.apiUrl}/system-health/overview`);
    }

    getSystemHealthDependencies(): Observable<SystemHealthDependencyDto[]> {
        return this.http.get<SystemHealthDependencyDto[]>(`${this.apiUrl}/system-health/dependencies`);
    }

    getSystemHealthTimeline(minutes = 60, bucketMinutes = 5): Observable<SystemHealthTimelineDto> {
        const params = new HttpParams()
            .set('minutes', minutes.toString())
            .set('bucketMinutes', bucketMinutes.toString());
        return this.http.get<SystemHealthTimelineDto>(`${this.apiUrl}/system-health/timeline`, { params });
    }

    private buildParams(filter?: Record<string, any>): HttpParams {
        let params = new HttpParams();
        if (!filter) return params;
        Object.keys(filter).forEach(key => {
            const value = filter[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });
        return params;
    }
}
