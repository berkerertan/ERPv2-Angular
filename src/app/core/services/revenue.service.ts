import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  RevenueStats,
  RevenueByPlan,
  MonthlyRevenueTrend,
  DailySignup,
  RevenueAnalytics,
  AdminDashboardStats,
  RecentActivity,
  AdminAlert,
} from '../models/revenue.model';

const TURKISH_MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

// ─── Plan pricing ────────────────────────────────────────────────────────────
// Starter  : 450 subscribers × ₺299/mo = ₺134,550
// Pro      : 680 subscribers × ₺699/mo = ₺475,320
// Enterprise: 95 subscribers
//   - 60 on annual plan billed monthly-equivalent: ₺1,799/mo (≈25% off ₺2,399) → 60 × ₺1,799 = ₺107,940
//   - 35 on monthly plan: 35 × ₺2,399 = ₺83,965
//   Enterprise MRR: ₺107,940 + ₺83,965 = ₺191,905  (total ≈ ₺282,405 with add-ons 95×₺952)
//   Simplified: 95 × ₺2,973 avg effective = ₺282,435 ≈ ₺282,405
// Total MRR: ₺134,550 + ₺475,320 + ₺282,405 = ₺892,275 ≈ ₺892,743 (incl. overage/add-ons)

const MOCK_STATS: RevenueStats = {
  mrr: 892_743,
  arr: 10_712_916,
  totalSubscribers: 1247,
  activeSubscribers: 1089,
  activeTrials: 98,
  cancelledThisMonth: 15,
  churnRate: 2.3,
  growthRate: 8.7,
  arpu: 719,
  ltv: 31_250,
  mrrChange: 8.7,
  subscriberChange: 12.4,
};

const MOCK_BY_PLAN: RevenueByPlan[] = [
  {
    planId: 'starter',
    planName: 'Starter',
    color: '#6366f1',
    subscriberCount: 450,
    mrr: 134_550,
    percentage: 15.07,
  },
  {
    planId: 'pro',
    planName: 'Pro',
    color: '#8b5cf6',
    subscriberCount: 680,
    mrr: 475_320,
    percentage: 53.24,
  },
  {
    planId: 'enterprise',
    planName: 'Enterprise',
    color: '#a855f7',
    subscriberCount: 95,
    mrr: 282_873,
    percentage: 31.69,
  },
];

// ─── Monthly trend — last 12 months ending March 2026 ──────────────────────
// The business shows consistent MoM growth from ~₺480k in Apr 2025 to ₺892k in Mar 2026
const MOCK_MONTHLY_TREND: MonthlyRevenueTrend[] = [
  { month: 'Nis 2025', revenue: 482_310, subscribers: 672,  newSubscribers: 61, churned: 9  },
  { month: 'May 2025', revenue: 521_840, subscribers: 718,  newSubscribers: 58, churned: 12 },
  { month: 'Haz 2025', revenue: 558_720, subscribers: 763,  newSubscribers: 57, churned: 12 },
  { month: 'Tem 2025', revenue: 594_150, subscribers: 806,  newSubscribers: 55, churned: 12 },
  { month: 'Ağu 2025', revenue: 625_480, subscribers: 843,  newSubscribers: 49, churned: 12 },
  { month: 'Eyl 2025', revenue: 661_930, subscribers: 886,  newSubscribers: 54, churned: 11 },
  { month: 'Eki 2025', revenue: 697_210, subscribers: 927,  newSubscribers: 52, churned: 11 },
  { month: 'Kas 2025', revenue: 733_540, subscribers: 966,  newSubscribers: 49, churned: 10 },
  { month: 'Ara 2025', revenue: 768_890, subscribers: 1002, newSubscribers: 46, churned: 10 },
  { month: 'Oca 2026', revenue: 805_320, subscribers: 1043, newSubscribers: 51, churned: 10 },
  { month: 'Şub 2026', revenue: 847_660, subscribers: 1089, newSubscribers: 56, churned: 10 },
  { month: 'Mar 2026', revenue: 892_743, subscribers: 1134, newSubscribers: 60, churned: 15 },
];

// ─── Daily signups — last 30 days (1 Mar 2026 → 11 Mar 2026 partial) ────────
function buildDailySignups(): DailySignup[] {
  const data: DailySignup[] = [];
  const base = new Date(2026, 1, 10); // Feb 10 2026

  const counts = [
    3, 5, 2, 4, 6, 3, 5, 7, 4, 3,
    6, 5, 4, 8, 3, 5, 4, 6, 7, 5,
    4, 3, 6, 8, 5, 4, 7, 6, 5, 4,
  ];

  for (let i = 0; i < 30; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    data.push({ date: `${yyyy}-${mm}-${dd}`, count: counts[i] });
  }

  return data;
}

const MOCK_DAILY_SIGNUPS: DailySignup[] = buildDailySignups();

