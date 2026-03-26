import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { SubscriptionPlanOptionDto } from '../../../core/models/user.model';
import {
  SubscriptionPlan,
  PlanPermissions,
  PlanLimits,
  CreatePlanRequest,
  PERMISSION_LABELS,
  PERMISSION_ICONS,
} from '../../../core/models/subscription-plan.model';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.css'],
})
export class PlansComponent implements OnInit {
  private platformAdminService = inject(PlatformAdminService);
  private toastService = inject(ToastService);

  // ─── Signals ────────────────────────────────────────────────────────────────
  plans = signal<SubscriptionPlan[]>([]);
  isLoading = signal(false);
  editingPlan = signal<SubscriptionPlan | null>(null);
  showEditModal = signal(false);
  showCreateModal = signal(false);
  isSaving = signal(false);

  // ─── Edit form state ─────────────────────────────────────────────────────────
  editForm: Partial<SubscriptionPlan> & {
    permissions: PlanPermissions;
    limits: PlanLimits;
  } = {
    name: '',
    description: '',
    icon: '',
    color: 'blue',
    monthlyPrice: 0,
    annualPrice: 0,
    annualDiscountPercent: 0,
    isPopular: false,
    isActive: true,
    permissions: {
      pos: false,
      stockManagement: false,
      stockMovements: false,
      cariAccounts: false,
      eFatura: false,
      eArsiv: false,
      purchaseOrders: false,
      salesOrders: false,
      basicReports: false,
      advancedReports: false,
      multiBranch: false,
      multiWarehouse: false,
      apiAccess: false,
      companyManagement: false,
    },
    limits: {
      maxBranches: 1,
      maxUsers: 3,
      maxProducts: 1000,
      maxTransactionsPerMonth: 5000,
    },
  };

  // ─── Permission helpers ──────────────────────────────────────────────────────
  readonly permissionKeys = Object.keys(PERMISSION_LABELS) as (keyof PlanPermissions)[];
  readonly PERMISSION_LABELS = PERMISSION_LABELS;
  readonly PERMISSION_ICONS = PERMISSION_ICONS;

  // Plan color/icon defaults
  private readonly planDefaults: Record<number, { icon: string; color: 'blue' | 'purple' | 'gold'; description: string }> = {
    1: { icon: 'rocket_launch', color: 'blue', description: 'Tek şubeli küçük işletmeler için temel ERP işlevleri.' },
    2: { icon: 'workspace_premium', color: 'purple', description: 'Büyüyen işletmeler için çoklu şube desteği ve gelişmiş özellikler.' },
    3: { icon: 'business_center', color: 'gold', description: 'Sınırsız özellikler, API erişimi ve özel destek.' },
  };

  ngOnInit(): void {
    this.loadPlans();
  }

  // ─── Data loading ────────────────────────────────────────────────────────────
  loadPlans(): void {
    this.isLoading.set(true);
    this.platformAdminService.getPlans().subscribe({
      next: (data) => {
        this.plans.set(data.map(p => this.mapApiPlan(p)));
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Hata', 'Planlar yüklenemedi.');
        this.isLoading.set(false);
      },
    });
  }

  private mapApiPlan(p: SubscriptionPlanOptionDto): SubscriptionPlan {
    const defaults = this.planDefaults[p.plan] || this.planDefaults[1];
    const annualPrice = Math.round(p.monthlyPrice * 0.83);
    return {
      id: String(p.plan),
      name: p.name,
      description: defaults.description,
      icon: defaults.icon,
      monthlyPrice: p.monthlyPrice,
      annualPrice,
      annualDiscountPercent: 17,
      isPopular: p.plan === 2,
      isActive: p.isActive,
      sortOrder: p.plan,
      color: defaults.color,
      permissions: this.getDefaultPermissions(p.plan, p.features),
      limits: {
        maxBranches: p.plan === 3 ? -1 : p.plan === 2 ? 3 : 1,
        maxUsers: p.maxUsers,
        maxProducts: p.plan === 3 ? -1 : p.plan === 2 ? 10000 : 2000,
        maxTransactionsPerMonth: p.plan === 3 ? -1 : p.plan === 2 ? 30000 : 5000,
      },
      subscriberCount: 0,
      monthlyRevenue: 0,
    };
  }

  private getDefaultPermissions(plan: number, features?: string[]): PlanPermissions {
    const base: PlanPermissions = {
      pos: plan >= 1, stockManagement: plan >= 1, stockMovements: plan >= 1,
      cariAccounts: plan >= 2, eFatura: plan >= 2, eArsiv: plan >= 2,
      purchaseOrders: plan >= 2, salesOrders: plan >= 1, basicReports: plan >= 1,
      advancedReports: plan >= 2, multiBranch: plan >= 2, multiWarehouse: plan >= 2,
      apiAccess: plan >= 3, companyManagement: plan >= 3,
    };
    return base;
  }

