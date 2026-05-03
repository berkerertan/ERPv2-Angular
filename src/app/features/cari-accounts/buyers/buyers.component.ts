import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CariAccountService } from '../../../core/services/cari-account.service';
import { BuyerDebtItemsBatchImportResult, BuyerRiskSummaryItem } from '../../../core/models/cari-account.model';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';
import { DEMO_BUYER_EXTRA } from '../../../core/mock/demo-data';

type BuyerRiskSeverity = 'stable' | 'warning' | 'critical';

interface BuyerAccountView {
    id: string;
    code: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    taxNumber: string;
    city: string;
    balance: number;
    totalSales: number;
    totalPayments: number;
    remainingDebt: number;
    orderCount: number;
    lastOrder: string;
    isActive: boolean;
    riskLimit: number;
    maturityDays: number;
    overdueAmount: number;
    maxOverdueDays: number;
    riskUsageRate: number;
    severity: BuyerRiskSeverity;
}

@Component({
    selector: 'app-buyers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './buyers.component.html',
    styleUrls: ['./buyers.component.css', '../../../shared/styles/crud-page.css']
})
export class BuyersComponent implements OnInit {
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    riskFilter = signal<'all' | BuyerRiskSeverity>('all');
    showModal = signal(false);
    editingAccount = signal<BuyerAccountView | null>(null);
    riskLoading = signal(false);

    exportingId = signal<string | null>(null);

    showExcelModal = signal(false);
    excelFiles = signal<File[]>([]);
    excelUploading = signal(false);
    excelResult = signal<BuyerDebtItemsBatchImportResult | null>(null);
    isDragOver = signal(false);

    constructor(private router: Router, private cariService: CariAccountService) { }

    formData = {
        code: '', name: '', phone: '', email: '', address: '',
        taxNumber: '', city: '', notes: ''
    };

    accounts = signal<BuyerAccountView[]>([]);
    riskMap = signal<Map<string, BuyerRiskSummaryItem>>(new Map());

    ngOnInit(): void {
        this.loadAccounts();
        this.loadRiskSummary();
    }

    loadAccounts(): void {
        this.cariService.getBuyers().subscribe({
            next: (data) => {
                const currentRiskMap = this.riskMap();
                this.accounts.set(data.map(account => this.mapAccount(account, currentRiskMap.get(account.id))));
            },
            error: () => this.toastService.error('Hata', 'Alicilar yuklenemedi.')
        });
    }

    loadRiskSummary(): void {
        this.riskLoading.set(true);
        this.cariService.getBuyerRiskSummary(100).subscribe({
            next: (summary) => {
                const map = new Map(summary.items.map(item => [item.cariAccountId, item]));
                this.riskMap.set(map);
                this.accounts.update(items => items.map(item => this.mapAccount(item, map.get(item.id))));
                this.riskLoading.set(false);
            },
            error: () => {
                this.riskLoading.set(false);
                this.toastService.error('Hata', 'Risk ozeti yuklenemedi.');
            }
        });
    }

    sort(col: string): void {
        if (this.sortColumn === col) {
            this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = col;
            this.sortDir = 'asc';
        }
    }

    get filteredAccounts(): BuyerAccountView[] {
        let items = this.accounts();
        if (this.statusFilter() === 'active') items = items.filter(a => a.isActive);
        if (this.statusFilter() === 'inactive') items = items.filter(a => !a.isActive);
        if (this.riskFilter() !== 'all') items = items.filter(a => a.severity === this.riskFilter());

        const term = this.searchTerm.toLowerCase();
        if (term) {
            items = items.filter(a =>
                a.name.toLowerCase().includes(term) ||
                a.phone.includes(term) ||
                a.email.toLowerCase().includes(term) ||
                a.city.toLowerCase().includes(term) ||
                a.code.toLowerCase().includes(term)
            );
        }

        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof BuyerAccountView;
            items = [...items].sort((a, b) =>
                typeof a[col] === 'number'
                    ? dir * ((a[col] as number) - (b[col] as number))
                    : dir * String(a[col] ?? '').localeCompare(String(b[col] ?? ''), 'tr')
            );
        }

