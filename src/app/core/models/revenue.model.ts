/** Gelir ve analitik modelleri */

export interface RevenueStats {
    mrr: number;                      // Monthly Recurring Revenue
    arr: number;                      // Annual Recurring Revenue
    totalSubscribers: number;
    activeSubscribers: number;
    activeTrials: number;
    cancelledThisMonth: number;
    churnRate: number;                // Yüzde
    growthRate: number;               // Yüzde (aylık)
    arpu: number;                     // Average Revenue Per User
    ltv: number;                      // Lifetime Value (tahmini)
    mrrChange: number;                // Önceki aya göre değişim (yüzde)
    subscriberChange: number;         // Önceki aya göre değişim (yüzde)
}

export interface RevenueByPlan {
    planId: string;
    planName: string;
    color: string;
    subscriberCount: number;
    mrr: number;
    percentage: number;
}

export interface MonthlyRevenueTrend {
    month: string;           // 'Oca 2025'
    revenue: number;
    subscribers: number;
    newSubscribers: number;
    churned: number;
}

export interface DailySignup {
    date: string;
    count: number;
}

export interface RevenueAnalytics {
    stats: RevenueStats;
    byPlan: RevenueByPlan[];
    monthlyTrend: MonthlyRevenueTrend[];
    dailySignups: DailySignup[];
}

export interface AdminDashboardStats {
    revenue: RevenueStats;
    byPlan: RevenueByPlan[];
    recentSubscribers: RecentActivity[];
    alerts: AdminAlert[];
    todaySignups: number;
    todayRevenue: number;
}

export interface RecentActivity {
    id: string;
    tenantId: string;
    companyName: string;
    ownerName: string;
    plan: string;
    action: 'signup' | 'upgrade' | 'downgrade' | 'cancel' | 'reactivate';
    timestamp: string;
}

export interface AdminAlert {
    id: string;
    type: 'warning' | 'info' | 'danger' | 'success';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}
