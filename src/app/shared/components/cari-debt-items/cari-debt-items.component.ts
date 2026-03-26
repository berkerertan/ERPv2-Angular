import { Component, Input, signal, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CariAccountService } from '../../../core/services/cari-account.service';
import { CariDebtItem, CreateCariDebtItemRequest, UpdateCariDebtItemRequest } from '../../../core/models/cari-account.model';
import { ConfirmService } from '../confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-cari-debt-items',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cari-debt-items.component.html',
    styleUrls: ['./cari-debt-items.component.css']
})
export class CariDebtItemsComponent implements OnInit, OnChanges {
    @Input({ required: true }) cariAccountId!: string;

    private cariAccountService = inject(CariAccountService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    items = signal<CariDebtItem[]>([]);
    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    showModal = signal(false);
    isSaving = signal(false);
    formError = signal('');
    editingId = signal<string | null>(null);

    formData = this.emptyForm();

    // Stats
    get totalDebt(): number { return this.items().reduce((s, i) => s + i.totalAmount, 0); }
    get totalPayment(): number { return this.items().reduce((s, i) => s + i.payment, 0); }
    get totalRemaining(): number { return this.items().reduce((s, i) => s + i.remainingBalance, 0); }
    get itemCount(): number { return this.items().length; }

    get filteredItems(): CariDebtItem[] {
        let list = this.items();
        const q = this.searchTerm.toLowerCase();
        if (q) list = list.filter(i => (i.materialDescription || '').toLowerCase().includes(q));
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof CariDebtItem;
            list = [...list].sort((a, b) => {
                const av = a[col] ?? '';
                const bv = b[col] ?? '';
                return typeof av === 'number' ? dir * ((av as number) - (bv as number)) : dir * String(av).localeCompare(String(bv), 'tr');
            });
        }
        return list;
    }

    ngOnInit(): void { if (this.cariAccountId) this.loadItems(); }
    ngOnChanges(changes: SimpleChanges): void { if (changes['cariAccountId'] && !changes['cariAccountId'].firstChange) this.loadItems(); }

    loadItems(): void {
        this.cariAccountService.getDebtItems(this.cariAccountId).subscribe({
            next: data => this.items.set(data),
            error: () => this.toastService.error('Hata', 'Borç kalemleri yüklenemedi.')
        });
    }

    sort(col: string): void {
        if (this.sortColumn === col) this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    private emptyForm() {
        return {
            transactionDate: new Date().toISOString().split('T')[0],
            materialDescription: '',
            quantity: 1,
            listPrice: 0,
            salePrice: 0,
            totalAmount: 0,
            payment: 0,
            remainingBalance: 0
        };
    }

    openAddModal(): void {
        this.editingId.set(null);
        this.formData = this.emptyForm();
        this.formError.set('');
        this.showModal.set(true);
    }

    openEditModal(item: CariDebtItem): void {
        this.editingId.set(item.id);
        this.formData = {
            transactionDate: item.transactionDate?.split('T')[0] || '',
            materialDescription: item.materialDescription || '',
            quantity: item.quantity,
            listPrice: item.listPrice,
            salePrice: item.salePrice,
            totalAmount: item.totalAmount,
            payment: item.payment,
            remainingBalance: item.remainingBalance
        };
        this.formError.set('');
        this.showModal.set(true);
    }

    recalculate(): void {
        this.formData.totalAmount = this.formData.quantity * this.formData.salePrice;
        this.formData.remainingBalance = this.formData.totalAmount - this.formData.payment;
    }

    save(): void {
        if (!this.formData.transactionDate) { this.formError.set('İşlem tarihi zorunludur.'); return; }
        this.isSaving.set(true);
        this.formError.set('');

        const editing = this.editingId();
        if (editing) {
            const req: UpdateCariDebtItemRequest = { ...this.formData };
            this.cariAccountService.updateDebtItem(this.cariAccountId, editing, req).subscribe({
                next: () => { this.isSaving.set(false); this.showModal.set(false); this.loadItems(); this.toastService.success('Güncellendi', 'Borç kalemi güncellendi.'); },
                error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'Güncelleme başarısız.'); }
            });
        } else {
            const req: CreateCariDebtItemRequest = { ...this.formData };
            this.cariAccountService.createDebtItem(this.cariAccountId, req).subscribe({
                next: () => { this.isSaving.set(false); this.showModal.set(false); this.loadItems(); this.toastService.success('Oluşturuldu', 'Yeni borç kalemi kaydedildi.'); },
                error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'Kayıt başarısız.'); }
            });
        }
    }

    async deleteItem(item: CariDebtItem): Promise<void> {
        const confirmed = await this.confirmService.confirm({ title: 'Silme Onayı', message: `Bu borç kalemini silmek istediğinize emin misiniz?`, confirmText: 'Sil', type: 'danger' });
        if (!confirmed) return;
        this.cariAccountService.deleteDebtItem(this.cariAccountId, item.id).subscribe({
            next: () => { this.loadItems(); this.toastService.success('Silindi', 'Borç kalemi silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    fc(n: number): string { return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
