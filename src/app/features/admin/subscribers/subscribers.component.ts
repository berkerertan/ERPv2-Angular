import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import {
    Tenant,
    TenantStatus,
    PlanId,
    TenantListFilter,
    UpdateTenantStatusRequest,
    UpdateTenantPlanRequest,
    BillingCycle,
} from '../../../core/models/tenant.model';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import {
    AdminTenantListItemDto,
    AdminTenantDetailDto,
    UpdateTenantSubscriptionRequest,
} from '../../../core/models/platform-admin.model';
import { SubscriptionPlan, SubscriptionStatus } from '../../../core/models/user.model';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-subscribers',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './subscribers.component.html',
    styleUrls: ['./subscribers.component.css', '../../../shared/styles/crud-page.css'],
})
export class SubscribersComponent implements OnInit, OnDestroy {
    private confirmService = inject(ConfirmService);

    // ─── Signals ──────────────────────────────────────────────────────────────
    tenants = signal<Tenant[]>([]);
    total = signal<number>(0);
    isLoading = signal<boolean>(false);
    error = signal<string | null>(null);
    selectedTenant = signal<Tenant | null>(null);
    showDetailModal = signal<boolean>(false);
    showStatusModal = signal<boolean>(false);
    showPlanModal = signal<boolean>(false);

    // Toast
    toastMessage = signal<string | null>(null);
    toastType = signal<'success' | 'error' | 'info'>('success');
    private _toastTimer: any = null;

    // ─── Filter state ──────────────────────────────────────────────────────────
    filter: TenantListFilter = {
        search: '',
        status: 'all',
        plan: 'all',
        page: 1,
        pageSize: 12,
    };

    // ─── Debounce handle ──────────────────────────────────────────────────────
    private _searchDebounce: any = null;

    // ─── Plan/Status modal state ──────────────────────────────────────────────
    pendingStatus: TenantStatus | null = null;
    pendingStatusReason = '';
    pendingPlan: PlanId | null = null;
    pendingBillingCycle: BillingCycle = 'monthly';
    notesValue = '';

    // Real API data signals
    apiTenants = signal<AdminTenantListItemDto[]>([]);
    selectedTenantDetail = signal<AdminTenantDetailDto | null>(null);

    constructor(
        private tenantService: TenantService,
        private platformAdminService: PlatformAdminService
    ) {}

    ngOnInit(): void {
        this.loadFromApi();
    }

    ngOnDestroy(): void {
        if (this._searchDebounce) clearTimeout(this._searchDebounce);
        if (this._toastTimer) clearTimeout(this._toastTimer);
    }

    // ─── Data Loading ──────────────────────────────────────────────────────────

    loadTenants(): void {
        this.isLoading.set(true);
        this.error.set(null);
        this.tenantService.getTenants({ ...this.filter }).subscribe({
            next: (res) => {
                this.tenants.set(res.items);
                this.total.set(res.total);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set('Aboneler yüklenirken bir hata oluştu.');
                this.isLoading.set(false);
                console.error(err);
            },
        });
    }

    // ─── Search & Filter ──────────────────────────────────────────────────────

    onSearchChange(): void {
        if (this._searchDebounce) clearTimeout(this._searchDebounce);
        this._searchDebounce = setTimeout(() => {
            this.filter.page = 1;
            this.loadFromApi();
        }, 400);
    }

    onFilterChange(): void {
        this.filter.page = 1;
        this.loadFromApi();
    }

    // ─── Pagination ───────────────────────────────────────────────────────────

    get totalPages(): number {
        return Math.ceil(this.total() / this.filter.pageSize) || 1;
    }

    get pages(): number[] {
        const tp = this.totalPages;
        const current = this.filter.page;
        const delta = 2;
        const pages: number[] = [];

        const start = Math.max(1, current - delta);
        const end = Math.min(tp, current + delta);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }

    changePage(page: number): void {
        if (page < 1 || page > this.totalPages || page === this.filter.page) return;
        this.filter.page = page;
        this.loadFromApi();
    }

    // ─── Detail Modal ─────────────────────────────────────────────────────────

    openDetail(tenant: Tenant): void {
        this.selectedTenant.set(tenant);
        this.notesValue = tenant.notes ?? '';
        this.pendingPlan = tenant.plan;
        this.pendingBillingCycle = tenant.billingCycle;
        this.pendingStatus = tenant.status;
        this.pendingStatusReason = '';
        this.showDetailModal.set(true);
    }

    closeDetail(): void {
        this.showDetailModal.set(false);
        this.showStatusModal.set(false);
        this.showPlanModal.set(false);
        this.selectedTenant.set(null);
    }

