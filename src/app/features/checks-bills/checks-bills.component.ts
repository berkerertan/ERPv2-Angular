import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CheckBillService } from '../../core/services/check-bill.service';
import { CariAccountService } from '../../core/services/cari-account.service';
import {
    CheckNoteDto, CheckNoteDueListItemDto,
    CheckNoteType, CheckNoteDirection, CheckNoteStatus,
    UpsertCheckNoteRequest, UpdateCheckNoteStatusRequest
} from '../../core/models/check-bill.model';

type ActiveTab = 'list' | 'due';
type FormMode = 'create' | 'edit' | null;

@Component({
    selector: 'app-checks-bills',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './checks-bills.component.html',
    styleUrls: ['./checks-bills.component.css', '../../shared/styles/crud-page.css']
})
export class ChecksBillsComponent implements OnInit {
    private svc = inject(CheckBillService);
    private cariSvc = inject(CariAccountService);

    // Enums — template'te erişim için
    readonly CheckNoteType = CheckNoteType;
    readonly CheckNoteDirection = CheckNoteDirection;
    readonly CheckNoteStatus = CheckNoteStatus;

    // State
    activeTab = signal<ActiveTab>('list');
    loading = signal(false);
    items = signal<CheckNoteDto[]>([]);
    dueList = signal<CheckNoteDueListItemDto[]>([]);

    // Filters
    filterType = signal<number | null>(null);
    filterDirection = signal<number | null>(null);
    filterStatus = signal<number | null>(null);

    // Cari suggestions
    cariSuggestions: { id: string; name: string; code: string }[] = [];
    private cariSearchTimer: any = null;

    // Form
    formMode = signal<FormMode>(null);
    editingId = signal<string | null>(null);
    formLoading = signal(false);
    formError = signal('');
    form: UpsertCheckNoteRequest = this.emptyForm();

    // Status update modal
    statusModal = signal(false);
    statusTarget = signal<CheckNoteDto | null>(null);
    statusForm: UpdateCheckNoteStatusRequest = { status: CheckNoteStatus.Portfolio };
    statusLoading = signal(false);
    statusError = signal('');

    // Delete confirm
    deleteTarget = signal<CheckNoteDto | null>(null);
    deleteLoading = signal(false);

    // Toast
    toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
    private toastTimer: any = null;

