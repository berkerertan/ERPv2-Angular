import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RevenueService } from '../../../core/services/revenue.service';
import {
  AdminDashboardStats,
  RecentActivity,
  AdminAlert,
  RevenueByPlan,
} from '../../../core/models/revenue.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit {
  isLoading = signal<boolean>(true);
  stats = signal<AdminDashboardStats | null>(null);
  error = signal<string | null>(null);

  /** IDs of alerts the user has dismissed locally */
  private dismissedAlerts = signal<Set<string>>(new Set());

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.revenueService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Dashboard stats yüklenirken hata oluştu:', err);
        this.error.set('Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
        this.isLoading.set(false);
      },
    });
  }

  onRefresh(): void {
    this.loadStats();
  }

  // ─── Formatting helpers ──────────────────────────────────────────────────────

  /**
   * Format a number as Turkish Lira (₺) with period-separated thousands.
   * Examples: 892743 → ₺892.743  |  134550 → ₺134.550
   */
  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) return '₺0';
    const formatted = value.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `₺${formatted}`;
  }

  /**
   * Format a percentage with a leading + for positive values.
   * Examples: 8.7 → +8.7%  |  -2.3 → -2.3%
   */
  formatPercentage(value: number): string {
    if (value == null || isNaN(value)) return '0%';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  /**
   * Format a plain number with thousand separators.
   */
  formatNumber(value: number): string {
    if (value == null || isNaN(value)) return '0';
    return value.toLocaleString('tr-TR');
  }

  /**
   * Today's date formatted for the page header, e.g. "11 Mart 2026, Çarşamba"
   */
  getTodayLabel(): string {
    return new Date().toLocaleDateString('tr-TR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Returns a time-based greeting.
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return 'İyi Geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi Günler';
    return 'İyi Akşamlar';
  }

  // ─── Plan helpers ────────────────────────────────────────────────────────────

  /**
   * Returns a CSS colour variable or hex value for a given plan ID.
   */
  getPlanColor(planId: string): string {
    const map: Record<string, string> = {
      starter: '#6366f1',
      pro: '#8b5cf6',
      enterprise: '#a855f7',
    };
    return map[planId?.toLowerCase()] ?? 'var(--primary-500)';
  }

  /**
   * Returns a badge CSS class for a given plan ID.
   */
  getPlanBadgeClass(plan: string): string {
    const map: Record<string, string> = {
      starter: 'badge-info',
      pro: 'badge-primary',
      enterprise: 'badge-warning',
    };
    return map[plan?.toLowerCase()] ?? 'badge-info';
  }

  /**
   * Returns the localised display name for a plan ID.
   */
  getPlanLabel(plan: string): string {
    const map: Record<string, string> = {
      starter: 'Starter',
      pro: 'Pro',
      enterprise: 'Enterprise',
    };
    return map[plan?.toLowerCase()] ?? plan;
  }

  // ─── Churn rate colour ───────────────────────────────────────────────────────

  /**
   * Returns a CSS class for the churn rate value badge.
   * Red > 3%, Yellow 2-3%, Green < 2%
   */
  getChurnClass(rate: number): string {
    if (rate > 3) return 'churn-danger';
    if (rate >= 2) return 'churn-warning';
    return 'churn-success';
  }

  // ─── Recent activity helpers ─────────────────────────────────────────────────

  /**
   * Returns a Material Icon name for a given activity action.
   */
  getActionIcon(action: RecentActivity['action']): string {
    const map: Record<string, string> = {
      signup: 'person_add',
      upgrade: 'arrow_upward',
      downgrade: 'arrow_downward',
      cancel: 'cancel',
      reactivate: 'refresh',
    };
    return map[action] ?? 'info';
  }

  /**
   * Returns a human-readable Turkish label for a given activity action.
   */
  getActionLabel(action: RecentActivity['action']): string {
    const map: Record<string, string> = {
      signup: 'Kayıt',
      upgrade: 'Yükseltme',
      downgrade: 'Düşürme',
      cancel: 'İptal',
      reactivate: 'Yeniden Aktif',
    };
    return map[action] ?? action;
  }

  /**
   * Returns a CSS class for the action chip colour.
   */
  getActionChipClass(action: RecentActivity['action']): string {
    const map: Record<string, string> = {
      signup: 'chip-success',
      upgrade: 'chip-primary',
      downgrade: 'chip-warning',
      cancel: 'chip-danger',
      reactivate: 'chip-info',
    };
    return map[action] ?? 'chip-info';
  }

  // ─── Alert helpers ───────────────────────────────────────────────────────────

  /**
   * Returns a CSS class string for an alert item based on its type.
   */
  getAlertClass(type: AdminAlert['type']): string {
    const map: Record<string, string> = {
      warning: 'alert-warning',
      danger: 'alert-danger',
      success: 'alert-success',
      info: 'alert-info',
    };
    return map[type] ?? 'alert-info';
  }

  /**
   * Returns a Material Icon name for an alert type.
   */
  getAlertIcon(type: AdminAlert['type']): string {
    const map: Record<string, string> = {
      warning: 'warning_amber',
      danger: 'error_outline',
      success: 'check_circle_outline',
      info: 'info_outline',
    };
    return map[type] ?? 'info_outline';
  }

  /**
   * Dismisses an alert from the visible list (local only, no API call).
   */
  dismissAlert(alertId: string): void {
    const current = new Set(this.dismissedAlerts());
    current.add(alertId);
    this.dismissedAlerts.set(current);
  }

  /**
   * Returns the alerts that have not yet been locally dismissed.
   */
  getVisibleAlerts(alerts: AdminAlert[]): AdminAlert[] {
    const dismissed = this.dismissedAlerts();
    return alerts.filter((a) => !dismissed.has(a.id));
  }

  // ─── Date formatting ─────────────────────────────────────────────────────────

  /**
   * Returns a relative time label in Turkish:
   *   "X dakika önce" / "X saat önce" / "X gün önce" / "X ay önce"
   */
  formatDate(dateStr: string): string {
    if (!dateStr) return '';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHour = Math.floor(diffMs / 3_600_000);
    const diffDay = Math.floor(diffMs / 86_400_000);
    const diffMonth = Math.floor(diffDay / 30);

    if (diffMin < 1) return 'Az önce';
    if (diffMin < 60) return `${diffMin} dakika önce`;
    if (diffHour < 24) return `${diffHour} saat önce`;
    if (diffDay < 30) return `${diffDay} gün önce`;
    return `${diffMonth} ay önce`;
  }

  // ─── MRR change badge class ──────────────────────────────────────────────────

  getMrrChangeClass(change: number): string {
    if (change > 0) return 'badge-success';
    if (change < 0) return 'badge-danger';
    return 'badge-info';
  }
}