    openStatusModal(tenant: Tenant): void {
        this.selectedTenant.set(tenant);
        this.pendingStatus = tenant.status;
        this.pendingStatusReason = '';
        this.showStatusModal.set(true);
        this.showDetailModal.set(false);
    }

    openPlanModal(tenant: Tenant): void {
        this.selectedTenant.set(tenant);
        this.pendingPlan = tenant.plan;
        this.pendingBillingCycle = tenant.billingCycle;
        this.showPlanModal.set(true);
        this.showDetailModal.set(false);
    }

    closeStatusModal(): void {
        this.showStatusModal.set(false);
    }

    closePlanModal(): void {
        this.showPlanModal.set(false);
    }

    // ─── Status Update ────────────────────────────────────────────────────────

    updateStatus(req: UpdateTenantStatusRequest): void {
        this.tenantService.updateTenantStatus(req).subscribe({
            next: (updated) => {
                this.showToast(`Durum güncellendi: ${this.getStatusLabel(updated.status)}`, 'success');
                this.showStatusModal.set(false);
                // Also update detail modal if open
                if (this.showDetailModal() && this.selectedTenant()?.id === updated.id) {
                    this.selectedTenant.set(updated);
                }
                this.loadFromApi();
            },
            error: () => {
                this.showToast('Durum güncellenirken hata oluştu.', 'error');
            },
        });
    }

    applyStatusChange(): void {
        const t = this.selectedTenant();
        if (!t || !this.pendingStatus) return;
        this.updateStatus({ tenantId: t.id, status: this.pendingStatus, reason: this.pendingStatusReason });
    }

    // ─── Plan Update ──────────────────────────────────────────────────────────

    updatePlan(req: UpdateTenantPlanRequest): void {
        this.tenantService.updateTenantPlan(req).subscribe({
            next: (updated) => {
                this.showToast(`Plan güncellendi: ${this.getPlanLabel(updated.plan)}`, 'success');
                this.showPlanModal.set(false);
                if (this.showDetailModal() && this.selectedTenant()?.id === updated.id) {
                    this.selectedTenant.set(updated);
                }
                this.loadFromApi();
            },
            error: () => {
                this.showToast('Plan güncellenirken hata oluştu.', 'error');
            },
        });
    }

    applyPlanChange(): void {
        const t = this.selectedTenant();
        if (!t || !this.pendingPlan) return;
        this.updatePlan({ tenantId: t.id, newPlan: this.pendingPlan, billingCycle: this.pendingBillingCycle });
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    async deleteTenant(id: string): Promise<void> {
        const tenant = this.tenants().find(t => t.id === id);
        const name = tenant?.companyName ?? 'bu aboneyi';
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: `"${name}" silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?`,
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.tenantService.deleteTenant(id).subscribe({
            next: () => {
                this.showToast('Abone silindi.', 'success');
                if (this.selectedTenant()?.id === id) {
                    this.closeDetail();
                }
                // Go back a page if last item on page
                if (this.tenants().length === 1 && this.filter.page > 1) {
                    this.filter.page--;
                }
                this.loadFromApi();
            },
            error: () => {
                this.showToast('Abone silinirken hata oluştu.', 'error');
            },
        });
    }

    // ─── Label / Style Helpers ────────────────────────────────────────────────

    getStatusLabel(s: TenantStatus | string): string {
        switch (s) {
            case 'trial':     return 'Deneme';
            case 'active':    return 'Aktif';
            case 'suspended': return 'Askıya Alındı';
            case 'cancelled': return 'İptal';
            default:          return s;
        }
    }

    getStatusClass(s: TenantStatus | string): string {
        switch (s) {
            case 'trial':     return 'badge badge-info';
            case 'active':    return 'badge badge-success';
            case 'suspended': return 'badge badge-warning';
            case 'cancelled': return 'badge badge-danger';
            default:          return 'badge';
        }
    }

    getPlanLabel(p: PlanId | string): string {
        switch (p) {
            case 'starter':    return 'Başlangıç';
            case 'pro':        return 'Profesyonel';
            case 'enterprise': return 'Kurumsal';
            default:           return p;
        }
    }

    getPlanClass(p: PlanId | string): string {
        switch (p) {
            case 'starter':    return 'badge badge-info';
            case 'pro':        return 'badge badge-primary';
            case 'enterprise': return 'badge badge-warning';
            default:           return 'badge';
        }
    }

    getBillingLabel(cycle: BillingCycle | string): string {
        return cycle === 'annual' ? 'Yıllık' : 'Aylık';
    }

    // ─── Formatting ───────────────────────────────────────────────────────────

    formatDate(d: string | null | undefined): string {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    }

    formatCurrency(n: number): string {
        if (n === 0) return '—';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);
    }

