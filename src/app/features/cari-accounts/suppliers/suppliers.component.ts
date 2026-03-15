import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CariAccountService } from '../../../core/services/cari-account.service';
import { ConfirmService } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

interface ExcelUploadResult {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

@Component({
    selector: 'app-suppliers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './suppliers.component.html',
    styleUrls: ['./suppliers.component.css', '../../../shared/styles/crud-page.css']
})
export class SuppliersComponent implements OnInit {
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    statusFilter = signal<'all' | 'active' | 'inactive'>('all');
    showModal = signal(false);
    showDetailModal = signal(false);
    editingAccount = signal<any>(null);
    selectedAccount = signal<any>(null);
    saveError = signal('');

    // Excel upload state
    showExcelModal = signal(false);
    excelFile = signal<File | null>(null);
    excelUploading = signal(false);
    excelResult = signal<ExcelUploadResult | null>(null);
    isDragOver = signal(false);

    formData = {
        code: '', name: '', phone: '', email: '', address: '',
        taxNumber: '', taxOffice: '', city: '', contactPerson: '', notes: ''
    };

    accounts = signal<any[]>([]);

    constructor(private cariService: CariAccountService) {}

    ngOnInit(): void {
        this.loadAccounts();
    }

    loadAccounts(): void {
        this.cariService.getSuppliers().subscribe({
            next: (data) => this.accounts.set(data.map(a => ({
                id: a.id,
                code: a.code || '',
                name: a.name,
                phone: '',
                email: '',
                address: '',
                taxNumber: '',
                taxOffice: '',
                city: '',
                contactPerson: '',
                balance: a.currentBalance,
                totalPurchase: 0,
                totalPayments: 0,
                remainingDebt: Math.abs(a.currentBalance),
                orderCount: 0,
                lastOrder: '-',
                isActive: true,
                rating: 0
            }))),
            error: (err) => console.error('Tedarikçiler yüklenemedi:', err.error?.detail || err.message)
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
            a.contactPerson.toLowerCase().includes(term) ||
            a.city.toLowerCase().includes(term)
        );
        return items;
    }

    get totalBalance() { return this.accounts().reduce((s, a) => s + a.balance, 0); }
    get activeCount() { return this.accounts().filter(a => a.isActive).length; }
    get totalPurchaseSum() { return this.accounts().reduce((s, a) => s + a.totalPurchase, 0); }
    get totalPaymentsSum() { return this.accounts().reduce((s, a) => s + a.totalPayments, 0); }
    get totalDebtSum() { return this.accounts().reduce((s, a) => s + a.remainingDebt, 0); }

    getRatingStars(rating: number): string {
        return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.saveError.set('');
        this.formData = { code: '', name: '', phone: '', email: '', address: '', taxNumber: '', taxOffice: '', city: '', contactPerson: '', notes: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.saveError.set('');
        this.formData = {
            code: account.code || '', name: account.name, phone: account.phone, email: account.email, address: account.address,
            taxNumber: account.taxNumber, taxOffice: account.taxOffice, city: account.city,
            contactPerson: account.contactPerson, notes: ''
        };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (!this.formData.name.trim()) return;
        this.saveError.set('');

        const code = this.formData.code.trim() || ('TED-' + Date.now().toString(36).toUpperCase());

        if (this.editingAccount()) {
            this.cariService.update(this.editingAccount().id, {
                code,
                name: this.formData.name,
                type: 2 // Supplier
            }).subscribe({
                next: () => { this.loadAccounts(); this.closeModal(); },
                error: (err) => this.saveError.set(err.error?.detail || 'Güncelleme başarısız.')
            });
        } else {
            this.cariService.create({
                code,
                name: this.formData.name,
                type: 2, // Supplier
                riskLimit: 0,
                maturityDays: 0
            }).subscribe({
                next: () => { this.loadAccounts(); this.closeModal(); },
                error: (err) => this.saveError.set(err.error?.detail || 'Kayıt başarısız.')
            });
        }
    }

    viewDetail(account: any): void {
        this.selectedAccount.set(account);
        this.showDetailModal.set(true);
    }

    closeDetailModal(): void { this.showDetailModal.set(false); }

    toggleStatus(id: string): void {
        this.accounts.update(items => items.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    }

    async deleteAccount(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu tedarikçiyi silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.cariService.delete(id).subscribe({
            next: () => { this.loadAccounts(); this.toastService.success('Silindi', 'Tedarikçi silindi'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme işlemi başarısız.')
        });
    }

    // ═══════════ Excel Upload ═══════════

    openExcelModal(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
        this.excelUploading.set(false);
        this.isDragOver.set(false);
        this.showExcelModal.set(true);
    }

    closeExcelModal(): void { this.showExcelModal.set(false); }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) this.setFile(input.files[0]);
    }

    onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(true); }
    onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false); }

    onDrop(event: DragEvent): void {
        event.preventDefault(); event.stopPropagation(); this.isDragOver.set(false);
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) this.setFile(event.dataTransfer.files[0]);
    }

    private setFile(file: File): void {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!['xlsx', 'xls', 'csv'].includes(ext || '') || file.size > 5 * 1024 * 1024) return;
        this.excelFile.set(file);
        this.excelResult.set(null);
    }

    removeExcelFile(): void { this.excelFile.set(null); this.excelResult.set(null); }

    uploadExcel(): void {
        if (!this.excelFile()) return;
        this.excelUploading.set(true);
        setTimeout(() => {
            this.excelResult.set({ totalRows: 12, createdCount: 10, failedCount: 2, errors: ['Satır 5: "Firma Adı" boş bırakılamaz.', 'Satır 11: VKN formatı geçersiz.'] });
            this.excelUploading.set(false);
        }, 2000);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}

