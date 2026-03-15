import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlatformAdminService } from '../../../core/services/platform-admin.service';
import {
    AdminAuditLogDto,
    AdminAuditLogSummaryDto,
    AuditLogFilter
} from '../../../core/models/platform-admin.model';

@Component({
    selector: 'app-audit-logs',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePipe],
    templateUrl: './audit-logs.component.html',
    styleUrl: './audit-logs.component.css'
})
export class AuditLogsComponent implements OnInit {
    private adminService = inject(PlatformAdminService);

    isLoading = signal(false);
    logs = signal<AdminAuditLogDto[]>([]);
    summary = signal<AdminAuditLogSummaryDto | null>(null);
    selectedLog = signal<AdminAuditLogDto | null>(null);
    showDetailModal = signal(false);

    // Filters
    searchTerm = '';
    statusCodeFilter = '';
    onlyErrors = false;
    fromDate = '';
    toDate = '';
    currentPage = 1;
    pageSize = 50;

    ngOnInit(): void {
        this.loadSummary();
        this.loadLogs();
    }

    loadSummary(): void {
        this.adminService.getAuditLogSummary({
            onlyErrors: this.onlyErrors,
            fromUtc: this.fromDate || undefined,
            toUtc: this.toDate || undefined
        }).subscribe({
            next: (data) => this.summary.set(data),
            error: (err) => console.error('Audit log özet yüklenemedi:', err.error?.detail || err.message)
        });
    }

    loadLogs(): void {
        this.isLoading.set(true);
        const filter: AuditLogFilter = {
            q: this.searchTerm || undefined,
            statusCode: this.statusCodeFilter ? parseInt(this.statusCodeFilter) : undefined,
            onlyErrors: this.onlyErrors || undefined,
            fromUtc: this.fromDate || undefined,
            toUtc: this.toDate || undefined,
            page: this.currentPage,
            pageSize: this.pageSize
        };
        this.adminService.getAuditLogs(filter).subscribe({
            next: (data) => {
                this.logs.set(data);
                this.isLoading.set(false);
            },
            error: (err) => { this.isLoading.set(false); console.error('Audit loglar yüklenemedi:', err.error?.detail || err.message); }
        });
    }

    onFilterChange(): void {
        this.currentPage = 1;
        this.loadSummary();
        this.loadLogs();
    }

    onPageChange(page: number): void {
        this.currentPage = page;
        this.loadLogs();
    }

    viewDetail(log: AdminAuditLogDto): void {
        this.selectedLog.set(log);
        this.showDetailModal.set(true);
    }

    closeDetail(): void {
        this.showDetailModal.set(false);
        this.selectedLog.set(null);
    }

    getMethodClass(method?: string): string {
        if (!method) return '';
        const map: Record<string, string> = {
            GET: 'method-get', POST: 'method-post',
            PUT: 'method-put', DELETE: 'method-delete',
            PATCH: 'method-patch'
        };
        return map[method.toUpperCase()] || '';
    }

    getStatusClass(code: number): string {
        if (code >= 200 && code < 300) return 'status-success';
        if (code >= 400 && code < 500) return 'status-warning';
        if (code >= 500) return 'status-error';
        return 'status-info';
    }

    formatDuration(ms: number): string {
        if (ms < 1000) return ms + 'ms';
        return (ms / 1000).toFixed(2) + 's';
    }

    toggleErrors(): void {
        this.onlyErrors = !this.onlyErrors;
        this.onFilterChange();
    }
}
