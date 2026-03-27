import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckNoteService } from '../../core/services/check-bill.service';
import {
    CheckNote,
    CheckNoteType,
    CheckNoteDirection,
    CheckNoteStatus,
    TreasuryChannel,
    UpsertCheckNoteRequest,
    UpdateCheckNoteStatusRequest,
    SettleCheckNoteRequest
} from '../../core/models/check-bill.model';
import { AccountingService } from '../../core/services/accounting.service';
import { CashAccountDto, BankAccountDto } from '../../core/models/accounting.model';
import { CariAccountService } from '../../core/services/cari-account.service';
import { CariAccount } from '../../core/models/cari-account.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

@Component({
    selector: 'app-checks-bills',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './checks-bills.component.html',
    styleUrls: ['./checks-bills.component.css', '../../shared/styles/crud-page.css']
})
export class ChecksBillsComponent implements OnInit {
    private checkNoteService = inject(CheckNoteService);
    private accountingService = inject(AccountingService);
    private cariAccountService = inject(CariAccountService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    // ─── State ───────────────────────────────────────────────────────
    items = signal<CheckNote[]>([]);
    cariAccounts = signal<CariAccount[]>([]);
    cariMap = signal<Record<string, string>>({});

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // Filters
    activeTypeTab = signal<'all' | 'check' | 'promissoryNote'>('all');
    activeDirectionTab = signal<'all' | 'receivable' | 'payable'>('all');
    statusFilter = signal<'all' | string>('all');

    // Treasury accounts
    cashAccounts = signal<CashAccountDto[]>([]);
    bankAccounts = signal<BankAccountDto[]>([]);

    // Modals
    showModal = signal(false);
    showStatusModal = signal(false);
    showSettleModal = signal(false);
    isSaving = signal(false);
    formError = signal('');
    editingItem = signal<CheckNote | null>(null);
    statusItem = signal<CheckNote | null>(null);
    settleItem = signal<CheckNote | null>(null);

    // Form
    formData = this.emptyForm();

    // Status change form
    statusFormData = {
        status: CheckNoteStatus.Endorsed as CheckNoteStatus,
        note: ''
    };

    // Settle form
    settleFormData = {
        channel: TreasuryChannel.Bank as TreasuryChannel,
        treasuryAccountId: '',
        transactionDateUtc: new Date().toISOString().split('T')[0],
        description: '',
        referenceNo: ''
    };

    // ─── Computed Stats ──────────────────────────────────────────────
    totalReceivable = computed(() => this.items()
        .filter(i => i.direction === CheckNoteDirection.Receivable)
        .reduce((s, i) => s + i.amount, 0));

    totalPayable = computed(() => this.items()
        .filter(i => i.direction === CheckNoteDirection.Payable)
        .reduce((s, i) => s + i.amount, 0));

    pendingCount = computed(() => this.items()
        .filter(i => i.status === CheckNoteStatus.Portfolio || i.status === CheckNoteStatus.Endorsed)
        .length);

    overdueCount = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.items().filter(i =>
            i.dueDateUtc.split('T')[0] < today &&
            (i.status === CheckNoteStatus.Portfolio || i.status === CheckNoteStatus.Endorsed)
        ).length;
    });

    // ─── Lifecycle ───────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadCariAccounts();
        this.loadItems();
        this.loadTreasuryAccounts();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => {
                this.cariAccounts.set(data);
                const map: Record<string, string> = {};
                data.forEach(c => map[c.id] = c.name);
                this.cariMap.set(map);
            },
            error: () => {}
        });
    }

    private loadTreasuryAccounts(): void {
        this.accountingService.getCashAccounts().subscribe({
            next: data => this.cashAccounts.set(data),
            error: () => {}
        });
        this.accountingService.getBankAccounts().subscribe({
            next: data => this.bankAccounts.set(data),
            error: () => {}
        });
    }

    loadItems(): void {
        this.checkNoteService.getAll().subscribe({
            next: (data) => this.items.set(data),
            error: () => this.toastService.error('Hata', 'Çek/Senet listesi yüklenemedi.')
        });
    }

    // ─── Filtering & Sorting ─────────────────────────────────────────
    get filteredItems(): CheckNote[] {
        let list = this.items();

        // Type filter
        const typeTab = this.activeTypeTab();
        if (typeTab === 'check') list = list.filter(i => i.type === CheckNoteType.Check);
        else if (typeTab === 'promissoryNote') list = list.filter(i => i.type === CheckNoteType.PromissoryNote);

        // Direction filter
        const dirTab = this.activeDirectionTab();
        if (dirTab === 'receivable') list = list.filter(i => i.direction === CheckNoteDirection.Receivable);
        else if (dirTab === 'payable') list = list.filter(i => i.direction === CheckNoteDirection.Payable);

        // Status filter
        const sf = this.statusFilter();
        if (sf !== 'all') list = list.filter(i => i.status === +sf);

        // Search
        const t = this.searchTerm.toLowerCase();
        if (t) {
            list = list.filter(i =>
                i.code.toLowerCase().includes(t) ||
                (i.serialNo || '').toLowerCase().includes(t) ||
                (i.bankName || '').toLowerCase().includes(t) ||
                (i.cariName || '').toLowerCase().includes(t) ||
                (i.cariCode || '').toLowerCase().includes(t)
            );
        }

        // Sort
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof CheckNote;
            list = [...list].sort((a, b) => {
                const av = a[col] ?? '';
                const bv = b[col] ?? '';
                return typeof av === 'number'
                    ? dir * ((av as number) - (bv as number))
                    : dir * String(av).localeCompare(String(bv), 'tr');
            });
        }

        return list;
    }

    sort(col: string): void {
        if (this.sortColumn === col) { this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'; }
        else { this.sortColumn = col; this.sortDir = 'asc'; }
    }

    // ─── CRUD Modals ─────────────────────────────────────────────────
    private emptyForm() {
        return {
            code: '',
            type: CheckNoteType.Check as CheckNoteType,
            direction: CheckNoteDirection.Receivable as CheckNoteDirection,
            cariAccountId: '',
            bankName: '',
            branchName: '',
            accountNo: '',
            serialNo: '',
            amount: 0,
            currency: 'TRY',
            issueDateUtc: new Date().toISOString().split('T')[0],
            dueDateUtc: '',
            description: ''
        };
    }

    openAddModal(): void {
        this.editingItem.set(null);
        this.formData = this.emptyForm();
        this.formError.set('');
        this.showModal.set(true);
    }

    openEditModal(item: CheckNote): void {
        this.editingItem.set(item);
        this.formData = {
            code: item.code,
            type: item.type,
            direction: item.direction,
            cariAccountId: item.cariAccountId,
            bankName: item.bankName || '',
            branchName: item.branchName || '',
            accountNo: item.accountNo || '',
            serialNo: item.serialNo || '',
            amount: item.amount,
            currency: item.currency || 'TRY',
            issueDateUtc: item.issueDateUtc?.split('T')[0] || '',
            dueDateUtc: item.dueDateUtc?.split('T')[0] || '',
            description: item.description || ''
        };
        this.formError.set('');
        this.showModal.set(true);
    }

    closeModal(): void { this.showModal.set(false); }

    save(): void {
        // Validation
        if (!this.formData.code.trim()) {
            this.formError.set('Belge kodu zorunludur.');
            return;
        }
        if (!this.formData.cariAccountId) {
            this.formError.set('Lütfen bir cari hesap seçin.');
            return;
        }
        if (this.formData.amount <= 0) {
            this.formError.set('Tutar sıfırdan büyük olmalıdır.');
            return;
        }
        if (!this.formData.dueDateUtc) {
            this.formError.set('Vade tarihi zorunludur.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const editing = this.editingItem();

        const req: UpsertCheckNoteRequest = {
            code: this.formData.code.trim(),
            type: this.formData.type,
            direction: this.formData.direction,
            cariAccountId: this.formData.cariAccountId,
            amount: this.formData.amount,
            currency: this.formData.currency || 'TRY',
            issueDateUtc: this.formData.issueDateUtc || new Date().toISOString(),
            dueDateUtc: this.formData.dueDateUtc,
            bankName: this.formData.bankName || undefined,
            branchName: this.formData.branchName || undefined,
            accountNo: this.formData.accountNo || undefined,
            serialNo: this.formData.serialNo || undefined,
            description: this.formData.description || undefined
        };

        if (editing) {
            this.checkNoteService.update(editing.id, req).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.closeModal();
                    this.loadItems();
                    this.toastService.success('Güncellendi', 'Çek/Senet bilgileri güncellendi.');
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.formError.set(err.error?.detail || err.error || 'Güncelleme başarısız.');
                }
            });
        } else {
            this.checkNoteService.create(req).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.closeModal();
                    this.loadItems();
                    this.toastService.success('Oluşturuldu', 'Yeni çek/senet kaydedildi.');
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.formError.set(err.error?.detail || err.error || 'Kayıt oluşturulamadı.');
                }
            });
        }
    }

    // ─── Status Change ───────────────────────────────────────────────
    openStatusModal(item: CheckNote): void {
        this.statusItem.set(item);
        const defaultStatus = this.availableStatuses(item)[0]?.value ?? CheckNoteStatus.Endorsed;
        this.statusFormData = {
            status: defaultStatus,
            note: ''
        };
        this.formError.set('');
        this.showStatusModal.set(true);
    }

    closeStatusModal(): void { this.showStatusModal.set(false); }

    saveStatus(): void {
        const item = this.statusItem();
        if (!item) return;

        this.isSaving.set(true);
        this.formError.set('');

        const req: UpdateCheckNoteStatusRequest = {
            status: this.statusFormData.status,
            note: this.statusFormData.note || undefined
        };

        this.checkNoteService.changeStatus(item.id, req).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeStatusModal();
                this.loadItems();
                this.toastService.success('Güncellendi', `Durum "${this.statusLabel(req.status)}" olarak değiştirildi.`);
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || err.error || 'Durum değiştirilemedi.');
            }
        });
    }

    // ─── Settle (Tahsilat/Ödeme) ─────────────────────────────────────
    openSettleModal(item: CheckNote): void {
        this.settleItem.set(item);
        this.settleFormData = {
            channel: TreasuryChannel.Bank,
            treasuryAccountId: '',
            transactionDateUtc: new Date().toISOString().split('T')[0],
            description: '',
            referenceNo: ''
        };
        this.formError.set('');
        this.showSettleModal.set(true);
    }

    closeSettleModal(): void { this.showSettleModal.set(false); }

    /** Filtreli hazine hesabı listesi (channel'a göre) */
    get availableTreasuryAccounts(): { id: string; label: string }[] {
        if (this.settleFormData.channel === TreasuryChannel.Cash) {
            return this.cashAccounts().map(c => ({
                id: c.id,
                label: `${c.name || c.code || 'Kasa'} (${c.currency || 'TRY'}) — ₺${c.balance.toLocaleString('tr-TR')}`
            }));
        } else {
            return this.bankAccounts().map(b => ({
                id: b.id,
                label: `${b.bankName || ''} ${b.branchName || ''} ${b.iban || ''} (${b.currency || 'TRY'}) — ₺${b.balance.toLocaleString('tr-TR')}`.trim()
            }));
        }
    }

    saveSettle(): void {
        const item = this.settleItem();
        if (!item) return;

        if (!this.settleFormData.treasuryAccountId) {
            this.formError.set('Lütfen bir hesap seçin.');
            return;
        }

        this.isSaving.set(true);
        this.formError.set('');

        const req: SettleCheckNoteRequest = {
            channel: this.settleFormData.channel,
            treasuryAccountId: this.settleFormData.treasuryAccountId,
            transactionDateUtc: this.settleFormData.transactionDateUtc || undefined,
            description: this.settleFormData.description || undefined,
            referenceNo: this.settleFormData.referenceNo || undefined
        };

        this.checkNoteService.settle(item.id, req).subscribe({
            next: (result) => {
                this.isSaving.set(false);
                this.closeSettleModal();
                this.loadItems();
                this.loadTreasuryAccounts();
                const action = item.direction === CheckNoteDirection.Receivable ? 'Tahsil edildi' : 'Ödendi';
                this.toastService.success(action, `İşlem tamamlandı. Cari bakiye: ₺${result.cariBalance.toLocaleString('tr-TR')}`);
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.');
            }
        });
    }

    // ─── Delete ──────────────────────────────────────────────────────
    async deleteItem(item: CheckNote): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: `"${item.code}" kodlu belgeyi silmek istediğinize emin misiniz?`,
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;

        this.checkNoteService.delete(item.id).subscribe({
            next: () => {
                this.loadItems();
                this.toastService.success('Silindi', 'Çek/Senet kaydı silindi.');
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || err.error || 'Silme başarısız.')
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────
    typeLabel(type: CheckNoteType): string {
        return type === CheckNoteType.Check ? 'Çek' : 'Senet';
    }

    directionLabel(dir: CheckNoteDirection): string {
        return dir === CheckNoteDirection.Receivable ? 'Alacak' : 'Borç';
    }

    statusLabel(status: CheckNoteStatus): string {
        const labels: Record<number, string> = {
            [CheckNoteStatus.Portfolio]:  'Portföyde',
            [CheckNoteStatus.Endorsed]:   'Ciro Edildi',
            [CheckNoteStatus.Protested]:  'Protestolu',
            [CheckNoteStatus.Collected]:  'Tahsil Edildi',
            [CheckNoteStatus.Paid]:       'Ödendi',
            [CheckNoteStatus.Cancelled]:  'İptal'
        };
        return labels[status] ?? '—';
    }

    statusClass(status: CheckNoteStatus): string {
        const map: Record<number, string> = {
            [CheckNoteStatus.Portfolio]:  'info',
            [CheckNoteStatus.Endorsed]:   'warning',
            [CheckNoteStatus.Protested]:  'danger',
            [CheckNoteStatus.Collected]:  'success',
            [CheckNoteStatus.Paid]:       'success',
            [CheckNoteStatus.Cancelled]:  'muted'
        };
        return map[status] ?? 'muted';
    }

    directionIcon(dir: CheckNoteDirection): string {
        return dir === CheckNoteDirection.Receivable ? 'call_received' : 'call_made';
    }

    getCariName(item: CheckNote): string {
        return item.cariName || this.cariMap()[item.cariAccountId] || item.cariAccountId.substring(0, 8) + '...';
    }

    isOverdue(item: CheckNote): boolean {
        const today = new Date().toISOString().split('T')[0];
        return item.dueDateUtc.split('T')[0] < today &&
               (item.status === CheckNoteStatus.Portfolio || item.status === CheckNoteStatus.Endorsed);
    }

    formatDate(value?: string | null): string {
        if (!value) return '-';
        return value.split('T')[0] || value;
    }

    /** Durum değiştirme modalında gösterilecek seçenekler */
    availableStatuses(item: CheckNote | null): { value: CheckNoteStatus; label: string }[] {
        if (!item) return [];
        const s = CheckNoteStatus;
        const opts: { value: CheckNoteStatus; label: string }[] = [];

        // Backend status endpoint does NOT allow Collected/Paid (use settle endpoint instead)
        if (item.status === s.Portfolio) {
            opts.push({ value: s.Endorsed, label: 'Ciro Et' });
            opts.push({ value: s.Protested, label: 'Protesto Et' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        } else if (item.status === s.Endorsed) {
            opts.push({ value: s.Portfolio, label: 'Portföye İade' });
            opts.push({ value: s.Protested, label: 'Protesto Et' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        } else if (item.status === s.Protested) {
            opts.push({ value: s.Portfolio, label: 'Portföye Al' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        }

        return opts;
    }

    /** Whether this item can be settled (Collected/Paid via settle endpoint) */
    canSettle(item: CheckNote): boolean {
        return item.status === CheckNoteStatus.Portfolio || item.status === CheckNoteStatus.Endorsed;
    }

    /** Enum exports for template */
    readonly CheckNoteType = CheckNoteType;
    readonly CheckNoteDirection = CheckNoteDirection;
    readonly CheckNoteStatus = CheckNoteStatus;
    readonly TreasuryChannel = TreasuryChannel;
}
