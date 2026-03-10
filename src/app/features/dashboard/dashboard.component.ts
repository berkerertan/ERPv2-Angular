import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
    // Mock KPI data — will be replaced with API calls
    kpiCards = [
        {
            title: 'Toplam Satış',
            value: '₺124,850',
            change: '+12.5%',
            changeType: 'positive',
            icon: 'trending_up',
            color: 'primary'
        },
        {
            title: 'Sipariş Sayısı',
            value: '342',
            change: '+8.2%',
            changeType: 'positive',
            icon: 'shopping_cart',
            color: 'success'
        },
        {
            title: 'Stok Kalemleri',
            value: '1,247',
            change: '-2.1%',
            changeType: 'negative',
            icon: 'inventory_2',
            color: 'warning'
        },
        {
            title: 'Aktif Cariler',
            value: '89',
            change: '+5.4%',
            changeType: 'positive',
            icon: 'people',
            color: 'info'
        }
    ];

    recentOrders = [
        { id: 'SIP-001', customer: 'Ahmet Yılmaz', amount: '₺3,240', status: 'Approved', date: '2026-03-08' },
        { id: 'SIP-002', customer: 'Mehmet Kaya', amount: '₺1,890', status: 'Draft', date: '2026-03-08' },
        { id: 'SIP-003', customer: 'Ayşe Demir', amount: '₺5,670', status: 'Approved', date: '2026-03-07' },
        { id: 'SIP-004', customer: 'Fatma Çelik', amount: '₺2,100', status: 'Cancelled', date: '2026-03-07' },
        { id: 'SIP-005', customer: 'Ali Öztürk', amount: '₺4,500', status: 'Approved', date: '2026-03-06' },
    ];

    quickActions = [
        { label: 'Hızlı Satış', icon: 'point_of_sale', route: '/pos', color: 'primary' },
        { label: 'Yeni Ürün', icon: 'add_box', route: '/products', color: 'success' },
        { label: 'Stok Girişi', icon: 'input', route: '/stock-movements', color: 'warning' },
        { label: 'Cari Ekle', icon: 'person_add', route: '/cari-accounts', color: 'info' },
    ];

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
