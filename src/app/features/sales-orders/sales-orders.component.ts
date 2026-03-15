import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SalesOrderService } from '../../core/services/sales-order.service';
import { SalesOrder, OrderStatus } from '../../core/models/sales-order.model';

@Component({
    selector: 'app-sales-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sales-orders.component.html',
    styleUrls: ['./sales-orders.component.css', '../../shared/styles/crud-page.css']
})
export class SalesOrdersComponent implements OnInit {
    private salesOrderService = inject(SalesOrderService);

    searchTerm = '';
    activeTab = signal<'all' | 'Draft' | 'Approved' | 'Cancelled'>('all');
    showModal = signal(false);

    orders = signal<any[]>([]);

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(): void {
        this.salesOrderService.getAll().subscribe({
            next: (data) => this.orders.set(data.map(o => ({
                id: o.id,
                orderNumber: o.orderNo || o.id.substring(0, 8),
                cariAccountName: o.customerCariAccountId.substring(0, 8) + '...',
                status: this.mapStatus(o.status),
                totalAmount: o.totalAmount,
                createdAt: o.orderDateUtc.split('T')[0]
            }))),
            error: (err) => console.error('Siparişler yüklenemedi:', err.error?.detail || err.message)
        });
    }

    private mapStatus(status: OrderStatus): string {
        switch (status) {
            case OrderStatus.Approved: return 'Approved';
            case OrderStatus.Draft: return 'Draft';
            case OrderStatus.Cancelled: return 'Cancelled';
            default: return 'Draft';
        }
    }

    get filteredOrders() {
        let items = this.orders();
        const tab = this.activeTab();
        if (tab !== 'all') items = items.filter(o => o.status === tab);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(o => o.orderNumber.toLowerCase().includes(term) || o.cariAccountName.toLowerCase().includes(term));
        return items;
    }

    getStatusBadge(s: string) { return s === 'Approved' ? 'badge-success' : s === 'Draft' ? 'badge-warning' : 'badge-danger'; }
    getStatusLabel(s: string) { return s === 'Approved' ? 'Onaylı' : s === 'Draft' ? 'Taslak' : 'İptal'; }

    approveOrder(id: string): void {
        this.salesOrderService.approve(id).subscribe({
            next: () => this.loadOrders(),
            error: (err) => alert(err.error?.detail || 'Onaylama başarısız.')
        });
    }

    deleteOrder(id: string): void {
        if (!confirm('Bu siparişi silmek istediğinize emin misiniz?')) return;
        this.salesOrderService.delete(id).subscribe({
            next: () => this.loadOrders(),
            error: (err) => alert(err.error?.detail || 'Silme başarısız.')
        });
    }
}
