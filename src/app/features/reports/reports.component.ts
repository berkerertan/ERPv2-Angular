import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    ReportService,
    StockReportItem,
    SalesReportItem,
    PurchaseReportItem,
    CariBalanceReport,
    CariAgingReport,
    IncomeExpenseReport
} from '../../core/services/report.service';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './reports.component.html',
    styleUrls: ['./reports.component.css', '../../shared/styles/crud-page.css']
})
export class ReportsComponent implements OnInit {
    private reportService = inject(ReportService);

    activeReport = signal<string>('stock');
    isLoading = signal(false);
    errorMessage = signal('');

    // Report data
    stockData = signal<StockReportItem[]>([]);
    salesData = signal<SalesReportItem[]>([]);
    purchasesData = signal<PurchaseReportItem[]>([]);
    cariBalancesData = signal<CariBalanceReport[]>([]);
    cariAgingData = signal<CariAgingReport[]>([]);
    incomeExpenseData = signal<IncomeExpenseReport | null>(null);

    reports = [
        { id: 'stock', label: 'Stok Raporu', icon: 'inventory', description: 'Depo bazlı stok durumu' },
        { id: 'sales', label: 'Satış Raporu', icon: 'shopping_cart', description: 'Satış analizleri ve trendler' },
        { id: 'purchases', label: 'Satın Alma Raporu', icon: 'local_shipping', description: 'Tedarikçi bazlı satın alma' },
        { id: 'cari-balances', label: 'Cari Bakiyeler', icon: 'account_balance_wallet', description: 'Cari hesap bakiyeleri' },
        { id: 'cari-aging', label: 'Cari Yaşlandırma', icon: 'schedule', description: 'Vade bazlı alacak analizi' },
        { id: 'income-expense', label: 'Gelir-Gider', icon: 'bar_chart', description: 'Gelir ve gider karşılaştırması' }
    ];

    ngOnInit(): void {
        this.loadReport('stock');
    }

    selectReport(id: string): void {
        this.activeReport.set(id);
        this.loadReport(id);
    }

    loadReport(id: string): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        switch (id) {
            case 'stock':
                this.reportService.getStockReport().subscribe({
                    next: (data) => { this.stockData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            case 'sales':
                this.reportService.getSalesReport().subscribe({
                    next: (data) => { this.salesData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            case 'purchases':
                this.reportService.getPurchasesReport().subscribe({
                    next: (data) => { this.purchasesData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            case 'cari-balances':
                this.reportService.getCariBalances().subscribe({
                    next: (data) => { this.cariBalancesData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            case 'cari-aging':
                this.reportService.getCariAging().subscribe({
                    next: (data) => { this.cariAgingData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            case 'income-expense':
                this.reportService.getIncomeExpense().subscribe({
                    next: (data) => { this.incomeExpenseData.set(data); this.isLoading.set(false); },
                    error: (err) => this.handleError(err)
                });
                break;
            default:
                this.isLoading.set(false);
        }
    }

    private handleError(err: any): void {
        this.errorMessage.set(err.error?.detail || 'Rapor yüklenirken bir hata oluştu.');
        this.isLoading.set(false);
    }

    formatCurrency(val: number): string {
        return '₺' + val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}
