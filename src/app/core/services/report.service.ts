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
    getPurchasesReport(filter?: ReportFilter): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/purchases`, {
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

    private buildParams(filter?: ReportFilter): HttpParams {
        let params = new HttpParams();
        if (!filter) return params;
        Object.keys(filter).forEach(key => {
            const value = (filter as any)[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });
        return params;
    }
}
