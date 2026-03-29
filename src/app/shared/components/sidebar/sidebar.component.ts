import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface NavItem {
    icon: string;
    label: string;
    route: string;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

interface NavItemWithSection extends NavItem {
    sectionTitle: string;
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
    isCollapsed = signal(false);
    isMobileOpen = signal(false);
    isHoverExpanded = signal(false);
    searchQuery = signal('');

    private hoverLeaveTimer: ReturnType<typeof setTimeout> | null = null;

    /** Fare sidebar'a girdiğinde — sadece kapalıysa geçici aç */
    onMouseEnter(): void {
        if (!this.isCollapsed()) return;
        if (this.hoverLeaveTimer) {
            clearTimeout(this.hoverLeaveTimer);
            this.hoverLeaveTimer = null;
        }
        this.isHoverExpanded.set(true);
    }

    /** Fare sidebar'dan çıktığında — küçük gecikmeyle kapat */
    onMouseLeave(): void {
        if (!this.isCollapsed()) return;
        this.hoverLeaveTimer = setTimeout(() => {
            this.isHoverExpanded.set(false);
        }, 120);
    }

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
                { icon: 'inventory_2',   label: 'Ürünler',          route: '/products' },
                { icon: 'swap_horiz',    label: 'Stok Hareketleri', route: '/stock-movements' },
                { icon: 'fact_check',    label: 'Stok Sayımı',      route: '/inventory-count' },
                { icon: 'label',         label: 'Etiket Bas',       route: '/label-print' },
            ]
        },
        {
            title: 'Ticaret',
            items: [
                { icon: 'shopping_bag', label: 'Alıcılar', route: '/cari-accounts/buyers' },
                { icon: 'local_shipping', label: 'Tedarikçiler', route: '/cari-accounts/suppliers' },
                { icon: 'request_quote', label: 'Teklifler', route: '/quotes' },
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
            title: 'Finans & Muhasebe',
            items: [
                { icon: 'payments', label: 'Finans', route: '/finance-movements' },
                { icon: 'receipt_long', label: 'Çek/Senet Takibi', route: '/checks-bills' },
                { icon: 'account_balance_wallet', label: 'Banka & Kasa', route: '/treasury' },
                { icon: 'account_tree', label: 'Hesap Planı', route: '/chart-of-accounts' },
            ]
        },
        {
            title: 'Raporlar',
            items: [
                { icon: 'bar_chart', label: 'Raporlar', route: '/reports' },
                { icon: 'upload_file', label: 'Excel Import', route: '/excel-import' },
                { icon: 'manage_search', label: 'Aktivite Geçmişi', route: '/activity-log' },
            ]
        },
        {
            title: 'Hesap',
            items: [
                { icon: 'manage_accounts', label: 'Profil & Ayarlar', route: '/profile' },
            ]
        }
    ];

    /** Arama sorgusu varsa eşleşen menü öğelerini döner, yoksa null (= normal görünüm) */
    readonly filteredNav = computed<NavItemWithSection[] | null>(() => {
        const q = this.searchQuery().toLowerCase().trim();
        if (!q) return null;
        const results: NavItemWithSection[] = [];
        for (const section of this.navSections) {
            for (const item of section.items) {
                if (
                    item.label.toLowerCase().includes(q) ||
                    section.title.toLowerCase().includes(q)
                ) {
                    results.push({ ...item, sectionTitle: section.title });
                }
            }
        }
        return results;
    });

    /** Eşleşen kısmı <mark> ile wrap'ler */
    highlight(text: string): string {
        const q = this.searchQuery().trim();
        if (!q) return text;
        const idx = text.toLowerCase().indexOf(q.toLowerCase());
        if (idx === -1) return text;
        return (
            text.slice(0, idx) +
            `<mark class="nav-highlight">${text.slice(idx, idx + q.length)}</mark>` +
            text.slice(idx + q.length)
        );
    }

    clearSearch(): void {
        this.searchQuery.set('');
    }

    toggleCollapse(): void {
        this.isCollapsed.update(v => !v);
        if (this.isCollapsed()) this.clearSearch();
    }

    toggleMobile(): void {
        this.isMobileOpen.update(v => !v);
    }

    closeMobile(): void {
        this.isMobileOpen.set(false);
        this.clearSearch();
    }
}
