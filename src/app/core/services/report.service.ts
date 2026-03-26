import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReportFilter {
    startDate?: string;
    endDate?: string;
    warehouseId?: string;
    cariAccountId?: string;
    category?: string;
}

export interface StockReportItem {
    productId: string;
    productName: string;
    barcode: string;
    warehouseName: string;
    balance: number;
    unit: string;
    totalValue: number;
}

export interface SalesReportItem {
    date: string;
    orderCount: number;
    totalAmount: number;
    topProduct: string;
}

export interface IncomeExpenseReport {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    items: {
        date: string;
        income: number;
        expense: number;
    }[];
}

export interface CariBalanceReport {
    cariAccountId: string;
    name: string;
    type: string;
    balance: number;
    lastTransaction: string;
}

export interface CariAgingReport {
    cariAccountId: string;
    name: string;
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
}

export interface PurchaseReportItem {
    date: string;
    orderCount: number;
    totalAmount: number;
    topSupplier: string;
}

export interface CashFlowForecastDto {
    date: string;
    expectedIn: number;
    expectedOut: number;
    net: number;
}

export interface DueListItemDto {
    cariAccountId: string;
    cariCode?: string;
    cariName?: string;
    dueDate: string;
    openAmount: number;
    overdueDays: number;
}

export interface ProductProfitabilityDto {
    productId: string;
    productCode?: string;
    productName?: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
}

export interface CustomerProfitabilityDto {
    cariAccountId: string;
    cariCode?: string;
    cariName?: string;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
}

export interface BranchProfitabilityDto {
    branchId: string;
    branchCode?: string;
    branchName?: string;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
}

/** Dashboard KPI özeti — GET /api/reports/dashboard-summary */
export interface DashboardSummaryDto {
    totalSalesAmount: number;
    totalOrderCount: number;
    totalProductCount: number;
    totalActiveCariCount: number;
    totalBankBalance: number;
    totalCashBalance: number;
    overdueReceivables: number;
    overdueCheckNoteCount: number;
    pendingQuoteCount: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
    private readonly apiUrl = `${environment.apiUrl}/api/reports`;

    constructor(private http: HttpClient) { }

    /** Stok raporu — depo bazlı ürün stok durumu */
    getStockReport(filter?: ReportFilter): Observable<StockReportItem[]> {
        return this.http.get<StockReportItem[]>(`${this.apiUrl}/stock`, {
            params: this.buildParams(filter)
        });
    }

    /** Satış raporu — tarih bazlı satış analizi */
    getSalesReport(filter?: ReportFilter): Observable<SalesReportItem[]> {
        return this.http.get<SalesReportItem[]>(`${this.apiUrl}/sales`, {
            params: this.buildParams(filter)
        });
    }

    /** Satın alma raporu — tedarikçi bazlı */
    getPurchasesReport(filter?: ReportFilter): Observable<PurchaseReportItem[]> {
        return this.http.get<PurchaseReportItem[]>(`${this.apiUrl}/purchases`, {
            params: this.buildParams(filter)
        });
    }

    /** Cari bakiye raporu */
    getCariBalances(filter?: ReportFilter): Observable<CariBalanceReport[]> {
        return this.http.get<CariBalanceReport[]>(`${this.apiUrl}/cari-balances`, {
            params: this.buildParams(filter)
        });
    }

    /** Cari yaşlandırma raporu — vade bazlı alacak analizi */
    getCariAging(filter?: ReportFilter): Observable<CariAgingReport[]> {
        return this.http.get<CariAgingReport[]>(`${this.apiUrl}/cari-aging`, {
            params: this.buildParams(filter)
        });
    }

    /** Gelir-gider raporu */
    getIncomeExpense(filter?: ReportFilter): Observable<IncomeExpenseReport> {
        return this.http.get<IncomeExpenseReport>(`${this.apiUrl}/income-expense`, {
            params: this.buildParams(filter)
        });
    }

    /** Nakit akışı tahmini */
    getCashFlowForecast(days?: number): Observable<CashFlowForecastDto[]> {
        let params = new HttpParams();
        if (days) params = params.set('days', days.toString());
        return this.http.get<CashFlowForecastDto[]>(`${this.apiUrl}/finance/cash-flow-forecast`, { params });
    }

    /** Vade listesi */
    getDueList(days?: number): Observable<DueListItemDto[]> {
        let params = new HttpParams();
        if (days) params = params.set('days', days.toString());
        return this.http.get<DueListItemDto[]>(`${this.apiUrl}/finance/due-list`, { params });
    }

    /** Ürün kârlılık analizi */
    getProductProfitability(startDateUtc?: string, endDateUtc?: string): Observable<ProductProfitabilityDto[]> {
        return this.http.get<ProductProfitabilityDto[]>(`${this.apiUrl}/finance/profitability/products`, {
            params: this.buildParams({ startDateUtc, endDateUtc })
        });
    }

    /** Müşteri kârlılık analizi */
    getCustomerProfitability(startDateUtc?: string, endDateUtc?: string): Observable<CustomerProfitabilityDto[]> {
        return this.http.get<CustomerProfitabilityDto[]>(`${this.apiUrl}/finance/profitability/customers`, {
            params: this.buildParams({ startDateUtc, endDateUtc })
        });
    }

    /** Şube kârlılık analizi */
    getBranchProfitability(startDateUtc?: string, endDateUtc?: string): Observable<BranchProfitabilityDto[]> {
        return this.http.get<BranchProfitabilityDto[]>(`${this.apiUrl}/finance/profitability/branches`, {
            params: this.buildParams({ startDateUtc, endDateUtc })
        });
    }

    /** Dashboard KPI özeti — tüm modülleri tek seferde yükler */
    getDashboardSummary(): Observable<DashboardSummaryDto> {
        return this.http.get<DashboardSummaryDto>(`${this.apiUrl}/dashboard-summary`);
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
