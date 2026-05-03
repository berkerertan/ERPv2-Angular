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
    readonly allLogs = signal<TenantActivityLogDto[]>([]);
    readonly summary = signal<TenantActivitySummaryDto | null>(null);
    readonly selected = signal<TenantActivityLogDto | null>(null);

    searchTerm = '';
    onlyErrors = false;
    fromDate = '';
    toDate = '';
    currentPage = 1;
    pageSize = 50;
    sortColumn: 'occurredAtUtc' | 'statusCode' | 'durationMs' | '' = 'occurredAtUtc';
    sortDir: 'asc' | 'desc' = 'desc';

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
            this.getActionLabel(log),
            this.getModuleLabel(log.path)
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

    viewDetail(log: TenantActivityLogDto): void {
        this.selected.set(log);
    }

    closeDetail(): void {
        this.selected.set(null);
    }

    getActionLabel(log: TenantActivityLogDto): string {
        if (log.description?.trim()) {
            return log.description.trim();
        }

        const method = (log.httpMethod ?? '').toUpperCase();
        const path = (log.path ?? '').toLowerCase();

        if (method === 'APPROVE') return 'Onay verildi';
        if (method === 'REJECT') return 'Reddedildi';
        if (path.includes('/auth/login')) return 'Giriþ yapýldý';
        if (path.includes('/auth/logout')) return 'Çýkýþ yapýldý';
        if (path.includes('/purchase-orders/recommendations')) return 'Satýn alma önerileri görüntülendi';
        if (path.includes('/inventory-count-sessions')) return 'Sayým oturumu iþlendi';
        if (path.includes('/sales-orders') && path.includes('/approve')) return 'Satýþ sipariþi onaylandý';
        if (path.includes('/sales-orders') && path.includes('/reject')) return 'Satýþ sipariþi reddedildi';
        if (path.includes('/purchase-orders') && path.includes('/approve')) return 'Satýn alma sipariþi onaylandý';
        if (path.includes('/purchase-orders') && path.includes('/reject')) return 'Satýn alma sipariþi reddedildi';
        if (path.includes('/stock-movements') && path.includes('/inventory-count')) return 'Stok sayýmý kaydedildi';
        if (path.includes('/notifications')) return 'Bildirimler görüntülendi';

        return method === 'GET'
            ? 'Kayýt görüntülendi'
            : method === 'POST'
                ? 'Yeni kayýt oluþturuldu'
                : method === 'PUT'
                    ? 'Kayýt güncellendi'
                    : method === 'DELETE'
                        ? 'Kayýt silindi'
                        : 'Ýþlem yapýldý';
    }

    getModuleLabel(path?: string): string {
        const value = (path ?? '').toLowerCase();
        if (value.includes('/purchase-orders')) return 'Satýn alma';
        if (value.includes('/sales-orders')) return 'Satýþ';
        if (value.includes('/stock-movements')) return 'Stok';
        if (value.includes('/cari-accounts')) return 'Cari';
        if (value.includes('/notifications')) return 'Bildirim';
        if (value.includes('/activity-logs')) return 'Aktivite';
        if (value.includes('/auth')) return 'Oturum';
        return 'Sistem';
    }

    getModuleClass(path?: string): string {
        const module = this.getModuleLabel(path);
        return {
            'Satýn alma': 'mod-purchase',
            'Satýþ': 'mod-sales',
            'Stok': 'mod-stock',
            'Cari': 'mod-cari',
            'Bildirim': 'mod-notification',
            'Aktivite': 'mod-activity',
            'Oturum': 'mod-auth',
            'Sistem': 'mod-system'
        }[module] ?? 'mod-system';
    }

    getStatusClass(code: number): string {
        if (code >= 500) return 'status-error';
        if (code >= 400) return 'status-warning';
        if (code >= 200) return 'status-success';
        return 'status-info';
    }

    getStatusLabel(code: number): string {
        if (code >= 500) return 'Sunucu hatasý';
        if (code >= 400) return 'Ýstek hatasý';
        if (code >= 200) return 'Baþarýlý';
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
        return value || 'ÝÞLEM';
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
            fromUtc: this.fromDate || undefined,
            toUtc: this.toDate || undefined,
            page: this.currentPage,
            pageSize: this.pageSize
        };
    }
}
