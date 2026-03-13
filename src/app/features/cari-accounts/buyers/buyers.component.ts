import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CariAccountService } from '../../../core/services/cari-account.service';
import { CariAccount, BuyerDebtItemsBatchImportResult, BuyerDebtItemsBatchImportFileResult } from '../../../core/models/cari-account.model';

@Component({
    selector: 'app-buyers',
    standalone: true,
    imports: [CommonModule, FormsModule],

    templateUrl: './buyers.component.html',
    styleUrls: ['./buyers.component.css', '../../../shared/styles/crud-page.css']
})
export class BuyersComponent implements OnInit {
    searchTerm = '';
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    showModal = signal(false);
    editingAccount = signal<any>(null);

    // Excel upload state (veresiye ürün aktarma)
    showExcelModal = signal(false);
    excelFiles = signal<File[]>([]);
    excelUploading = signal(false);
    excelResult = signal<BuyerDebtItemsBatchImportResult | null>(null);
    isDragOver = signal(false);

    constructor(private router: Router, private cariService: CariAccountService) { }

    formData = {
        name: '', phone: '', email: '', address: '',
        taxNumber: '', city: '', notes: ''
    };

    accounts = signal<any[]>([]);

    ngOnInit(): void {
        this.loadAccounts();
    }

    loadAccounts(): void {
        this.cariService.getBuyers().subscribe({
            next: (data) => this.accounts.set(data.map(a => ({
                id: a.id,
                name: a.name,
                phone: '',
                email: '',
                address: '',
                taxNumber: '',
                city: '',
                balance: a.currentBalance,
                totalSales: 0,
                totalPayments: 0,
                remainingDebt: a.currentBalance,
                orderCount: 0,
                lastOrder: '-',
                isActive: true
            }))),
            error: () => {}
        });
    }

    get filteredAccounts() {
        let items = this.accounts();
        if (this.statusFilter() === 'active') items = items.filter(a => a.isActive);
        if (this.statusFilter() === 'inactive') items = items.filter(a => !a.isActive);
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(a =>
            a.name.toLowerCase().includes(term) ||
            a.phone.includes(term) ||
            a.email.toLowerCase().includes(term) ||
            a.city.toLowerCase().includes(term)
        );
        return items;
    }

    get totalBalance() { return this.accounts().reduce((s, a) => s + a.balance, 0); }
    get activeCount() { return this.accounts().filter(a => a.isActive).length; }
    get totalSalesSum() { return this.accounts().reduce((s, a) => s + a.totalSales, 0); }
    get totalPaymentsSum() { return this.accounts().reduce((s, a) => s + a.totalPayments, 0); }
    get totalDebtSum() { return this.accounts().reduce((s, a) => s + a.remainingDebt, 0); }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { name: '', phone: '', email: '', address: '', taxNumber: '', city: '', notes: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.formData = { name: account.name, phone: account.phone, email: account.email, address: account.address, taxNumber: account.taxNumber, city: account.city, notes: '' };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (!this.formData.name.trim()) return;

        if (this.editingAccount()) {
            this.cariService.update(this.editingAccount().id, {
                name: this.formData.name,
                type: 1 // Buyer (CariType.Buyer = 1)
            }).subscribe({
                next: () => { this.loadAccounts(); this.closeModal(); },
                error: () => {}
            });
        } else {
            this.cariService.create({
                name: this.formData.name,
                type: 1, // Buyer (CariType.Buyer = 1)
                riskLimit: 0,
                maturityDays: 0
            }).subscribe({
                next: () => { this.loadAccounts(); this.closeModal(); },
                error: () => {}
            });
        }
    }

    viewDetail(account: any): void {
        this.router.navigate(['/cari-accounts/buyers', account.id]);
    }

    toggleStatus(id: string): void {
        this.accounts.update(items => items.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }

    deleteAccount(id: string): void {
        if (!confirm('Bu alıcıyı silmek istediğinize emin misiniz?')) return;
        this.cariService.delete(id).subscribe({
            next: () => this.loadAccounts(),
            error: () => {}
        });
    }

    // ═══════════ Veresiye Excel Aktarma ═══════════

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
        input.value = ''; // reset for re-select
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true); }
    onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false); }

    onDrop(event: DragEvent): void {
        event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false);
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
        // Remove extension to get buyer name: "Ali Öztürk.xlsx" -> "Ali Öztürk"
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
                // Refresh accounts list after successful import
                if (result.totalCreatedCount > 0) {
                    this.loadAccounts();
                }
            },
            error: (err) => {
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
}

