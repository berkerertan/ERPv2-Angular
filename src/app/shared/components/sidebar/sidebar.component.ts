import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
    icon: string;
    label: string;
    route: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    isCollapsed = signal(false);
    isMobileOpen = signal(false);

    navSections: NavSection[] = [
        {
            title: 'Ana Menü',
            items: [
                { icon: 'dashboard', label: 'Dashboard', route: '/dashboard' },
                { icon: 'point_of_sale', label: 'POS', route: '/pos' },
            ]
        },
        {
            title: 'Stok Yönetimi',
            items: [
                { icon: 'inventory_2', label: 'Ürünler', route: '/products' },
                { icon: 'swap_horiz', label: 'Stok Hareketleri', route: '/stock-movements' },
            ]
        },
        {
            title: 'Ticaret',
            items: [
                { icon: 'shopping_bag', label: 'Alıcılar', route: '/cari-accounts/buyers' },
                { icon: 'local_shipping', label: 'Tedarikçiler', route: '/cari-accounts/suppliers' },
                { icon: 'shopping_cart', label: 'Satış Siparişleri', route: '/sales-orders' },
                { icon: 'assignment_return', label: 'Satın Alma', route: '/purchase-orders' },
            ]
        },
        {
            title: 'Faturalar',
            items: [
                { icon: 'verified', label: 'E-Fatura', route: '/invoices/efatura' },
                { icon: 'inventory', label: 'E-Arşiv', route: '/invoices/earsiv' },
            ]
        },
        {
            title: 'Organizasyon',
            items: [
                { icon: 'business', label: 'Şirketler', route: '/companies' },
                { icon: 'store', label: 'Şubeler', route: '/branches' },
                { icon: 'warehouse', label: 'Depolar', route: '/warehouses' },
            ]
        },
        {
            title: 'Finans & Raporlar',
            items: [
                { icon: 'payments', label: 'Finans', route: '/finance-movements' },
                { icon: 'bar_chart', label: 'Raporlar', route: '/reports' },
            ]
        }
    ];

    toggleCollapse(): void {
        this.isCollapsed.update(v => !v);
    }

    toggleMobile(): void {
        this.isMobileOpen.update(v => !v);
    }

    closeMobile(): void {
        this.isMobileOpen.set(false);
    }
}