  // ─── Edit modal ──────────────────────────────────────────────────────────────
  openEdit(plan: SubscriptionPlan): void {
    this.editingPlan.set(plan);
    this.editForm = {
      name: plan.name,
      description: plan.description,
      icon: plan.icon,
      color: plan.color,
      monthlyPrice: plan.monthlyPrice,
      annualPrice: plan.annualPrice,
      annualDiscountPercent: plan.annualDiscountPercent,
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      permissions: { ...plan.permissions },
      limits: { ...plan.limits },
    };
    this.showEditModal.set(true);
  }

  closeEdit(): void {
    this.showEditModal.set(false);
    this.editingPlan.set(null);
  }

  saveEdit(): void {
    const plan = this.editingPlan();
    if (!plan) return;

    this.isSaving.set(true);

    // Calculate annual discount percent from prices if monthly is set
    if (this.editForm.monthlyPrice && this.editForm.annualPrice) {
      const discount = Math.round(
        ((this.editForm.monthlyPrice - this.editForm.annualPrice) /
          this.editForm.monthlyPrice) *
          100
      );
      this.editForm.annualDiscountPercent = discount > 0 ? discount : 0;
    }

    const planEnum = parseInt(plan.id, 10);
    this.platformAdminService.updatePlan(planEnum, {
      displayName: this.editForm.name,
      monthlyPrice: this.editForm.monthlyPrice || 0,
      maxUsers: this.editForm.limits.maxUsers,
      isActive: this.editForm.isActive ?? true,
      features: Object.entries(this.editForm.permissions)
        .filter(([_, v]) => v)
        .map(([k]) => k),
    }).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.loadPlans();
        this.closeEdit();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toastService.error('Hata', 'Plan kaydedilemedi.');
      },
    });
  }

  // ─── Permission toggles ──────────────────────────────────────────────────────
  togglePermission(key: keyof PlanPermissions): void {
    this.editForm.permissions = {
      ...this.editForm.permissions,
      [key]: !this.editForm.permissions[key],
    };
  }

  // ─── Quick toggles on card ────────────────────────────────────────────────────
  togglePopular(plan: SubscriptionPlan): void {
    // Popular flag is frontend-only, toggle locally
    this.plans.update(list => list.map(p =>
      p.id === plan.id ? { ...p, isPopular: !p.isPopular } : p
    ));
  }

  toggleActive(plan: SubscriptionPlan): void {
    const planEnum = parseInt(plan.id, 10);
    this.platformAdminService.updatePlan(planEnum, {
      displayName: plan.name,
      monthlyPrice: plan.monthlyPrice,
      maxUsers: plan.limits.maxUsers,
      isActive: !plan.isActive,
    }).subscribe({
      next: () => this.loadPlans(),
      error: () => this.toastService.error('Hata', 'Güncelleme başarısız.'),
    });
  }

  // ─── Utility helpers ─────────────────────────────────────────────────────────
  formatCurrency(n: number | undefined): string {
    if (n === undefined || n === null) return '₺0';
    return '₺' + n.toLocaleString('tr-TR');
  }

  getPlanColor(color: string): string {
    switch (color) {
      case 'blue':
        return 'linear-gradient(90deg, #4c6ef5, #3b5bdb)';
      case 'purple':
        return 'linear-gradient(90deg, #7950f2, #6741d9)';
      case 'gold':
        return 'linear-gradient(90deg, #f59f00, #e67700)';
      default:
        return 'linear-gradient(90deg, #4c6ef5, #3b5bdb)';
    }
  }

  getPlanIconGradient(color: string): string {
    switch (color) {
      case 'blue':
        return 'linear-gradient(135deg, #4c6ef5, #3b5bdb)';
      case 'purple':
        return 'linear-gradient(135deg, #7950f2, #6741d9)';
      case 'gold':
        return 'linear-gradient(135deg, #f59f00, #e67700)';
      default:
        return 'linear-gradient(135deg, #4c6ef5, #3b5bdb)';
    }
  }

  getPermissionCount(plan: SubscriptionPlan): number {
    return Object.values(plan.permissions).filter(Boolean).length;
  }

  countActivePermissions(perms: PlanPermissions): number {
    return Object.values(perms).filter(Boolean).length;
  }

  limitLabel(v: number): string {
    return v === -1 ? 'Sınırsız' : String(v);
  }

  calcDiscountPercent(): number {
    const monthly = this.editForm.monthlyPrice ?? 0;
    const annual = this.editForm.annualPrice ?? 0;
    if (!monthly || monthly <= 0) return 0;
    const discount = Math.round(((monthly - annual) / monthly) * 100);
    return discount > 0 ? discount : 0;
  }

  trackById(_: number, plan: SubscriptionPlan): string {
    return plan.id;
  }

  trackByKey(_: number, key: string): string {
    return key;
  }
}
