import { Component, signal, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../core/services/accounting.service';
import {
    BankAccountDto, UpsertBankAccountRequest,
    CashAccountDto, UpsertCashAccountRequest,
    BankTransactionDto, CashTransactionDto,
    BankTransactionType, CashTransactionType,
    CreateBankTransactionRequest, CreateCashTransactionRequest
} from '../../core/models/accounting.model';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../core/services/toast.service';

type ActiveTab = 'bank' | 'cash';

@Component({
    selector: 'app-treasury',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './treasury.component.html',
    styleUrls: ['./treasury.component.css', '../../shared/styles/crud-page.css']
})
export class TreasuryComponent implements OnInit {
    private accountingService = inject(AccountingService);
    private confirmService = inject(ConfirmService);
    private toastService = inject(ToastService);

    activeTab = signal<ActiveTab>('bank');

    // ── Bank Accounts ─────────────────────────────────────────
    bankAccounts = signal<BankAccountDto[]>([]);
    bankTransactions = signal<BankTransactionDto[]>([]);
    selectedBankAccount = signal<BankAccountDto | null>(null);

    // ── Cash Accounts ─────────────────────────────────────────
    cashAccounts = signal<CashAccountDto[]>([]);
    cashTransactions = signal<CashTransactionDto[]>([]);
    selectedCashAccount = signal<CashAccountDto | null>(null);

    // ── Stats ─────────────────────────────────────────────────
    totalBankBalance = computed(() => this.bankAccounts().reduce((s, a) => s + a.balance, 0));
    totalCashBalance = computed(() => this.cashAccounts().reduce((s, a) => s + a.balance, 0));
    totalBalance = computed(() => this.totalBankBalance() + this.totalCashBalance());

    // ── Modals ────────────────────────────────────────────────
    showBankModal = signal(false);
    showCashModal = signal(false);
    showBankTxModal = signal(false);
    showCashTxModal = signal(false);
    isSaving = signal(false);
    formError = signal('');

    editingBankId = signal<string | null>(null);
    editingCashId = signal<string | null>(null);

    bankForm = { bankName: '', branchName: '', iban: '', currency: 'TRY' };
    cashForm = { code: '', name: '', currency: 'TRY' };

    bankTxForm = { type: BankTransactionType.Deposit as BankTransactionType, amount: 0, description: '', referenceNo: '', transactionDateUtc: new Date().toISOString().split('T')[0] };
    cashTxForm = { type: CashTransactionType.Income as CashTransactionType, amount: 0, description: '', referenceNo: '', transactionDateUtc: new Date().toISOString().split('T')[0] };

    // Enum exports
    readonly BankTransactionType = BankTransactionType;
    readonly CashTransactionType = CashTransactionType;

    // ── Lifecycle ─────────────────────────────────────────────
    ngOnInit(): void {
        this.loadBankAccounts();
        this.loadCashAccounts();
    }

    loadBankAccounts(): void {
        this.accountingService.getBankAccounts().subscribe({
            next: data => this.bankAccounts.set(data),
            error: () => this.toastService.error('Hata', 'Banka hesapları yüklenemedi.')
        });
    }

    loadCashAccounts(): void {
        this.accountingService.getCashAccounts().subscribe({
            next: data => this.cashAccounts.set(data),
            error: () => this.toastService.error('Hata', 'Kasa hesapları yüklenemedi.')
        });
    }

    // ── Bank Account CRUD ─────────────────────────────────────
    openAddBankModal(): void {
        this.editingBankId.set(null);
        this.bankForm = { bankName: '', branchName: '', iban: '', currency: 'TRY' };
        this.formError.set('');
        this.showBankModal.set(true);
    }

    openEditBankModal(acc: BankAccountDto): void {
        this.editingBankId.set(acc.id);
        this.bankForm = { bankName: acc.bankName || '', branchName: acc.branchName || '', iban: acc.iban || '', currency: acc.currency || 'TRY' };
        this.formError.set('');
        this.showBankModal.set(true);
    }

    saveBankAccount(): void {
        if (!this.bankForm.bankName.trim()) { this.formError.set('Banka adı zorunludur.'); return; }
        this.isSaving.set(true);
        this.formError.set('');
        const req: UpsertBankAccountRequest = {
            bankName: this.bankForm.bankName.trim(),
            branchName: this.bankForm.branchName || undefined,
            iban: this.bankForm.iban || undefined,
            currency: this.bankForm.currency || 'TRY'
        };
        const editing = this.editingBankId();
        if (editing) {
            this.accountingService.updateBankAccount(editing, req).subscribe({
                next: () => { this.isSaving.set(false); this.showBankModal.set(false); this.loadBankAccounts(); this.toastService.success('Başarılı', 'Banka hesabı güncellendi.'); },
                error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
            });
            return;
        }

        this.accountingService.createBankAccount(req).subscribe({
            next: () => { this.isSaving.set(false); this.showBankModal.set(false); this.loadBankAccounts(); this.toastService.success('Başarılı', 'Banka hesabı oluşturuldu.'); },
            error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
        });
    }

    async deleteBankAccount(acc: BankAccountDto): Promise<void> {
        const confirmed = await this.confirmService.confirm({ title: 'Silme Onayı', message: `"${acc.bankName}" banka hesabını silmek istediğinize emin misiniz?`, confirmText: 'Sil', type: 'danger' });
        if (!confirmed) return;
        this.accountingService.deleteBankAccount(acc.id).subscribe({
            next: () => { this.loadBankAccounts(); this.toastService.success('Silindi', 'Banka hesabı silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    // ── Cash Account CRUD ─────────────────────────────────────
    openAddCashModal(): void {
        this.editingCashId.set(null);
        this.cashForm = { code: '', name: '', currency: 'TRY' };
        this.formError.set('');
        this.showCashModal.set(true);
    }

    openEditCashModal(acc: CashAccountDto): void {
        this.editingCashId.set(acc.id);
        this.cashForm = { code: acc.code || '', name: acc.name || '', currency: acc.currency || 'TRY' };
        this.formError.set('');
        this.showCashModal.set(true);
    }

    saveCashAccount(): void {
        if (!this.cashForm.name.trim()) { this.formError.set('Kasa adı zorunludur.'); return; }
        if (!this.cashForm.code.trim()) { this.formError.set('Kasa kodu zorunludur.'); return; }
        this.isSaving.set(true);
        this.formError.set('');
        const req: UpsertCashAccountRequest = { code: this.cashForm.code.trim(), name: this.cashForm.name.trim(), currency: this.cashForm.currency || 'TRY' };
        const editing = this.editingCashId();
        if (editing) {
            this.accountingService.updateCashAccount(editing, req).subscribe({
                next: () => { this.isSaving.set(false); this.showCashModal.set(false); this.loadCashAccounts(); this.toastService.success('Başarılı', 'Kasa güncellendi.'); },
                error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
            });
            return;
        }

        this.accountingService.createCashAccount(req).subscribe({
            next: () => { this.isSaving.set(false); this.showCashModal.set(false); this.loadCashAccounts(); this.toastService.success('Başarılı', 'Kasa oluşturuldu.'); },
            error: (err: any) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
        });
    }

    async deleteCashAccount(acc: CashAccountDto): Promise<void> {
        const confirmed = await this.confirmService.confirm({ title: 'Silme Onayı', message: `"${acc.name}" kasasını silmek istediğinize emin misiniz?`, confirmText: 'Sil', type: 'danger' });
        if (!confirmed) return;
        this.accountingService.deleteCashAccount(acc.id).subscribe({
            next: () => { this.loadCashAccounts(); this.toastService.success('Silindi', 'Kasa silindi.'); },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Silme başarısız.')
        });
    }

    // ── Bank Transactions ─────────────────────────────────────
    selectBankAccount(acc: BankAccountDto): void {
        this.selectedBankAccount.set(acc);
        this.accountingService.getBankTransactions(acc.id).subscribe({
            next: data => this.bankTransactions.set(data),
            error: () => this.toastService.error('Hata', 'Banka hareketleri yüklenemedi.')
        });
    }

    openBankTxModal(): void {
        this.bankTxForm = { type: BankTransactionType.Deposit, amount: 0, description: '', referenceNo: '', transactionDateUtc: new Date().toISOString().split('T')[0] };
        this.formError.set('');
        this.showBankTxModal.set(true);
    }

    saveBankTx(): void {
        if (this.bankTxForm.amount <= 0) { this.formError.set('Tutar sıfırdan büyük olmalıdır.'); return; }
        const acc = this.selectedBankAccount();
        if (!acc) return;
        this.isSaving.set(true);
        this.formError.set('');
        const req: CreateBankTransactionRequest = {
            type: this.bankTxForm.type,
            amount: this.bankTxForm.amount,
            description: this.bankTxForm.description || undefined,
            referenceNo: this.bankTxForm.referenceNo || undefined,
            transactionDateUtc: this.bankTxForm.transactionDateUtc || undefined
        };
        this.accountingService.createBankTransaction(acc.id, req).subscribe({
            next: () => { this.isSaving.set(false); this.showBankTxModal.set(false); this.selectBankAccount(acc); this.loadBankAccounts(); this.toastService.success('Kaydedildi', 'Banka hareketi oluşturuldu.'); },
            error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
        });
    }

    bankTxTypeLabel(type: BankTransactionType): string {
        const m: Record<number, string> = { [BankTransactionType.Deposit]: 'Yatırma', [BankTransactionType.Withdrawal]: 'Çekim', [BankTransactionType.Transfer]: 'Transfer', [BankTransactionType.Fee]: 'Masraf' };
        return m[type] ?? '—';
    }

    // ── Cash Transactions ─────────────────────────────────────
    selectCashAccount(acc: CashAccountDto): void {
        this.selectedCashAccount.set(acc);
        this.accountingService.getCashTransactions(acc.id).subscribe({
            next: data => this.cashTransactions.set(data),
            error: () => this.toastService.error('Hata', 'Kasa hareketleri yüklenemedi.')
        });
    }

    openCashTxModal(): void {
        this.cashTxForm = { type: CashTransactionType.Income, amount: 0, description: '', referenceNo: '', transactionDateUtc: new Date().toISOString().split('T')[0] };
        this.formError.set('');
        this.showCashTxModal.set(true);
    }

    saveCashTx(): void {
        if (this.cashTxForm.amount <= 0) { this.formError.set('Tutar sıfırdan büyük olmalıdır.'); return; }
        const acc = this.selectedCashAccount();
        if (!acc) return;
        this.isSaving.set(true);
        this.formError.set('');
        const req: CreateCashTransactionRequest = {
            type: this.cashTxForm.type,
            amount: this.cashTxForm.amount,
            description: this.cashTxForm.description || undefined,
            referenceNo: this.cashTxForm.referenceNo || undefined,
            transactionDateUtc: this.cashTxForm.transactionDateUtc || undefined
        };
        this.accountingService.createCashTransaction(acc.id, req).subscribe({
            next: () => { this.isSaving.set(false); this.showCashTxModal.set(false); this.selectCashAccount(acc); this.loadCashAccounts(); this.toastService.success('Kaydedildi', 'Kasa hareketi oluşturuldu.'); },
            error: (err) => { this.isSaving.set(false); this.formError.set(err.error?.detail || err.error || 'İşlem başarısız.'); }
        });
    }

    cashTxTypeLabel(type: CashTransactionType): string {
        const m: Record<number, string> = { [CashTransactionType.Income]: 'Gelir', [CashTransactionType.Expense]: 'Gider', [CashTransactionType.Transfer]: 'Transfer', [CashTransactionType.Adjustment]: 'Düzeltme' };
        return m[type] ?? '—';
    }

    // Helpers
    fc(n: number): string { return '₺' + n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
}
