import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckBillService } from '../../core/services/check-bill.service';
import {
    CheckBill,
    CheckBillType,
    CheckBillDirection,
    CheckBillStatus,
    CreateCheckBillRequest,
    UpdateCheckBillRequest,
    ChangeCheckNoteStatusRequest
} from '../../core/models/check-bill.model';
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
    private checkBillService = inject(CheckBillService);
    private cariAccountService = inject(CariAccountService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    // ─── State ───────────────────────────────────────────────────────
    items = signal<CheckBill[]>([]);
    cariAccounts = signal<CariAccount[]>([]);

    searchTerm = '';
    sortColumn = '';
    sortDir: 'asc' | 'desc' = 'asc';

    // Filters
    activeTypeTab = signal<'all' | 'check' | 'promissory-note'>('all');
    activeDirectionTab = signal<'all' | 'receivable' | 'payable'>('all');
    statusFilter = signal<'all' | string>('all');

    // Modals
    showModal = signal(false);
    showStatusModal = signal(false);
    isSaving = signal(false);
    formError = signal('');
    editingItem = signal<CheckBill | null>(null);
    statusItem = signal<CheckBill | null>(null);

    // Form
    formData = this.emptyForm();

    // Status change form
    statusFormData = {
        status: CheckBillStatus.Protested as CheckBillStatus,
        note: ''
    };

    // ─── Computed Stats ──────────────────────────────────────────────
    totalReceivable = computed(() => this.items()
        .filter(i => i.direction === CheckBillDirection.Receivable)
        .reduce((s, i) => s + i.amount, 0));

    totalPayable = computed(() => this.items()
        .filter(i => i.direction === CheckBillDirection.Payable)
        .reduce((s, i) => s + i.amount, 0));

    pendingCount = computed(() => this.items()
        .filter(i =>
            i.status === CheckBillStatus.Portfolio ||
            i.status === CheckBillStatus.Endorsed ||
            i.status === CheckBillStatus.Protested
        ).length);

    overdueCount = computed(() => {
        const today = new Date().toISOString().split('T')[0];
        return this.items().filter(i =>
            i.dueDateUtc < today &&
            (i.status === CheckBillStatus.Portfolio ||
             i.status === CheckBillStatus.Endorsed ||
             i.status === CheckBillStatus.Protested)
        ).length;
    });

    // ─── Lifecycle ───────────────────────────────────────────────────
    ngOnInit(): void {
        this.loadCariAccounts();
        this.loadItems();
    }

    private loadCariAccounts(): void {
        this.cariAccountService.getAll().subscribe({
            next: (data) => this.cariAccounts.set(data),
            error: () => {}
        });
    }

    loadItems(): void {
        this.checkBillService.getAll().subscribe({
            next: (data) => this.items.set(data),
            error: () => this.toastService.error('Hata', 'Çek/Senet listesi yüklenemedi.')
        });
    }

    // ─── Filtering & Sorting ─────────────────────────────────────────
    get filteredItems(): CheckBill[] {
        let list = this.items();

        // Type filter
        const typeTab = this.activeTypeTab();
        if (typeTab === 'check') list = list.filter(i => i.type === CheckBillType.Check);
        else if (typeTab === 'promissory-note') list = list.filter(i => i.type === CheckBillType.PromissoryNote);

        // Direction filter
        const dirTab = this.activeDirectionTab();
        if (dirTab === 'receivable') list = list.filter(i => i.direction === CheckBillDirection.Receivable);
        else if (dirTab === 'payable') list = list.filter(i => i.direction === CheckBillDirection.Payable);

        // Status filter
        const sf = this.statusFilter();
        if (sf !== 'all') list = list.filter(i => i.status === +sf);

        // Search
        const t = this.searchTerm.toLowerCase();
        if (t) {
            list = list.filter(i =>
                i.code.toLowerCase().includes(t) ||
                i.cariName.toLowerCase().includes(t) ||
                (i.bankName || '').toLowerCase().includes(t) ||
                (i.serialNo || '').toLowerCase().includes(t)
            );
        }

        // Sort
        if (this.sortColumn) {
            const dir = this.sortDir === 'asc' ? 1 : -1;
            const col = this.sortColumn as keyof CheckBill;
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
            type: CheckBillType.Check as CheckBillType,
            direction: CheckBillDirection.Receivable as CheckBillDirection,
            code: '',
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

    openEditModal(item: CheckBill): void {
        this.editingItem.set(item);
        this.formData = {
            type: item.type,
            direction: item.direction,
            code: item.code,
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

        if (editing) {
            const req: UpdateCheckBillRequest = {
                code: this.formData.code,
                type: this.formData.type,
                direction: this.formData.direction,
                cariAccountId: this.formData.cariAccountId,
                amount: this.formData.amount,
                currency: this.formData.currency || 'TRY',
                issueDateUtc: this.formData.issueDateUtc || undefined,
                dueDateUtc: this.formData.dueDateUtc,
                bankName: this.formData.bankName || undefined,
                branchName: this.formData.branchName || undefined,
                accountNo: this.formData.accountNo || undefined,
                serialNo: this.formData.serialNo || undefined,
                description: this.formData.description || undefined
            };
            this.checkBillService.update(editing.id, req).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.closeModal();
                    this.loadItems();
                    this.toastService.success('Güncellendi', 'Çek/Senet bilgileri güncellendi.');
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.formError.set(err.error?.detail || 'Güncelleme başarısız.');
                }
            });
        } else {
            const req: CreateCheckBillRequest = {
                code: this.formData.code,
                type: this.formData.type,
                direction: this.formData.direction,
                cariAccountId: this.formData.cariAccountId,
                amount: this.formData.amount,
                currency: this.formData.currency || 'TRY',
                issueDateUtc: this.formData.issueDateUtc || undefined,
                dueDateUtc: this.formData.dueDateUtc,
                bankName: this.formData.bankName || undefined,
                branchName: this.formData.branchName || undefined,
                accountNo: this.formData.accountNo || undefined,
                serialNo: this.formData.serialNo || undefined,
                description: this.formData.description || undefined
            };
            this.checkBillService.create(req).subscribe({
                next: () => {
                    this.isSaving.set(false);
                    this.closeModal();
                    this.loadItems();
                    this.toastService.success('Oluşturuldu', 'Yeni çek/senet kaydedildi.');
                },
                error: (err) => {
                    this.isSaving.set(false);
                    this.formError.set(err.error?.detail || 'Kayıt oluşturulamadı.');
                }
            });
        }
    }

    // ─── Status Change ───────────────────────────────────────────────
    openStatusModal(item: CheckBill): void {
        this.statusItem.set(item);
        const opts = this.availableStatuses(item);
        this.statusFormData = {
            status: opts[0]?.value ?? CheckBillStatus.Protested,
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

        const req: ChangeCheckNoteStatusRequest = {
            status: this.statusFormData.status,
            note: this.statusFormData.note || undefined
        };

        this.checkBillService.changeStatus(item.id, req).subscribe({
            next: () => {
                this.isSaving.set(false);
                this.closeStatusModal();
                this.loadItems();
                this.toastService.success('Güncellendi', `Durum "${this.statusLabel(req.status)}" olarak değiştirildi.`);
            },
            error: (err) => {
                this.isSaving.set(false);
                this.formError.set(err.error?.detail || 'Durum değiştirilemedi.');
            }
        });
    }

    // ─── Delete ──────────────────────────────────────────────────────
    async deleteItem(item: CheckBill): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Silme Onayı',
            message: `"${item.code}" kodlu belgeyi silmek istediğinize emin misiniz?`,
            confirmText: 'Sil',
            type: 'danger'
        });
        if (!confirmed) return;

        this.checkBillService.delete(item.id).subscribe({
            next: () => {
                this.loadItems();
                this.toastService.success('Silindi', 'Çek/Senet kaydı silindi.');
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    // ─── Helpers ─────────────────────────────────────────────────────
    typeLabel(type: CheckBillType): string {
        return type === CheckBillType.Check ? 'Çek' : 'Senet';
    }

    directionLabel(dir: CheckBillDirection): string {
        return dir === CheckBillDirection.Receivable ? 'Alacak' : 'Borç';
    }

    statusLabel(status: CheckBillStatus): string {
        const labels: Record<number, string> = {
            [CheckBillStatus.Portfolio]:  'Portföyde',
            [CheckBillStatus.Endorsed]:   'Ciro Edildi',
            [CheckBillStatus.Protested]:  'Protesto',
            [CheckBillStatus.Collected]:  'Tahsil Edildi',
            [CheckBillStatus.Paid]:       'Ödendi',
            [CheckBillStatus.Cancelled]:  'İptal'
        };
        return labels[status] ?? '—';
    }

    statusClass(status: CheckBillStatus): string {
        const map: Record<number, string> = {
            [CheckBillStatus.Portfolio]:  'info',
            [CheckBillStatus.Endorsed]:   'warning',
            [CheckBillStatus.Protested]:  'danger',
            [CheckBillStatus.Collected]:  'success',
            [CheckBillStatus.Paid]:       'success',
            [CheckBillStatus.Cancelled]:  'muted'
        };
        return map[status] ?? 'muted';
    }

    directionIcon(dir: CheckBillDirection): string {
        return dir === CheckBillDirection.Receivable ? 'call_received' : 'call_made';
    }

    isOverdue(item: CheckBill): boolean {
        const today = new Date().toISOString().split('T')[0];
        return item.dueDateUtc < today &&
               (item.status === CheckBillStatus.Portfolio ||
                item.status === CheckBillStatus.Endorsed ||
                item.status === CheckBillStatus.Protested);
    }

    /** Durum değiştirme modalında gösterilecek seçenekler */
    availableStatuses(item: CheckBill | null): { value: CheckBillStatus; label: string }[] {
        if (!item) return [];
        const s = CheckBillStatus;
        const opts: { value: CheckBillStatus; label: string }[] = [];

        if (item.status === s.Portfolio) {
            if (item.direction === CheckBillDirection.Receivable) {
                opts.push({ value: s.Endorsed, label: 'Ciro Et' });
            }
            opts.push({ value: s.Protested, label: 'Protesto Et' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        } else if (item.status === s.Endorsed) {
            opts.push({ value: s.Protested, label: 'Protesto Et' });
            opts.push({ value: s.Portfolio, label: 'Portföye İade' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        } else if (item.status === s.Protested) {
            opts.push({ value: s.Portfolio, label: 'Portföye Al' });
            opts.push({ value: s.Cancelled, label: 'İptal Et' });
        }

        return opts;
    }

    /** Enum exports for template */
    readonly CheckBillType = CheckBillType;
    readonly CheckBillDirection = CheckBillDirection;
    readonly CheckBillStatus = CheckBillStatus;
}