    formatNumber(n: number): string {
        return new Intl.NumberFormat('tr-TR').format(n);
    }

    // ─── Toast ────────────────────────────────────────────────────────────────

    showToast(message: string, type: 'success' | 'error' | 'info' = 'success'): void {
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this.toastMessage.set(message);
        this.toastType.set(type);
        this._toastTimer = setTimeout(() => {
            this.toastMessage.set(null);
        }, 3500);
    }

    dismissToast(): void {
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this.toastMessage.set(null);
    }

    // ─── Template Helpers ─────────────────────────────────────────────────────

    /** Returns summary revenue total from current page */
    get pageRevenue(): number {
        return this.tenants().reduce((sum, t) => sum + t.monthlyRevenue, 0);
    }

    get hasPrevPage(): boolean {
        return this.filter.page > 1;
    }

    get hasNextPage(): boolean {
        return this.filter.page < this.totalPages;
    }

    trackByTenant(_: number, t: Tenant): string {
        return t.id;
    }

    // ─── Real API Integration ──────────────────────────────────────────────────

    loadFromApi(): void {
        this.isLoading.set(true);
        this.error.set(null);
        const plan = this.filter.plan && this.filter.plan !== 'all' ? this.planToEnum(this.filter.plan as string) : undefined;
        const status = this.filter.status && this.filter.status !== 'all' ? this.statusToEnum(this.filter.status as string) : undefined;
        this.platformAdminService.getSubscribers(
            this.filter.search || undefined,
            plan,
            status,
            this.filter.page,
            this.filter.pageSize
        ).subscribe({
            next: (data) => {
                this.apiTenants.set(data);
                // Map API data to Tenant format for template compatibility
                const mapped: Tenant[] = data.map(d => ({
                    id: d.tenantId,
                    companyName: d.name || d.code || '—',
                    ownerName: d.assignedRole || '—',
                    email: '',
                    phone: '',
                    plan: this.enumToPlanId(d.plan),
                    status: this.enumToStatus(d.status),
                    billingCycle: 'monthly' as BillingCycle,
                    trialEndsAt: null,
                    subscribedAt: d.subscriptionStartAtUtc,
                    lastActiveAt: d.lastActivityAtUtc || d.subscriptionStartAtUtc,
                    monthlyRevenue: d.monthlyPrice,
                    branchCount: 0,
                    userCount: d.currentUserCount,
                    productCount: 0,
                    transactionCount: 0,
                    city: '',
                    notes: ''
                }));
                this.tenants.set(mapped);
                this.total.set(data.length);
                this.isLoading.set(false);
            },
            error: (err) => {
                this.error.set(err.error?.detail || 'Aboneler yüklenirken bir hata oluştu.');
                this.isLoading.set(false);
            }
        });
    }

    loadTenantDetail(tenantId: string): void {
        this.platformAdminService.getSubscriberDetail(tenantId).subscribe({
            next: (detail) => this.selectedTenantDetail.set(detail),
            error: () => this.selectedTenantDetail.set(null)
        });
    }

    updateSubscriptionViaApi(tenantId: string, req: UpdateTenantSubscriptionRequest): void {
        this.platformAdminService.updateSubscription(tenantId, req).subscribe({
            next: () => {
                this.showToast('Abonelik güncellendi', 'success');
                this.loadFromApi();
            },
            error: () => this.showToast('Güncelleme başarısız', 'error')
        });
    }

    private enumToPlanId(plan: SubscriptionPlan): PlanId {
        const map: Record<number, PlanId> = {
            [SubscriptionPlan.Starter]: 'starter',
            [SubscriptionPlan.Pro]: 'pro',
            [SubscriptionPlan.Enterprise]: 'enterprise'
        };
        return map[plan] || 'starter';
    }

    private enumToStatus(status: SubscriptionStatus): TenantStatus {
        const map: Record<number, TenantStatus> = {
            [SubscriptionStatus.Trial]: 'trial',
            [SubscriptionStatus.Active]: 'active',
            [SubscriptionStatus.Cancelled]: 'cancelled'
        };
        return map[status] || 'active';
    }

    private planToEnum(plan: string): SubscriptionPlan | undefined {
        const map: Record<string, SubscriptionPlan> = {
            starter: SubscriptionPlan.Starter,
            pro: SubscriptionPlan.Pro,
            enterprise: SubscriptionPlan.Enterprise
        };
        return map[plan];
    }

    private statusToEnum(status: string): SubscriptionStatus | undefined {
        const map: Record<string, SubscriptionStatus> = {
            trial: SubscriptionStatus.Trial,
            active: SubscriptionStatus.Active,
            cancelled: SubscriptionStatus.Cancelled
        };
        return map[status];
    }
}
