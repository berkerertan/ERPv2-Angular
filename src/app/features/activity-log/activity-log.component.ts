import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogService } from '../../core/services/activity-log.service';
import {
    TenantActivityLogDto,
    TenantActivitySummaryDto,
    TenantActivityFilter
} from '../../core/models/activity-log.model';

@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './activity-log.component.html',
    styleUrl: './activity-log.component.css'
})
export class ActivityLogComponent implements OnInit {
    private service = inject(ActivityLogService);

    isLoading  = signal(false);
    allLogs    = signal<TenantActivityLogDto[]>([]);
    summary    = signal<TenantActivitySummaryDto | null>(null);
    selected   = signal<TenantActivityLogDto | null>(null);

    searchTerm  = '';
    onlyErrors  = false;
    sortColumn  = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // Client-side search filter (API'de q parametresi yok)
    logs = computed(() => {
        const q = this.searchTerm.toLowerCase().trim();
        if (!q) return this.allLogs();
        return this.allLogs().filter(l =>
            (l.path || '').toLowerCase().includes(q)
        );
    });

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get sortedLogs() {
        let list = this.logs();
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            list = [...list].sort((a, b) => typeof (a as any)[col] === 'number' ? dir * ((a as any)[col] - (b as any)[col]) : dir * String((a as any)[col]).localeCompare(String((b as any)[col]), 'tr'));
        }
        return list;
    }

    fromDate    = '';
    toDate      = '';
    currentPage = 1;
    pageSize    = 50;

    ngOnInit(): void {
        this.loadSummary();
        this.loadLogs();
    }

    loadSummary(): void {
        this.service.getSummary({
            onlyErrors: this.onlyErrors || undefined,
            fromUtc: this.fromDate || undefined,
            toUtc:   this.toDate   || undefined,
        }).subscribe({
            next: d => this.summary.set(d),
            error: e => console.error(e)
        });
    }

    loadLogs(): void {
        this.isLoading.set(true);
        const filter: TenantActivityFilter = {
            onlyErrors: this.onlyErrors || undefined,
            fromUtc:    this.fromDate   || undefined,
            toUtc:      this.toDate     || undefined,
            page:       this.currentPage,
            pageSize:   this.pageSize,
        };
        this.service.getLogs(filter).subscribe({
            next: d => { this.allLogs.set(d); this.isLoading.set(false); },
            error: e => { this.isLoading.set(false); console.error(e); }
        });
    }

    onFilterChange(): void { this.currentPage = 1; this.loadSummary(); this.loadLogs(); }
    onPageChange(p: number): void { this.currentPage = p; this.loadLogs(); }

    viewDetail(log: TenantActivityLogDto): void { this.selected.set(log); }
    closeDetail(): void { this.selected.set(null); }

    toggleErrors(): void { this.onlyErrors = !this.onlyErrors; this.onFilterChange(); }

    // ── Kullanıcı dostu etiketler ─────────────────────────────────────────────

    getActionLabel(method?: string, path?: string): string {
        if (!method || !path) return 'İşlem';
        const m = method.toUpperCase();
        const p = path.toLowerCase();
        if (p.includes('/auth/login'))   return 'Giriş Yapıldı';
        if (p.includes('/auth/logout'))  return 'Çıkış Yapıldı';
        if (p.includes('/products') && p.includes('/suggest')) return 'Ürün Arama';
        if (p.includes('/products')    && m === 'POST')   return 'Ürün Eklendi';
        if (p.includes('/products')    && m === 'PUT')    return 'Ürün Güncellendi';
        if (p.includes('/products')    && m === 'DELETE') return 'Ürün Silindi';
        if (p.includes('/products')    && m === 'GET')    return 'Ürünler Görüntülendi';
        if (p.includes('/sales-orders') && p.includes('/approve')) return 'Satış Siparişi Onaylandı';
        if (p.includes('/sales-orders') && p.includes('/cancel'))  return 'Satış Siparişi İptal Edildi';
        if (p.includes('/sales-orders') && m === 'POST')   return 'Satış Siparişi Oluşturuldu';
        if (p.includes('/sales-orders') && m === 'DELETE') return 'Satış Siparişi Silindi';
        if (p.includes('/sales-orders') && m === 'GET')    return 'Satış Siparişleri Görüntülendi';
        if (p.includes('/purchase-orders') && p.includes('/approve')) return 'Satın Alma Onaylandı';
        if (p.includes('/purchase-orders') && p.includes('/cancel'))  return 'Satın Alma İptal Edildi';
        if (p.includes('/purchase-orders') && m === 'POST')   return 'Satın Alma Siparişi Oluşturuldu';
        if (p.includes('/purchase-orders') && m === 'GET')    return 'Satın Alma Siparişleri Görüntülendi';
        if (p.includes('/cari-accounts') && m === 'POST')   return 'Cari Hesap Eklendi';
        if (p.includes('/cari-accounts') && m === 'PUT')    return 'Cari Hesap Güncellendi';
        if (p.includes('/cari-accounts') && m === 'DELETE') return 'Cari Hesap Silindi';
        if (p.includes('/cari-accounts') && m === 'GET')    return 'Cari Hesaplar Görüntülendi';
        if (p.includes('/invoices') && p.includes('/send'))   return 'Fatura Gönderildi';
        if (p.includes('/invoices') && p.includes('/cancel')) return 'Fatura İptal Edildi';
        if (p.includes('/invoices') && m === 'POST')   return 'Fatura Oluşturuldu';
        if (p.includes('/invoices') && m === 'DELETE') return 'Fatura Silindi';
        if (p.includes('/invoices') && m === 'GET')    return 'Faturalar Görüntülendi';
        if (p.includes('/stock-movements') && p.includes('/balance')) return 'Stok Bakiyesi Görüntülendi';
        if (p.includes('/stock-movements') && m === 'POST') return 'Stok Hareketi Oluşturuldu';
        if (p.includes('/stock-movements') && m === 'GET')  return 'Stok Hareketleri Görüntülendi';
        if (p.includes('/finance-movements') && m === 'POST')   return 'Finans Hareketi Oluşturuldu';
        if (p.includes('/finance-movements') && m === 'DELETE') return 'Finans Hareketi Silindi';
        if (p.includes('/finance-movements') && m === 'GET')    return 'Finans Hareketleri Görüntülendi';
        if (p.includes('/reports')) return 'Rapor Görüntülendi';
        if (p.includes('/companies')  && m === 'POST') return 'Şirket Eklendi';
        if (p.includes('/branches')   && m === 'POST') return 'Şube Eklendi';
        if (p.includes('/warehouses') && m === 'POST') return 'Depo Eklendi';
        if (p.includes('/companies') || p.includes('/branches') || p.includes('/warehouses')) return 'Organizasyon Görüntülendi';
        return m === 'GET' ? 'Görüntüleme' : m === 'POST' ? 'Oluşturma' : m === 'PUT' ? 'Güncelleme' : m === 'DELETE' ? 'Silme' : 'İşlem';
    }

    getModuleLabel(path?: string): string {
        if (!path) return 'Sistem';
        const p = path.toLowerCase();
        if (p.includes('/products'))         return 'Ürünler';
        if (p.includes('/sales-orders'))     return 'Satış Siparişleri';
        if (p.includes('/purchase-orders'))  return 'Satın Alma';
        if (p.includes('/cari-accounts'))    return 'Cari Hesaplar';
        if (p.includes('/invoices'))         return 'Faturalar';
        if (p.includes('/stock-movements'))  return 'Stok';
        if (p.includes('/finance-movements'))return 'Finans';
        if (p.includes('/reports'))          return 'Raporlar';
        if (p.includes('/companies') || p.includes('/branches') || p.includes('/warehouses')) return 'Organizasyon';
        if (p.includes('/auth'))             return 'Sistem';
        return 'Diğer';
    }

    getModuleIcon(path?: string): string {
        const icons: Record<string, string> = {
            'Ürünler': 'inventory_2', 'Satış Siparişleri': 'shopping_cart',
            'Satın Alma': 'assignment_return', 'Cari Hesaplar': 'people',
            'Faturalar': 'receipt', 'Stok': 'swap_horiz', 'Finans': 'payments',
            'Raporlar': 'bar_chart', 'Organizasyon': 'business', 'Sistem': 'settings',
        };
        return icons[this.getModuleLabel(path)] || 'circle';
    }

    getModuleClass(path?: string): string {
        const classes: Record<string, string> = {
            'Ürünler': 'mod-products', 'Satış Siparişleri': 'mod-sales',
            'Satın Alma': 'mod-purchase', 'Cari Hesaplar': 'mod-cari',
            'Faturalar': 'mod-invoice', 'Stok': 'mod-stock', 'Finans': 'mod-finance',
            'Raporlar': 'mod-reports', 'Organizasyon': 'mod-org', 'Sistem': 'mod-system',
        };
        return classes[this.getModuleLabel(path)] || '';
    }

    getStatusClass(code: number): string {
        if (code >= 200 && code < 300) return 'status-ok';
        if (code >= 400 && code < 500) return 'status-warn';
        if (code >= 500)               return 'status-err';
        return 'status-info';
    }

    getStatusLabel(code: number): string {
        if (code >= 200 && code < 300) return 'Başarılı';
        if (code >= 400 && code < 500) return 'İstek Hatası';
        if (code >= 500)               return 'Sunucu Hatası';
        return String(code);
    }

    getMethodClass(m?: string): string {
        const map: Record<string, string> = {
            GET: 'method-get', POST: 'method-post', PUT: 'method-put',
            DELETE: 'method-delete', PATCH: 'method-patch'
        };
        return m ? (map[m.toUpperCase()] || '') : '';
    }

    formatDuration(ms: number): string {
        return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(2) + 's';
    }
}
