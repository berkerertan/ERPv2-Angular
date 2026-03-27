import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../core/services/accounting.service';
import { ChartOfAccountDto, UpsertChartOfAccountRequest, AccountType } from '../../core/models/accounting.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-chart-of-accounts',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chart-of-accounts.component.html',
    styleUrls: ['./chart-of-accounts.component.css', '../../shared/styles/crud-page.css']
})
export class ChartOfAccountsComponent implements OnInit {
    private accountingService = inject(AccountingService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    items = signal<ChartOfAccountDto[]>([]);
    searchTerm = '';
    typeFilter = signal<'all' | string>('all');

    showModal = signal(false);
    isSaving = signal(false);
    formError = signal('');
    editingId = signal<string | null>(null);

    formData = { code: '', name: '', type: AccountType.Asset as AccountType, isActive: true };

    readonly AccountType = AccountType;

    ngOnInit(): void { this.loadItems(); }

    loadItems(): void {
        this.accountingService.getChartOfAccounts().subscribe({
            next: data => this.items.set(data),
            error: () => this.toastService.error('Hata', 'Hesap planı yüklenemedi.')
        });
    }

    get filteredItems(): ChartOfAccountDto[] {
        let list = this.items();
        const tf = this.typeFilter();
        if (tf !== 'all') list = list.filter(i => i.type === +tf);
        const q = this.searchTerm.toLowerCase();
        if (q) list = list.filter(i => (i.code || '').toLowerCase().includes(q) || (i.name || '').toLowerCase().includes(q));
        return list;
    }

    typeLabel(t: AccountType): string {
        const m: Record<number, string> = {
            [AccountType.Asset]: 'Varlık',
            [AccountType.Liability]: 'Borç',
            [AccountType.Equity]: 'Özkaynak',
            [AccountType.Revenue]: 'Gelir',
            [AccountType.Expense]: 'Gider'
        };
        return m[t] ?? '—';
    }

    typeClass(t: AccountType): string {
        const m: Record<number, string> = {
            [AccountType.Asset]: 'badge-info',
            [AccountType.Liability]: 'badge-danger',
            [AccountType.Equity]: 'badge-warning',
            [AccountType.Revenue]: 'badge-success',
            [AccountType.Expense]: 'badge-muted'
        };
        return m[t] ?? 'badge-secondary';
    }

    openAddModal(): void {
        this.editingId.set(null);
        this.formData = { code: '', name: '', type: AccountType.Asset, isActive: true };
        this.formError.set('');
        this.showModal.set(true);
    }

    openEditModal(item: ChartOfAccountDto): void {
        this.editingId.set(item.id);
        this.formData = { code: item.code || '', name: item.name || '', type: item.type, isActive: item.isActive };
        this.formError.set('');
        this.showModal.set(true);
    }

    save(): void {
        if (!this.formData.name.trim()) { this.formError.set('Hesap adı zorunludur.'); return; }
        this.isSaving.set(true);
        this.formError.set('');
        const req: UpsertChartOfAccountRequest = {
            code: this.formData.code || undefined,
            name: this.formData.name.trim(),
            type: this.formData.type,
            isActive: this.formData.isActive
        };
        const editing = this.editingId();
        if (editing) {
            this.accountingService.updateChartOfAccount(editing, req).subscribe({
                next: () => { this.isSaving.set(false); this.showModal.set(false); this.loadItems(); this.toastService.success('Başarılı', 'Hesap güncellendi.'); },
                error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
            });
            return;
        }

        this.accountingService.createChartOfAccount(req).subscribe({
            next: () => { this.isSaving.set(false); this.showModal.set(false); this.loadItems(); this.toastService.success('Başarılı', 'Hesap oluşturuldu.'); },
            error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
        });
    }

    async deleteItem(item: ChartOfAccountDto): Promise<void> {
        const confirmed = await this.confirmService.confirm({ title: 'Silme Onayı', message: `"${item.code} - ${item.name}" hesabını silmek istediğinize emin misiniz?`, confirmText: 'Sil', type: 'danger' });
        if (!confirmed) return;
        this.accountingService.deleteChartOfAccount(item.id).subscribe({
            next: () => { this.loadItems(); this.toastService.success('Silindi', 'Hesap silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }
}
