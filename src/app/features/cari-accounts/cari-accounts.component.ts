import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ExcelUploadResult {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

@Component({
    selector: 'app-cari-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cari-accounts.component.html',
    styleUrls: ['./cari-accounts.component.css', '../../shared/styles/crud-page.css']
})
export class CariAccountsComponent {
    searchTerm = '';
    activeTab = signal<'all' | 'suppliers' | 'buyers'>('all');
    showModal = signal(false);
    editingAccount = signal<any>(null);
    formData = { name: '', type: 'Buyer', phone: '', email: '', address: '', taxNumber: '' };

    // Excel upload state
    showExcelModal = signal(false);
    excelFile = signal<File | null>(null);
    excelUploading = signal(false);
    excelResult = signal<ExcelUploadResult | null>(null);
    isDragOver = signal(false);

    accounts = signal([
        { id: '1', name: 'Ahmet Yılmaz', type: 'Buyer', phone: '0532 111 22 33', email: 'ahmet@mail.com', balance: 5200, isActive: true },
        { id: '2', name: 'Tedarik A.Ş.', type: 'Supplier', phone: '0212 333 44 55', email: 'info@tedarik.com', balance: -12000, isActive: true },
        { id: '3', name: 'Mehmet Kaya', type: 'Buyer', phone: '0543 222 33 44', email: 'mehmet@mail.com', balance: 1800, isActive: true },
        { id: '4', name: 'Global Elektronik', type: 'Supplier', phone: '0216 555 66 77', email: 'info@global.com', balance: -35000, isActive: true },
        { id: '5', name: 'Fatma Çelik', type: 'Buyer', phone: '0555 444 55 66', email: 'fatma@mail.com', balance: 0, isActive: false },
    ]);

    get filteredAccounts() {
        let items = this.accounts();
        if (this.activeTab() === 'suppliers') items = items.filter(a => a.type === 'Supplier');
        if (this.activeTab() === 'buyers') items = items.filter(a => a.type === 'Buyer');
        const term = this.searchTerm.toLowerCase();
        if (term) items = items.filter(a => a.name.toLowerCase().includes(term) || a.phone.includes(term));
        return items;
    }

    openAddModal(): void {
        this.editingAccount.set(null);
        this.formData = { name: '', type: 'Buyer', phone: '', email: '', address: '', taxNumber: '' };
        this.showModal.set(true);
    }

    openEditModal(account: any): void {
        this.editingAccount.set(account);
        this.formData = { ...account };
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (this.editingAccount()) {
            this.accounts.update(items => items.map(a => a.id === this.editingAccount().id ? { ...a, ...this.formData } : a));
        } else {
            this.accounts.update(items => [...items, { id: Date.now().toString(), ...this.formData, balance: 0, isActive: true }]);
        }
        this.closeModal();
    }

    deleteAccount(id: string): void {
        this.accounts.update(items => items.filter(a => a.id !== id));
    }

    // ═══════════ Excel Upload ═══════════

    openExcelModal(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
        this.excelUploading.set(false);
        this.isDragOver.set(false);
        this.showExcelModal.set(true);
    }

    closeExcelModal(): void {
        this.showExcelModal.set(false);
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            this.setFile(input.files[0]);
        }
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(true);
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.isDragOver.set(false);
        if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
            this.setFile(event.dataTransfer.files[0]);
        }
    }

    private setFile(file: File): void {
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
        ];
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!validTypes.includes(file.type) && !['xlsx', 'xls', 'csv'].includes(ext || '')) {
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            return; // 5MB limit
        }
        this.excelFile.set(file);
        this.excelResult.set(null);
    }

    removeExcelFile(): void {
        this.excelFile.set(null);
        this.excelResult.set(null);
    }

    uploadExcel(): void {
        const file = this.excelFile();
        if (!file) return;

        this.excelUploading.set(true);

        // Simulate upload — replace with real API call:
        // const formData = new FormData();
        // formData.append('file', file);
        // this.cariAccountService.importExcel(cariAccountId, formData).subscribe(...)
        setTimeout(() => {
            const mockResult: ExcelUploadResult = {
                totalRows: 15,
                createdCount: 12,
                failedCount: 3,
                errors: [
                    'Satır 4: "Ad" alanı boş bırakılamaz.',
                    'Satır 9: Geçersiz tür değeri — "Buyer" veya "Supplier" olmalı.',
                    'Satır 13: E-posta formatı geçersiz.'
                ]
            };

            // Add mock imported accounts to local list
            const newAccounts = [
                { id: Date.now().toString() + '10', name: 'Ali Koç', type: 'Buyer', phone: '0532 999 88 77', email: 'ali@koc.com', balance: 0, isActive: true },
                { id: Date.now().toString() + '11', name: 'Demir Ticaret', type: 'Supplier', phone: '0212 111 00 99', email: 'info@demir.com', balance: 0, isActive: true },
                { id: Date.now().toString() + '12', name: 'Zeynep Arslan', type: 'Buyer', phone: '0544 333 22 11', email: 'zeynep@mail.com', balance: 0, isActive: true },
            ];
            this.accounts.update(items => [...items, ...newAccounts]);

            this.excelResult.set(mockResult);
            this.excelUploading.set(false);
        }, 2000);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
}
