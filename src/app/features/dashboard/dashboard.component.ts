import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService, DashboardSummaryDto, StockReportItem } from '../../core/services/report.service';
import { SalesOrderService } from '../../core/services/sales-order.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { ProductService } from '../../core/services/product.service';
import { SalesOrder, OrderStatus } from '../../core/models/sales-order.model';
import { Product } from '../../core/models/product.model';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    private reportService = inject(ReportService);
    private salesOrderService = inject(SalesOrderService);
    private cariService = inject(CariAccountService);
    private productService = inject(ProductService);

    kpiCards = [
        { title: 'Toplam Satış', value: '—', change: '', changeType: 'positive', icon: 'trending_up', color: 'primary' },
        { title: 'Sipariş Sayısı', value: '—', change: '', changeType: 'positive', icon: 'shopping_cart', color: 'success' },
        { title: 'Stok Kalemleri', value: '—', change: '', changeType: 'positive', icon: 'inventory_2', color: 'warning' },
        { title: 'Aktif Cariler', value: '—', change: '', changeType: 'positive', icon: 'people', color: 'info' }
    ];

    recentOrders: { id: string; customer: string; amount: string; status: string; date: string }[] = [];
    lowStockItems: { name: string; balance: number; critical: number; unit: string; warehouse: string }[] = [];
    pendingQuoteCount = 0;

    // Treasury & Check-Notes summary (from dashboard-summary API)
    treasurySummary = { bankBalance: '—', cashBalance: '—', totalBalance: '—' };
    checkNoteSummary = { receivableTotal: '—', payableTotal: '—', overdueCount: 0 };

    quickActions = [
        { label: 'Hızlı Satış', icon: 'point_of_sale', route: '/pos', color: 'primary' },
        { label: 'Yeni Ürün', icon: 'add_box', route: '/products', color: 'success' },
        { label: 'Stok Girişi', icon: 'input', route: '/stock-movements', color: 'warning' },
        { label: 'Cari Ekle', icon: 'person_add', route: '/cari-accounts', color: 'info' },
    ];

    ngOnInit(): void {
        this.loadDashboardFromSummary();
        this.loadRecentOrders();
        this.loadLowStockAlerts();
    }

    /** Tüm KPI verisini tek API çağrısıyla al (GET /api/reports/dashboard-summary) */
    private loadDashboardFromSummary(): void {
        this.reportService.getDashboardSummary().pipe(
            catchError(() => of(null))
        ).subscribe(summary => {
            if (!summary) return;
            const fc = (n: number) => '₺' + Math.round(n).toLocaleString('tr-TR');

            this.kpiCards[0].value = fc(summary.totalSalesAmount);
            this.kpiCards[1].value = summary.totalOrderCount.toLocaleString('tr-TR');
            this.kpiCards[2].value = summary.totalProductCount.toLocaleString('tr-TR');
            this.kpiCards[3].value = summary.totalActiveCariCount.toLocaleString('tr-TR');

            this.treasurySummary = {
                bankBalance: fc(summary.totalBankBalance),
                cashBalance: fc(summary.totalCashBalance),
                totalBalance: fc(summary.totalBankBalance + summary.totalCashBalance)
            };

            this.checkNoteSummary = {
                receivableTotal: fc(summary.overdueReceivables),
                payableTotal: '—',
                overdueCount: summary.overdueCheckNoteCount
            };

            this.pendingQuoteCount = summary.pendingQuoteCount ?? 0;
        });
    }

    /** Son siparişleri ayrıca yükle (cari adları için cariService gerekiyor) */
    private loadRecentOrders(): void {
        forkJoin({
            orders: this.salesOrderService.getAll().pipe(catchError(() => of<SalesOrder[]>([]))),
            caris: this.cariService.getAll().pipe(catchError(() => of([])))
        }).subscribe(({ orders, caris }) => {
            const cariMap: Record<string, string> = {};
            caris.forEach(c => cariMap[c.id] = c.name);

            const sorted = [...orders].sort((a, b) =>
                new Date(b.orderDateUtc).getTime() - new Date(a.orderDateUtc).getTime()
            );
            this.recentOrders = sorted.slice(0, 5).map(o => ({
                id: o.orderNo || o.id.substring(0, 8),
                customer: cariMap[o.customerCariAccountId] || o.customerCariAccountId.substring(0, 8) + '...',
                amount: '₺' + o.totalAmount.toLocaleString('tr-TR'),
                status: this.mapOrderStatus(o.status),
                date: o.orderDateUtc.split('T')[0]
            }));
        });
    }

    /** Kritik stok seviyesinin altındaki ürünleri yükle */
    private loadLowStockAlerts(): void {
        forkJoin({
            stock: this.reportService.getStockReport().pipe(catchError(() => of<StockReportItem[]>([]))),
            products: this.productService.getAll().pipe(catchError(() => of<Product[]>([])))
        }).subscribe(({ stock, products }) => {
            const productMap: Record<string, Product> = {};
            products.forEach(p => productMap[p.id] = p);

            const alerts: typeof this.lowStockItems = [];
            for (const item of stock) {
                const product = productMap[item.productId];
                if (!product) continue;
                const critical = product.criticalStockLevel ?? 1;
                if (item.balance <= critical) {
                    alerts.push({
                        name: item.productName,
                        balance: item.balance,
                        critical,
                        unit: item.unit,
                        warehouse: item.warehouseName
                    });
                }
            }
            this.lowStockItems = alerts.slice(0, 5);
        });
    }

    private mapOrderStatus(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.Approved: return 'Approved';
            case OrderStatus.Draft: return 'Draft';
            case OrderStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    getStatusBadge(status: string): string {
        switch (status) {
            case 'Approved': return 'badge-success';
            case 'Draft': return 'badge-warning';
            case 'Cancelled': return 'badge-danger';
            default: return 'badge-info';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'Approved': return 'Onaylı';
            case 'Draft': return 'Taslak';
            case 'Cancelled': return 'İptal';
            default: return status;
        }
    }
}
