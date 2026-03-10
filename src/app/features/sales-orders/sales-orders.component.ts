import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-sales-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './sales-orders.component.html',
    styleUrls: ['./sales-orders.component.css', '../../shared/styles/crud-page.css']
})
export class SalesOrdersComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'Draft' | 'Approved' | 'Cancelled'>('all');
    showModal = signal(false);

    orders = signal([
        { id: '1', orderNumber: 'SIP-001', cariAccountName: 'Ahmet Yılmaz', status: 'Approved', totalAmount: 3240, createdAt: '2026-03-08' },
        { id: '2', orderNumber: 'SIP-002', cariAccountName: 'Mehmet Kaya', status: 'Draft', totalAmount: 1890, createdAt: '2026-03-08' },
        { id: '3', orderNumber: 'SIP-003', cariAccountName: 'Ayşe Demir', status: 'Approved', totalAmount: 5670, createdAt: '2026-03-07' },
        { id: '4', orderNumber: 'SIP-004', cariAccountName: 'Fatma Çelik', status: 'Cancelled', totalAmount: 2100, createdAt: '2026-03-07' },
        { id: '5', orderNumber: 'SIP-005', cariAccountName: 'Ali Öztürk', status: 'Draft', totalAmount: 14500, createdAt: '2026-03-06' },
    ]);

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
        this.orders.update(items => items.map(o => o.id === id ? { ...o, status: 'Approved' } : o));
    }

    deleteOrder(id: string): void {
        this.orders.update(items => items.filter(o => o.id !== id));
    }
}