        return items;
    }

    get totalBalance() { return this.accounts().reduce((s, a) => s + a.balance, 0); }
    get activeCount() { return this.accounts().filter(a => a.isActive).length; }
    get totalSalesSum() { return this.accounts().reduce((s, a) => s + a.totalSales, 0); }
    get totalPaymentsSum() { return this.accounts().reduce((s, a) => s + a.totalPayments, 0); }
    get totalDebtSum() { return this.accounts().reduce((s, a) => s + a.remainingDebt, 0); }
    get riskyCount() { return this.accounts().filter(a => a.severity !== 'stable').length; }
    get criticalCount() { return this.accounts().filter(a => a.severity === 'critical').length; }
    get totalOverdueAmount() { return this.accounts().reduce((s, a) => s + a.overdueAmount, 0); }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { code: '', name: '', phone: '', email: '', address: '', taxNumber: '', city: '', notes: '' };
        this.showModal.set(true);
    }

    openEditModal(account: BuyerAccountView): void {
        this.editingAccount.set(account);
        this.formData = {
            code: account.code || '',
            name: account.name,
            phone: account.phone,
            email: account.email,
            address: account.address,
            taxNumber: account.taxNumber,
            city: account.city,
            notes: ''
        };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    saveError = signal('');

    save(): void {
        if (!this.formData.name.trim()) return;
        this.saveError.set('');

        const code = this.formData.code.trim() || this.generateCode();
        const editing = this.editingAccount();

        if (editing) {
            this.cariService.update(editing.id, {
                code,
                name: this.formData.name,
                type: 1
            }).subscribe({
                next: () => { this.loadAccounts(); this.loadRiskSummary(); this.closeModal(); },
                error: (err) => this.saveError.set(err.error?.detail || 'Guncelleme basarisiz.')
            });
        } else {
            this.cariService.create({
                code,
                name: this.formData.name,
                type: 1,
                riskLimit: 0,
                maturityDays: 0
            }).subscribe({
                next: () => { this.loadAccounts(); this.loadRiskSummary(); this.closeModal(); },
                error: (err) => this.saveError.set(err.error?.detail || 'Kayit basarisiz.')
            });
        }
    }

    private generateCode(): string {
        return 'ALI-' + Date.now().toString(36).toUpperCase();
    }

    viewDetail(account: BuyerAccountView): void {
        this.router.navigate(['/cari-accounts/buyers', account.id]);
    }

    toggleStatus(id: string): void {
        this.accounts.update(items => items.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }

    async deleteAccount(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayi',
            message: 'Bu aliciyi silmek istediginize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.cariService.delete(id).subscribe({
            next: () => {
                this.loadAccounts();
                this.loadRiskSummary();
                this.toastService.success('Silindi', 'Alici silindi');
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme islemi basarisiz.')
        });
    }

    exportBuyerExcel(account: BuyerAccountView): void {
        if (this.exportingId() === account.id) return;
        this.exportingId.set(account.id);

        this.cariService.exportBuyerExcel(account.id).subscribe({
            next: (blob) => {
                this.downloadFile(blob, `${account.name}.xlsx`);
                this.exportingId.set(null);
                this.toastService.success('Indirildi', `${account.name} veresiye defteri indirildi`);
            },
            error: (err) => {
                this.exportingId.set(null);
                this.toastService.error('Hata', err.error?.detail || 'Excel indirme basarisiz.');
            }
        });
    }

    private downloadFile(blob: Blob, filename: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    openExcelModal(): void {
        this.excelFiles.set([]);
        this.excelResult.set(null);
        this.excelUploading.set(false);
        this.isDragOver.set(false);
        this.showExcelModal.set(true);
    }

    closeExcelModal(): void { this.showExcelModal.set(false); }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.addFiles(Array.from(input.files));
        }
        input.value = '';
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true); }
    onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false); }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.addFiles(Array.from(event.dataTransfer.files));
        }
    }

    private addFiles(files: File[]): void {
        const valid = files.filter(f => {
            const ext = f.name.split('.').pop()?.toLowerCase();
            return ['xlsx', 'xls', 'csv'].includes(ext || '') && f.size <= 5 * 1024 * 1024;
        });
        if (valid.length > 0) {
            this.excelFiles.update(existing => [...existing, ...valid]);
            this.excelResult.set(null);
        }
    }

    removeExcelFileAt(index: number): void {
        this.excelFiles.update(files => files.filter((_, i) => i !== index));
    }

    removeExcelFile(): void { this.excelFiles.set([]); this.excelResult.set(null); }

    extractBuyerName(fileName: string): string {
        return fileName.replace(/\.[^/.]+$/, '');
    }

    uploadExcel(): void {
        if (this.excelFiles().length === 0) return;
        this.excelUploading.set(true);
        this.excelResult.set(null);

        this.cariService.importBuyersBatch(this.excelFiles()).subscribe({
            next: (result) => {
                this.excelResult.set(result);
                this.excelUploading.set(false);
                if (result.totalCreatedCount > 0) {
                    this.loadAccounts();
                    this.loadRiskSummary();
                }
            },
            error: () => {
                this.excelResult.set({
                    totalFiles: this.excelFiles().length,
                    processedFiles: 0,
                    createdCariCount: 0,
                    totalRows: 0,
                    totalCreatedCount: 0,
                    totalFailedCount: 0,
                    files: []
                });
                this.excelUploading.set(false);
            }
        });
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getRiskBadgeClass(severity: BuyerRiskSeverity): string {
        return severity === 'critical'
            ? 'risk-badge--critical'
            : severity === 'warning'
                ? 'risk-badge--warning'
                : 'risk-badge--stable';
    }

    getRiskLabel(severity: BuyerRiskSeverity): string {
        return severity === 'critical'
            ? 'Kritik'
            : severity === 'warning'
                ? 'Riskli'
                : 'Stabil';
    }

    private mapAccount(account: any, risk?: BuyerRiskSummaryItem): BuyerAccountView {
        const ex = DEMO_BUYER_EXTRA[account.id] ?? {};
        return {
            id: account.id,
            code: account.code || '',
            name: account.name,
            phone: ex.phone ?? '',
            email: ex.email ?? '',
            address: ex.address ?? '',
            taxNumber: ex.taxNumber ?? '',
            city: ex.city ?? '',
            balance: account.currentBalance ?? account.balance ?? 0,
            totalSales: ex.totalSales ?? 0,
            totalPayments: ex.totalPayments ?? 0,
            remainingDebt: account.currentBalance ?? account.balance ?? 0,
            orderCount: ex.orderCount ?? 0,
            lastOrder: ex.lastOrder ?? '-',
            isActive: account.isActive ?? true,
            riskLimit: risk?.riskLimit ?? account.riskLimit ?? 0,
            maturityDays: risk?.maturityDays ?? account.maturityDays ?? 0,
            overdueAmount: risk?.overdueAmount ?? 0,
            maxOverdueDays: risk?.maxOverdueDays ?? 0,
            riskUsageRate: risk?.riskUsageRate ?? 0,
            severity: risk?.severity ?? 'stable'
        };
    }
}
