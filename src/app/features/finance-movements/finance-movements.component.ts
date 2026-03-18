import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceMovementService } from '../../core/services/finance-movement.service';
import { FinanceMovementType, CreateFinanceMovementRequest } from '../../core/models/finance-movement.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-finance-movements',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './finance-movements.component.html',
    styleUrls: ['./finance-movements.component.css', '../../shared/styles/crud-page.css']
})
export class FinanceMovementsComponent implements OnInit {
    private financeService = inject(FinanceMovementService);
    private cariAccountService = inject(CariAccountService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';
    activeTab = signal<'all' | 'Income' | 'Expense'>('all');
    showModal = signal(false);
    isSaving = signal(false);
    formError = signal('');
    formData = { type: 'Income', amount: 0, description: '', category: '', cariAccountId: '' };

    cariAccounts = signal<CariAccount[]>([]);
    cariMap = signal<Record<string, string>>({});
    items = signal<any[]>([]);

    ngOnInit(): void {
        this.loadCariAccounts();
        this.loadItems();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => {
                this.cariAccounts.set(data);
                const map: Record<string, string> = {};
                data.forEach(c => map[c.id] = c.name);
                this.cariMap.set(map);
                // Re-map items if already loaded
                if (this.items().length) this.loadItems();
            },
            error: () => {}
        });
    }

    loadItems(): void {
        this.financeService.getAll().subscribe({
            next: (data) => {
                const map = this.cariMap();
                this.items.set(data.map(m => ({
                    id: m.id,
                    type: m.type === FinanceMovementType.Income ? 'Income' : 'Expense',
                    amount: m.amount,
                    description: m.description || '',
                    category: m.referenceNo || '—',
                    cariAccountName: map[m.cariAccountId] || m.cariAccountId.substring(0, 8) + '...',
                    createdAt: m.movementDateUtc?.split('T')[0] || ''
                })));
            },
            error: (err) => console.error('Finans hareketleri yüklenemedi:', err.error?.detail || err.message)
        });
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    get filteredItems() {
        let list = this.items();
        if (this.activeTab() !== 'all') list = list.filter(i => i.type === this.activeTab());
        const t = this.searchTerm.toLowerCase();
        if (t) list = list.filter(i => i.description.toLowerCase().includes(t) || i.category.toLowerCase().includes(t));
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn;
            list = [...list].sort((a, b) => typeof a[col] === 'number' ? dir * (a[col] - b[col]) : dir * String(a[col]).localeCompare(String(b[col]), 'tr'));
        }
        return list;
    }

    get totalIncome() { return this.items().filter(i => i.type === 'Income').reduce((s, i) => s + i.amount, 0); }
    get totalExpense() { return this.items().filter(i => i.type === 'Expense').reduce((s, i) => s + i.amount, 0); }
    get netBalance() { return this.totalIncome - this.totalExpense; }

    openAddModal(): void {
        this.formData = { type: 'Income', amount: 0, description: '', category: '', cariAccountId: '' };
        this.formError.set('');
        this.showModal.set(true);
    }
    closeModal(): void { this.showModal.set(false); }

    save(): void {
        if (!this.formData.cariAccountId) {
            this.formError.set('Lütfen bir cari hesap seçin.');
            return;
        }
        if (this.formData.amount <= 0) {
            this.formError.set('Tutar sıfırdan büyük olmalıdır.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const request: CreateFinanceMovementRequest = {
            cariAccountId: this.formData.cariAccountId,
            type: this.formData.type === 'Income' ? FinanceMovementType.Income : FinanceMovementType.Expense,
            amount: this.formData.amount,
            description: this.formData.description || undefined,
            referenceNo: this.formData.category || undefined
        };

        this.financeService.create(request).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeModal();
                this.loadItems();
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Hareket oluşturulamadı.');
            }
        });
    }

    async deleteItem(id: string): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: 'Bu hareketi silmek istediğinize emin misiniz?',
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;
        this.financeService.delete(id).subscribe({
            next: () => { this.loadItems(); this.toastService.success('Silindi', 'Finans hareketi silindi'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}
