import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionPlanService } from '../../../core/services/subscription-plan.service';
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

  constructor(private planService: SubscriptionPlanService) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  // ─── Data loading ────────────────────────────────────────────────────────────
  loadPlans(): void {
    this.isLoading.set(true);
    this.planService.getPlans().subscribe({
      next: (data) => {
        this.plans.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
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

    const updatePayload = {
      name: this.editForm.name,
      description: this.editForm.description,
      icon: this.editForm.icon,
      color: this.editForm.color,
      monthlyPrice: this.editForm.monthlyPrice,
      annualPrice: this.editForm.annualPrice,
      annualDiscountPercent: this.editForm.annualDiscountPercent,
      isPopular: this.editForm.isPopular,
      isActive: this.editForm.isActive,
      sortOrder: this.editForm.sortOrder,
    };

    this.planService.updatePlan(plan.id, updatePayload).subscribe({
      next: () => {
        this.planService
          .updatePermissions(plan.id, this.editForm.permissions)
          .subscribe({
            next: () => {
              this.planService
                .updateLimits(plan.id, this.editForm.limits)
                .subscribe({
                  next: () => {
                    this.isSaving.set(false);
                    this.loadPlans();
                    this.closeEdit();
                  },
                  error: () => {
                    this.isSaving.set(false);
                  },
                });
            },
            error: () => {
              this.isSaving.set(false);
            },
          });
      },
      error: () => {
        this.isSaving.set(false);
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
    this.planService
      .updatePlan(plan.id, { isPopular: !plan.isPopular })
      .subscribe(() => this.loadPlans());
  }

  toggleActive(plan: SubscriptionPlan): void {
    this.planService
      .updatePlan(plan.id, { isActive: !plan.isActive })
      .subscribe(() => this.loadPlans());
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
