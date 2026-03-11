import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RevenueService } from '../../../core/services/revenue.service';
import { RevenueAnalytics, MonthlyRevenueTrend } from '../../../core/models/revenue.model';

@Component({
  selector: 'app-revenue',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revenue.component.html',
  styleUrl: './revenue.component.css',
})
export class RevenueComponent implements OnInit {
  isLoading = signal<boolean>(true);
  analytics = signal<RevenueAnalytics | null>(null);
  selectedPeriod = signal<'6m' | '12m'>('12m');

  constructor(private revenueService: RevenueService) {}

  ngOnInit(): void {
    this.revenueService.getRevenueAnalytics().subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Gelir analitik verileri yüklenirken hata:', err);
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
      starter: 'linear-gradient(135deg, #6366f1, #4f46e5)',
      pro: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      enterprise: 'linear-gradient(135deg, #a855f7, #9333ea)',
    };
    return map[planId?.toLowerCase()] ?? 'linear-gradient(135deg, #5c7cfa, #4263eb)';
  }

  /**
   * CSS conic-gradient string for the percentage ring.
   * percentage 53.24 → "conic-gradient(#8b5cf6 0% 53.24%, #252736 53.24% 100%)"
   */
  planRingGradient(planId: string, percentage: number): string {
    const colors: Record<string, string> = {
      starter: '#6366f1',
      pro: '#8b5cf6',
      enterprise: '#a855f7',
    };
    const color = colors[planId?.toLowerCase()] ?? '#5c7cfa';
    return `conic-gradient(${color} 0% ${percentage.toFixed(2)}%, #252736 ${percentage.toFixed(2)}% 100%)`;
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
