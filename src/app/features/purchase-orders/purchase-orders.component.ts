import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-purchase-orders',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './purchase-orders.component.html',
    styleUrls: ['./purchase-orders.component.css', '../../shared/styles/crud-page.css']
})
export class PurchaseOrdersComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'Draft' | 'Approved' | 'Cancelled'>('all');

    orders = signal([
        { id: '1', orderNumber: 'SAT-001', cariAccountName: 'Tedarik A.Ş.', status: 'Approved', totalAmount: 45000, createdAt: '2026-03-08' },
        { id: '2', orderNumber: 'SAT-002', cariAccountName: 'Global Elektronik', status: 'Draft', totalAmount: 22000, createdAt: '2026-03-07' },
        { id: '3', orderNumber: 'SAT-003', cariAccountName: 'Tedarik A.Ş.', status: 'Approved', totalAmount: 8500, createdAt: '2026-03-06' },
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

    approveOrder(id: string): void { this.orders.update(items => items.map(o => o.id === id ? { ...o, status: 'Approved' } : o)); }
    deleteOrder(id: string): void { this.orders.update(items => items.filter(o => o.id !== id)); }
}
