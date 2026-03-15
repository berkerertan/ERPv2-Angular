import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReportService, SalesReportItem, StockReportItem } from '../../core/services/report.service';
import { SalesOrderService } from '../../core/services/sales-order.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import { ProductService } from '../../core/services/product.service';
import { SalesOrder, OrderStatus } from '../../core/models/sales-order.model';
import { forkJoin } from 'rxjs';

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

    quickActions = [
        { label: 'Hızlı Satış', icon: 'point_of_sale', route: '/pos', color: 'primary' },
        { label: 'Yeni Ürün', icon: 'add_box', route: '/products', color: 'success' },
        { label: 'Stok Girişi', icon: 'input', route: '/stock-movements', color: 'warning' },
        { label: 'Cari Ekle', icon: 'person_add', route: '/cari-accounts', color: 'info' },
    ];

    ngOnInit(): void {
        this.loadDashboardData();
    }

    private loadDashboardData(): void {
        // Load KPI data in parallel
        forkJoin({
            sales: this.reportService.getSalesReport(),
            orders: this.salesOrderService.getAll(),
            products: this.productService.getAll(),
            caris: this.cariService.getAll()
        }).subscribe({
            next: ({ sales, orders, products, caris }) => {
                // Total sales amount
                const totalSales = sales.reduce((s, r) => s + r.totalAmount, 0);
                this.kpiCards[0].value = '₺' + totalSales.toLocaleString('tr-TR');

                // Order count
                this.kpiCards[1].value = orders.length.toLocaleString('tr-TR');

                // Product count
                this.kpiCards[2].value = products.length.toLocaleString('tr-TR');

                // Active cari count
                this.kpiCards[3].value = caris.length.toLocaleString('tr-TR');

                // Recent orders (last 5)
                const sorted = [...orders].sort((a, b) =>
                    new Date(b.orderDateUtc).getTime() - new Date(a.orderDateUtc).getTime()
                );
                this.recentOrders = sorted.slice(0, 5).map(o => ({
                    id: o.orderNo || o.id.substring(0, 8),
                    customer: o.customerCariAccountId.substring(0, 8) + '...',
                    amount: '₺' + o.totalAmount.toLocaleString('tr-TR'),
                    status: this.mapOrderStatus(o.status),
                    date: o.orderDateUtc.split('T')[0]
                }));
            },
            error: () => {} // Keep fallback values on error
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
