import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityLogService } from '../../core/services/activity-log.service';
import {
    TenantActivityFilter,
    TenantActivityLogDto,
    TenantActivitySummaryDto
} from '../../core/models/activity-log.model';

@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './activity-log.component.html',
    styleUrl: './activity-log.component.css'
})
export class ActivityLogComponent implements OnInit {
    private readonly service = inject(ActivityLogService);

    readonly isLoading = signal(false);
    readonly exportMode = signal<'csv' | 'excel' | 'pdf' | null>(null);
    readonly allLogs = signal<TenantActivityLogDto[]>([]);
    readonly summary = signal<TenantActivitySummaryDto | null>(null);
    readonly selected = signal<TenantActivityLogDto | null>(null);

    searchTerm = '';
    onlyErrors = false;
    businessOnly = false;
    fromDate = '';
    toDate = '';
    selectedModule = '';
    selectedHttpMethod = '';
    currentPage = 1;
    pageSize = 50;
    sortColumn: 'occurredAtUtc' | 'statusCode' | 'durationMs' | '' = 'occurredAtUtc';
    sortDir: 'asc' | 'desc' = 'desc';

    readonly moduleOptions = ['Satın alma', 'Satış', 'Stok', 'Cari', 'Bildirim', 'Aktivite', 'Oturum', 'Sistem'];
    readonly methodOptions = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'APPROVE', 'REJECT'];

    readonly logs = computed(() => {
        const term = this.searchTerm.trim().toLocaleLowerCase('tr-TR');
        const items = this.allLogs();
        if (!term) {
            return items;
        }

        return items.filter(log => [
            log.userName,
            log.description,
            log.path,
            log.module,
            this.getActionLabel(log),
            this.getModuleLabel(log.path, log.module)
        ].some(value => (value ?? '').toLocaleLowerCase('tr-TR').includes(term)));
    });

    get sortedLogs(): TenantActivityLogDto[] {
        const items = [...this.logs()];
        const dir = this.sortDir === 'asc' ? 1 : -1;

        return items.sort((left, right) => {
            switch (this.sortColumn) {
                case 'statusCode':
                    return (left.statusCode - right.statusCode) * dir;
                case 'durationMs':
                    return (left.durationMs - right.durationMs) * dir;
                case 'occurredAtUtc':
                default:
                    return (new Date(left.occurredAtUtc).getTime() - new Date(right.occurredAtUtc).getTime()) * dir;
            }
        });
    }

    ngOnInit(): void {
        this.refresh();
    }

    refresh(): void {
        this.loadSummary();
        this.loadLogs();
    }

    loadSummary(): void {
        this.service.getSummary(this.buildFilter()).subscribe({
            next: data => this.summary.set(data),
            error: error => console.error(error)
        });
    }

    loadLogs(): void {
        this.isLoading.set(true);
        this.service.getLogs(this.buildFilter()).subscribe({
            next: data => {
                this.allLogs.set(data);
                this.isLoading.set(false);
            },
            error: error => {
                this.isLoading.set(false);
                console.error(error);
            }
        });
    }

    exportLogs(format: 'csv' | 'excel' | 'pdf'): void {
        this.exportMode.set(format);

        const request = format === 'excel'
            ? this.service.exportExcel(this.buildFilter())
            : format === 'pdf'
                ? this.service.exportPdf(this.buildFilter())
                : this.service.exportCsv(this.buildFilter());

        request.subscribe({
            next: blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `stoknet-aktivite-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.${format === 'excel' ? 'xlsx' : format}`;
                link.click();
                URL.revokeObjectURL(url);
                this.exportMode.set(null);
            },
            error: error => {
                console.error(error);
                this.exportMode.set(null);
            }
        });
    }

    clearFilters(): void {
        this.searchTerm = '';
        this.onlyErrors = false;
        this.businessOnly = false;
        this.fromDate = '';
        this.toDate = '';
        this.selectedModule = '';
        this.selectedHttpMethod = '';
        this.currentPage = 1;
        this.refresh();
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.refresh();
    }

    onPageChange(page: number): void {
        this.currentPage = Math.max(1, page);
        this.loadLogs();
    }

    sort(column: 'occurredAtUtc' | 'statusCode' | 'durationMs'): void {
        if (this.sortColumn === column) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
            return;
        }

        this.sortColumn = column;
        this.sortDir = column === 'occurredAtUtc' ? 'desc' : 'asc';
    }

    toggleErrors(): void {
        this.onlyErrors = !this.onlyErrors;
        this.onFilterChange();
    }

    toggleBusinessOnly(): void {
        this.businessOnly = !this.businessOnly;
        this.onFilterChange();
    }

    viewDetail(log: TenantActivityLogDto): void {
        this.selected.set(log);
    }

    closeDetail(): void {
        this.selected.set(null);
    }

    isExporting(format?: 'csv' | 'excel' | 'pdf'): boolean {
        return format ? this.exportMode() === format : this.exportMode() !== null;
    }

    getActionLabel(log: TenantActivityLogDto): string {
        if (log.description?.trim()) {
            return log.description.trim();
        }

        const method = (log.httpMethod ?? '').toUpperCase();
        const path = (log.path ?? '').toLowerCase();

        if (method === 'APPROVE') return 'Onay verildi';
        if (method === 'REJECT') return 'Reddedildi';
        if (path.includes('/auth/login')) return 'Giriş yapıldı';
        if (path.includes('/auth/logout')) return 'Çıkış yapıldı';
        if (path.includes('/purchase-orders/recommendations')) return 'Satın alma önerileri görüntülendi';
        if (path.includes('/inventory-count-sessions')) return 'Sayım oturumu işlendi';
        if (path.includes('/sales-orders') && path.includes('/approve')) return 'Satış siparişi onaylandı';
        if (path.includes('/sales-orders') && path.includes('/reject')) return 'Satış siparişi reddedildi';
        if (path.includes('/purchase-orders') && path.includes('/approve')) return 'Satın alma siparişi onaylandı';
        if (path.includes('/purchase-orders') && path.includes('/reject')) return 'Satın alma siparişi reddedildi';
        if (path.includes('/stock-movements') && path.includes('/inventory-count')) return 'Stok sayımı kaydedildi';
        if (path.includes('/notifications')) return 'Bildirimler görüntülendi';

        return method === 'GET'
            ? 'Kayıt görüntülendi'
            : method === 'POST'
                ? 'Yeni kayıt oluşturuldu'
                : method === 'PUT'
                    ? 'Kayıt güncellendi'
                    : method === 'DELETE'
                        ? 'Kayıt silindi'
                        : 'İşlem yapıldı';
    }

    getModuleLabel(path?: string, module?: string): string {
        if (module?.trim()) {
            return module;
        }

        const value = (path ?? '').toLowerCase();
        if (value.includes('/purchase-orders')) return 'Satın alma';
        if (value.includes('/sales-orders')) return 'Satış';
        if (value.includes('/stock-movements')) return 'Stok';
        if (value.includes('/cari-accounts')) return 'Cari';
        if (value.includes('/notifications')) return 'Bildirim';
        if (value.includes('/activity-logs')) return 'Aktivite';
        if (value.includes('/auth')) return 'Oturum';
        return 'Sistem';
    }

    getModuleClass(path?: string, module?: string): string {
        const resolvedModule = this.getModuleLabel(path, module);
        return {
            'Satın alma': 'mod-purchase',
            'Satış': 'mod-sales',
            'Stok': 'mod-stock',
            'Cari': 'mod-cari',
            'Bildirim': 'mod-notification',
            'Aktivite': 'mod-activity',
            'Oturum': 'mod-auth',
            'Sistem': 'mod-system'
        }[resolvedModule] ?? 'mod-system';
    }

    getStatusClass(code: number): string {
        if (code >= 500) return 'status-error';
        if (code >= 400) return 'status-warning';
        if (code >= 200) return 'status-success';
        return 'status-info';
    }

    getStatusLabel(code: number): string {
        if (code >= 500) return 'Sunucu hatası';
        if (code >= 400) return 'İstek hatası';
        if (code >= 200) return 'Başarılı';
        return 'Bilinmiyor';
    }

    getMethodClass(method?: string): string {
        const value = (method ?? '').toUpperCase();
        return {
            GET: 'method-get',
            POST: 'method-post',
            PUT: 'method-put',
            DELETE: 'method-delete',
            PATCH: 'method-patch',
            APPROVE: 'method-approve',
            REJECT: 'method-reject'
        }[value] ?? 'method-generic';
    }

    getMethodLabel(method?: string): string {
        const value = (method ?? '').toUpperCase();
        return value || 'İŞLEM';
    }

    isBusinessFlow(log: TenantActivityLogDto): boolean {
        const method = (log.httpMethod ?? '').toUpperCase();
        return method === 'APPROVE' || method === 'REJECT' || !!log.description?.trim();
    }

    formatDuration(durationMs: number): string {
        return durationMs < 1000
            ? `${durationMs} ms`
            : `${(durationMs / 1000).toFixed(2)} sn`;
    }

    private buildFilter(): TenantActivityFilter {
        return {
            onlyErrors: this.onlyErrors || undefined,
            businessOnly: this.businessOnly || undefined,
            fromUtc: this.fromDate || undefined,
            toUtc: this.toDate || undefined,
            module: this.selectedModule || undefined,
            httpMethod: this.selectedHttpMethod || undefined,
            search: this.searchTerm.trim() || undefined,
            page: this.currentPage,
            pageSize: this.pageSize
        };
    }
}