    // Computed filtered list
    readonly filtered = computed(() => {
        let result = this.items();
        const ft = this.filterType();
        const fd = this.filterDirection();
        const fs = this.filterStatus();
        if (ft != null) result = result.filter(i => i.type === ft);
        if (fd != null) result = result.filter(i => i.direction === fd);
        if (fs != null) result = result.filter(i => i.status === fs);
        return result;
    });

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.svc.getAll().subscribe({
            next: data => { this.items.set(data); this.loading.set(false); },
            error: () => { this.loading.set(false); this.showToast('Liste yüklenemedi', 'error'); }
        });
        this.svc.getDueList().subscribe({
            next: data => this.dueList.set(data),
            error: () => {}
        });
    }

    setTab(tab: ActiveTab): void {
        this.activeTab.set(tab);
    }

    // ─── Labels ────────────────────────────────────────────
    typeLabel(t: CheckNoteType): string {
        return t === CheckNoteType.Check ? 'Çek' : 'Senet';
    }

    dirLabel(d: CheckNoteDirection): string {
        return d === CheckNoteDirection.Receivable ? 'Tahsil' : 'Ödeme';
    }

    statusLabel(s: CheckNoteStatus): string {
        const map: Record<number, string> = {
            1: 'Portföyde', 2: 'Ciro Edildi', 3: 'Protesto',
            4: 'Tahsil Edildi', 5: 'Ödendi', 6: 'İptal'
        };
        return map[s] || '—';
    }

    statusClass(s: CheckNoteStatus): string {
        const map: Record<number, string> = {
            1: 'badge-portfolio', 2: 'badge-endorsed', 3: 'badge-protested',
            4: 'badge-collected', 5: 'badge-paid', 6: 'badge-cancelled'
        };
        return map[s] || '';
    }

    isSettled(item: CheckNoteDto): boolean {
        return item.status === CheckNoteStatus.Collected ||
               item.status === CheckNoteStatus.Paid ||
               item.status === CheckNoteStatus.Cancelled;
    }

    dueClass(days: number): string {
        if (days < 0) return 'overdue';
        if (days <= 7) return 'due-soon';
        if (days <= 30) return 'due-warning';
        return 'due-ok';
    }

    // ─── Form ──────────────────────────────────────────────
    openCreate(): void {
        this.form = this.emptyForm();
        this.formError.set('');
        this.editingId.set(null);
        this.formMode.set('create');
        this.cariSuggestions = [];
    }

    openEdit(item: CheckNoteDto): void {
        this.form = {
            code: item.code,
            type: item.type,
            direction: item.direction,
            cariAccountId: item.cariAccountId,
            amount: item.amount,
            currency: item.currency,
            issueDateUtc: item.issueDateUtc.slice(0, 10),
            dueDateUtc: item.dueDateUtc.slice(0, 10),
            bankName: item.bankName || '',
            branchName: item.branchName || '',
            accountNo: item.accountNo || '',
            serialNo: item.serialNo || '',
            description: item.description || ''
        };
        this.cariSuggestions = [{ id: item.cariAccountId, name: item.cariName, code: item.cariCode }];
        this.formError.set('');
        this.editingId.set(item.id);
        this.formMode.set('edit');
    }

    closeForm(): void {
        this.formMode.set(null);
        this.editingId.set(null);
        this.cariSuggestions = [];
    }

    onCariSearch(term: string): void {
        if (this.cariSearchTimer) clearTimeout(this.cariSearchTimer);
        if (!term || term.length < 2) { this.cariSuggestions = []; return; }
        this.cariSearchTimer = setTimeout(() => {
            this.cariSvc.suggest(term).subscribe({
                next: (list) => {
                    this.cariSuggestions = list.map((c: any) => ({
                        id: c.id, name: c.name, code: c.code
                    }));
                },
                error: () => {}
            });
        }, 250);
    }

    get selectedCariName(): string {
        const found = this.cariSuggestions.find(c => c.id === this.form.cariAccountId);
        return found ? `${found.name} (${found.code})` : '';
    }

    selectCari(c: { id: string; name: string; code: string }): void {
        this.form = { ...this.form, cariAccountId: c.id };
        this.cariSuggestions = [c];
    }

    submitForm(): void {
        this.formError.set('');
        if (!this.form.code || !this.form.cariAccountId || !this.form.amount || !this.form.dueDateUtc) {
            this.formError.set('Kod, cari hesap, tutar ve vade tarihi zorunludur.');
            return;
        }
        const payload: UpsertCheckNoteRequest = {
            ...this.form,
            issueDateUtc: new Date(this.form.issueDateUtc).toISOString(),
            dueDateUtc: new Date(this.form.dueDateUtc).toISOString(),
            amount: Number(this.form.amount)
        };
        this.formLoading.set(true);
        const isEdit = this.formMode() === 'edit' && !!this.editingId();
        const label = isEdit ? 'Güncellendi' : 'Oluşturuldu';
        const onSuccess = () => {
            this.formLoading.set(false);
            this.closeForm();
            this.load();
            this.showToast(label, 'success');
        };
        const onError = (err: any) => {
            this.formLoading.set(false);
            this.formError.set(err.error?.detail || 'Kaydedilemedi.');
        };
        if (isEdit) {
            this.svc.update(this.editingId()!, payload).subscribe({ next: onSuccess, error: onError });
        } else {
            this.svc.create(payload).subscribe({ next: onSuccess, error: onError });
        }
    }

    // ─── Status Update ─────────────────────────────────────
    openStatusModal(item: CheckNoteDto): void {
        this.statusTarget.set(item);
        this.statusForm = { status: item.status, note: '' };
        this.statusError.set('');
        this.statusModal.set(true);
    }

    closeStatusModal(): void {
        this.statusModal.set(false);
        this.statusTarget.set(null);
    }

    submitStatus(): void {
        const target = this.statusTarget();
        if (!target) return;
        this.statusLoading.set(true);
        this.statusError.set('');
        this.svc.updateStatus(target.id, this.statusForm).subscribe({
            next: () => {
                this.statusLoading.set(false);
                this.closeStatusModal();
                this.load();
                this.showToast('Durum güncellendi', 'success');
            },
            error: (err) => {
                this.statusLoading.set(false);
                this.statusError.set(err.error?.detail || 'Durum güncellenemedi.');
            }
        });
    }

    // ─── Delete ────────────────────────────────────────────
    openDelete(item: CheckNoteDto): void {
        this.deleteTarget.set(item);
    }

    cancelDelete(): void {
        this.deleteTarget.set(null);
    }

    confirmDelete(): void {
        const target = this.deleteTarget();
        if (!target) return;
        this.deleteLoading.set(true);
        this.svc.delete(target.id).subscribe({
            next: () => {
                this.deleteLoading.set(false);
                this.deleteTarget.set(null);
                this.load();
                this.showToast('Silindi', 'success');
            },
            error: (err) => {
                this.deleteLoading.set(false);
                this.showToast(err.error?.detail || 'Silinemedi', 'error');
            }
        });
    }

    // ─── Toast ─────────────────────────────────────────────
    showToast(msg: string, type: 'success' | 'error'): void {
        this.toast.set({ msg, type });
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
    }

    private emptyForm(): UpsertCheckNoteRequest {
        const today = new Date().toISOString().slice(0, 10);
        return {
            code: '',
            type: CheckNoteType.Check,
            direction: CheckNoteDirection.Receivable,
            cariAccountId: '',
            amount: 0,
            currency: 'TRY',
            issueDateUtc: today,
            dueDateUtc: today,
            bankName: '',
            branchName: '',
            accountNo: '',
            serialNo: '',
            description: ''
        };
    }
}