// ─── Recent activities ────────────────────────────────────────────────────────
const MOCK_RECENT_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-001',
    tenantId: 'ten-1841',
    companyName: 'Yıldız Market Zinciri',
    ownerName: 'Kemal Yıldız',
    plan: 'enterprise',
    action: 'signup',
    timestamp: '2026-03-11T10:42:00Z',
  },
  {
    id: 'act-002',
    tenantId: 'ten-1839',
    companyName: 'Baran Tekstil A.Ş.',
    ownerName: 'Selin Baran',
    plan: 'pro',
    action: 'upgrade',
    timestamp: '2026-03-11T09:17:00Z',
  },
  {
    id: 'act-003',
    tenantId: 'ten-1802',
    companyName: 'Çelik Elektronik',
    ownerName: 'Murat Çelik',
    plan: 'starter',
    action: 'downgrade',
    timestamp: '2026-03-11T08:55:00Z',
  },
  {
    id: 'act-004',
    tenantId: 'ten-1798',
    companyName: 'Güneş Gıda Ltd.',
    ownerName: 'Fatih Güneş',
    plan: 'pro',
    action: 'cancel',
    timestamp: '2026-03-10T21:33:00Z',
  },
  {
    id: 'act-005',
    tenantId: 'ten-1763',
    companyName: 'Koç Mobilya',
    ownerName: 'Ayşe Koç',
    plan: 'pro',
    action: 'reactivate',
    timestamp: '2026-03-10T18:10:00Z',
  },
  {
    id: 'act-006',
    tenantId: 'ten-1840',
    companyName: 'Demir İnşaat Malzemeleri',
    ownerName: 'Hüseyin Demir',
    plan: 'starter',
    action: 'signup',
    timestamp: '2026-03-10T15:48:00Z',
  },
  {
    id: 'act-007',
    tenantId: 'ten-1835',
    companyName: 'Sarı Eczane Grubu',
    ownerName: 'Elif Sarı',
    plan: 'enterprise',
    action: 'upgrade',
    timestamp: '2026-03-10T13:22:00Z',
  },
  {
    id: 'act-008',
    tenantId: 'ten-1712',
    companyName: 'Kaya Otomotiv',
    ownerName: 'Tarık Kaya',
    plan: 'pro',
    action: 'cancel',
    timestamp: '2026-03-10T11:05:00Z',
  },
  {
    id: 'act-009',
    tenantId: 'ten-1838',
    companyName: 'Şahin Spor Malzemeleri',
    ownerName: 'Burak Şahin',
    plan: 'starter',
    action: 'signup',
    timestamp: '2026-03-10T09:41:00Z',
  },
  {
    id: 'act-010',
    tenantId: 'ten-1609',
    companyName: 'Aydın Kitabevi',
    ownerName: 'Zeynep Aydın',
    plan: 'starter',
    action: 'reactivate',
    timestamp: '2026-03-09T17:30:00Z',
  },
];

// ─── Admin alerts ─────────────────────────────────────────────────────────────
const MOCK_ALERTS: AdminAlert[] = [
  {
    id: 'alrt-001',
    type: 'warning',
    title: 'Yüksek Churn Riski',
    message: '23 abonenin son 14 gün içinde giriş yapmadığı tespit edildi. Otomatik hatırlatma e-postası gönderilmesi önerilir.',
    timestamp: '2026-03-11T06:00:00Z',
    isRead: false,
  },
  {
    id: 'alrt-002',
    type: 'danger',
    title: 'Ödeme Hatası',
    message: '7 Enterprise abonenin kredi kartı ödemesi bu ay başarısız oldu. Toplam risk: ₺16,793.',
    timestamp: '2026-03-10T23:15:00Z',
    isRead: false,
  },
  {
    id: 'alrt-003',
    type: 'success',
    title: 'Aylık Büyüme Hedefi Aşıldı',
    message: 'Mart 2026 için hedeflenen %7.5 MRR büyümesi aşıldı. Mevcut büyüme: %8.7.',
    timestamp: '2026-03-10T18:00:00Z',
    isRead: true,
  },
  {
    id: 'alrt-004',
    type: 'info',
    title: 'Yeni Fatura Dönemi',
    message: "238 Pro abonenin fatura yenileme tarihi 15 Mart 2026. Beklenen tahsilat: ₺166,362.",
    timestamp: '2026-03-09T09:00:00Z',
    isRead: true,
  },
];

@Injectable({
  providedIn: 'root',
})
export class RevenueService {
  private readonly MOCK_ANALYTICS: RevenueAnalytics = {
    stats: MOCK_STATS,
    byPlan: MOCK_BY_PLAN,
    monthlyTrend: MOCK_MONTHLY_TREND,
    dailySignups: MOCK_DAILY_SIGNUPS,
  };

  private readonly MOCK_DASHBOARD: AdminDashboardStats = {
    revenue: MOCK_STATS,
    byPlan: MOCK_BY_PLAN,
    recentSubscribers: MOCK_RECENT_ACTIVITIES,
    alerts: MOCK_ALERTS,
    todaySignups: 4,
    todayRevenue: 8_945,
  };

  getRevenueAnalytics(): Observable<RevenueAnalytics> {
    return of(this.MOCK_ANALYTICS).pipe(delay(320));
  }

  getDashboardStats(): Observable<AdminDashboardStats> {
    return of(this.MOCK_DASHBOARD).pipe(delay(280));
  }

  getMonthlyTrend(months: number): Observable<MonthlyRevenueTrend[]> {
    const sliced = MOCK_MONTHLY_TREND.slice(-Math.min(months, MOCK_MONTHLY_TREND.length));
    return of(sliced).pipe(delay(200));
  }

  getByPlan(): Observable<RevenueByPlan[]> {
    return of(MOCK_BY_PLAN).pipe(delay(180));
  }
}
