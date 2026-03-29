import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import { RevenueAnalytics, MonthlyRevenueTrend } from '../../../core/models/revenue.model';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent implements OnInit {
  private platformAdminService = inject(PlatformAdminService);

  isLoading = signal<boolean>(true);
  analytics = signal<RevenueAnalytics | null>(null);
  selectedPeriod = signal<'6m' | '12m'>('12m');

  ngOnInit(): void {
    this.platformAdminService.getRevenueSummary().subscribe({
      next: (summary) => {
        const totalMrr = summary.totalMonthlyRevenue;
        const byPlan = (summary.breakdown || []).map(bp => {
          const planColors: Record<string, string> = { '1': '#f97316', '2': '#e11d48', '3': '#f59f00' };
          const planNames: Record<string, string> = { '1': 'Starter', '2': 'Pro', '3': 'Enterprise' };
          const planKey = bp.plan || '1';
          return {
            planId: planKey,
            planName: planNames[planKey] || bp.plan || 'Plan',
            color: planColors[planKey] || '#5c7cfa',
            subscriberCount: bp.subscriberCount,
            mrr: bp.revenue,
            percentage: totalMrr > 0 ? (bp.revenue / totalMrr) * 100 : 0,
          };
        });
        const totalSubs = byPlan.reduce((s, p) => s + p.subscriberCount, 0);

        this.analytics.set({
          stats: {
            mrr: totalMrr,
            arr: totalMrr * 12,
            totalSubscribers: totalSubs,
            activeSubscribers: totalSubs,
            activeTrials: 0,
            cancelledThisMonth: 0,
            churnRate: 0,
            growthRate: 0,
            arpu: totalSubs > 0 ? Math.round(totalMrr / totalSubs) : 0,
            ltv: 0,
            mrrChange: 0,
            subscriberChange: 0,
          },
          byPlan,
          monthlyTrend: [],
          dailySignups: [],
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Gelir analitik verileri yüklenirken hata:', err.error?.detail || err.message);
        this.isLoading.set(false);
      },
    });
  }

  // ─── Filtered trend ──────────────────────────────────────────────────────────

  get filteredTrend(): MonthlyRevenueTrend[] {
    const trend = this.analytics()?.monthlyTrend ?? [];
    const months = this.selectedPeriod() === '6m' ? 6 : 12;
    return trend.slice(-months);
  }

  // ─── Max revenue for bar chart scaling ───────────────────────────────────────

  get maxRevenue(): number {
    const trend = this.filteredTrend;
    if (!trend.length) return 1;
    return Math.max(...trend.map((m) => m.revenue));
  }

  // ─── Bar height percentage ────────────────────────────────────────────────────

  barHeight(value: number): number {
    const max = this.maxRevenue;
    if (!max) return 0;
    const pct = (value / max) * 92; // leave 8% top padding
    return Math.max(pct, 2); // minimum visible bar
  }

  // ─── Currency formatters ─────────────────────────────────────────────────────

  /**
   * Format number as ₺ with Turkish dot-separated thousands.
   * 892743 → ₺892.743
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
   * Short format: 892743 → ₺892K  |  10712916 → ₺10,7M
   */
  formatK(value: number): string {
    if (value == null || isNaN(value)) return '₺0';
    if (value >= 1_000_000) {
      return `₺${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    }
    if (value >= 1_000) {
      return `₺${Math.round(value / 1_000)}K`;
    }
    return `₺${value}`;
  }

  // ─── Period selector ─────────────────────────────────────────────────────────

  changePeriod(p: '6m' | '12m'): void {
    this.selectedPeriod.set(p);
  }

  // ─── Percentage helpers ──────────────────────────────────────────────────────

  formatPercent(value: number): string {
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('tr-TR');
  }

  // ─── Math proxy (templates cannot access global Math directly) ──────────────

  readonly Math = Math;

  // ─── Plan color helper ───────────────────────────────────────────────────────

  getPlanGradient(planId: string): string {
    const map: Record<string, string> = {
      starter: 'linear-gradient(135deg, #f97316, #ea580c)',
      pro: 'linear-gradient(135deg, #e11d48, #be123c)',
      enterprise: 'linear-gradient(135deg, #f59f00, #e67700)',
    };
    return map[planId?.toLowerCase()] ?? 'linear-gradient(135deg, #f97316, #ea580c)';
  }

  /**
   * CSS conic-gradient string for the percentage ring.
   */
  planRingGradient(planId: string, percentage: number): string {
    const colors: Record<string, string> = {
      starter: '#f97316',
      pro: '#e11d48',
      enterprise: '#f59f00',
    };
    const color = colors[planId?.toLowerCase()] ?? '#f97316';
    return `conic-gradient(${color} 0% ${percentage.toFixed(2)}%, #2a1f14 ${percentage.toFixed(2)}% 100%)`;
  }

  // ─── KPI change class ────────────────────────────────────────────────────────

  changeClass(value: number): string {
    if (value > 0) return 'change-positive';
    if (value < 0) return 'change-negative';
    return 'change-neutral';
  }

  changeIcon(value: number): string {
    if (value > 0) return 'trending_up';
    if (value < 0) return 'trending_down';
    return 'trending_flat';
  }
}
