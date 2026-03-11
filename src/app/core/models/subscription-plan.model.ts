/** Abonelik Planı modelleri */

export interface PlanPermissions {
    pos: boolean;
    stockManagement: boolean;
    stockMovements: boolean;
    cariAccounts: boolean;
    eFatura: boolean;
    eArsiv: boolean;
    purchaseOrders: boolean;
    salesOrders: boolean;
    basicReports: boolean;
    advancedReports: boolean;
    multiBranch: boolean;
    multiWarehouse: boolean;
    apiAccess: boolean;
    companyManagement: boolean;
}

export interface PlanLimits {
    maxBranches: number;  // -1 = sınırsız
    maxUsers: number;     // -1 = sınırsız
    maxProducts: number;  // -1 = sınırsız
    maxTransactionsPerMonth: number; // -1 = sınırsız
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    description: string;
    icon: string;
    monthlyPrice: number;
    annualPrice: number;
    annualDiscountPercent: number;
    isPopular: boolean;
    isActive: boolean;
    sortOrder: number;
    color: 'blue' | 'purple' | 'gold';
    permissions: PlanPermissions;
    limits: PlanLimits;
    subscriberCount?: number;
    monthlyRevenue?: number;
}

export const PERMISSION_LABELS: Record<keyof PlanPermissions, string> = {
    pos: 'POS & Hızlı Satış',
    stockManagement: 'Stok Yönetimi',
    stockMovements: 'Stok Hareketleri',
    cariAccounts: 'Cari Hesaplar',
    eFatura: 'E-Fatura',
    eArsiv: 'E-Arşiv',
    purchaseOrders: 'Satın Alma Siparişleri',
    salesOrders: 'Satış Siparişleri',
    basicReports: 'Temel Raporlar',
    advancedReports: 'Gelişmiş Raporlar',
    multiBranch: 'Çoklu Şube',
    multiWarehouse: 'Çoklu Depo',
    apiAccess: 'API Erişimi',
    companyManagement: 'Şirket Yönetimi',
};

export const PERMISSION_ICONS: Record<keyof PlanPermissions, string> = {
    pos: 'point_of_sale',
    stockManagement: 'inventory_2',
    stockMovements: 'swap_horiz',
    cariAccounts: 'people',
    eFatura: 'receipt_long',
    eArsiv: 'archive',
    purchaseOrders: 'shopping_cart',
    salesOrders: 'sell',
    basicReports: 'bar_chart',
    advancedReports: 'analytics',
    multiBranch: 'store',
    multiWarehouse: 'warehouse',
    apiAccess: 'api',
    companyManagement: 'business',
};

export type CreatePlanRequest = Omit<SubscriptionPlan, 'id' | 'subscriberCount' | 'monthlyRevenue'>;
export type UpdatePlanRequest = Partial<CreatePlanRequest>;
