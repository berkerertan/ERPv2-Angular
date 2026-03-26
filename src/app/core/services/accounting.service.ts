import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    AccountType,
    ChartOfAccountDto,
    UpsertChartOfAccountRequest,
    JournalEntryDto,
    JournalEntryStatus,
    UpsertJournalEntryRequest,
    CashAccountDto,
    UpsertCashAccountRequest,
    CashTransactionDto,
    CreateCashTransactionRequest,
    BankAccountDto,
    UpsertBankAccountRequest,
    BankTransactionDto,
    CreateBankTransactionRequest,
    CreateCollectionPaymentRequest,
    CollectionPaymentResultDto
} from '../models/accounting.model';

@Injectable({ providedIn: 'root' })
export class AccountingService {
    private readonly apiUrl = `${environment.apiUrl}/api/accounting`;

    constructor(private http: HttpClient) {}

    // ── Chart of Accounts ──────────────────────────────────────────────
    getChartOfAccounts(q?: string, type?: AccountType, isActive?: boolean): Observable<ChartOfAccountDto[]> {
        let params = new HttpParams();
        if (q) params = params.set('q', q);
        if (type !== undefined) params = params.set('type', type.toString());
        if (isActive !== undefined) params = params.set('isActive', isActive.toString());
        return this.http.get<ChartOfAccountDto[]>(`${this.apiUrl}/chart-of-accounts`, { params });
    }

    getChartOfAccount(id: string): Observable<ChartOfAccountDto> {
        return this.http.get<ChartOfAccountDto>(`${this.apiUrl}/chart-of-accounts/${id}`);
    }

    // Backend returns Guid (string) on 201 Created
    createChartOfAccount(req: UpsertChartOfAccountRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/chart-of-accounts`, req);
    }

    updateChartOfAccount(id: string, req: UpsertChartOfAccountRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/chart-of-accounts/${id}`, req);
    }

    deleteChartOfAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/chart-of-accounts/${id}`);
    }

    // ── Journal Entries ────────────────────────────────────────────────
    // Backend uses startDateUtc / endDateUtc (not fromDateUtc / toDateUtc)
    getJournalEntries(q?: string, status?: JournalEntryStatus, startDateUtc?: string, endDateUtc?: string, page?: number, pageSize?: number): Observable<JournalEntryDto[]> {
        let params = new HttpParams();
        if (q) params = params.set('q', q);
        if (status !== undefined) params = params.set('status', status.toString());
        if (startDateUtc) params = params.set('startDateUtc', startDateUtc);
        if (endDateUtc) params = params.set('endDateUtc', endDateUtc);
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<JournalEntryDto[]>(`${this.apiUrl}/journal-entries`, { params });
    }

    getJournalEntry(id: string): Observable<JournalEntryDto> {
        return this.http.get<JournalEntryDto>(`${this.apiUrl}/journal-entries/${id}`);
    }

    createJournalEntry(req: UpsertJournalEntryRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/journal-entries`, req);
    }

    updateJournalEntry(id: string, req: UpsertJournalEntryRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/journal-entries/${id}`, req);
    }

    deleteJournalEntry(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/journal-entries/${id}`);
    }

    postJournalEntry(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/journal-entries/${id}/post`, {});
    }

    // Backend returns 201 Created with new entry Guid
    reverseJournalEntry(id: string): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/journal-entries/${id}/reverse`, {});
    }

    // ── Cash Accounts ──────────────────────────────────────────────────
    getCashAccounts(): Observable<CashAccountDto[]> {
        return this.http.get<CashAccountDto[]>(`${this.apiUrl}/cash-accounts`);
    }

    getCashAccount(id: string): Observable<CashAccountDto> {
        return this.http.get<CashAccountDto>(`${this.apiUrl}/cash-accounts/${id}`);
    }

    // Backend returns Guid (string) on 201 Created
    createCashAccount(req: UpsertCashAccountRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/cash-accounts`, req);
    }

    updateCashAccount(id: string, req: UpsertCashAccountRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/cash-accounts/${id}`, req);
    }

    deleteCashAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/cash-accounts/${id}`);
    }

    // ── Cash Transactions ──────────────────────────────────────────────
    // Backend uses startDateUtc / endDateUtc
    getCashTransactions(cashAccountId?: string, startDateUtc?: string, endDateUtc?: string, page?: number, pageSize?: number): Observable<CashTransactionDto[]> {
        let params = new HttpParams();
        if (cashAccountId) params = params.set('cashAccountId', cashAccountId);
        if (startDateUtc) params = params.set('startDateUtc', startDateUtc);
        if (endDateUtc) params = params.set('endDateUtc', endDateUtc);
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<CashTransactionDto[]>(`${this.apiUrl}/cash-transactions`, { params });
    }

    // Backend returns Guid (string) on 201 Created
    createCashTransaction(cashAccountId: string, req: CreateCashTransactionRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/cash-accounts/${cashAccountId}/transactions`, req);
    }

    deleteCashTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/cash-transactions/${id}`);
    }

    matchCashTransactionToFinanceMovement(cashTransactionId: string, financeMovementId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/cash-transactions/${cashTransactionId}/match-finance-movement/${financeMovementId}`, {});
    }

    // ── Bank Accounts ──────────────────────────────────────────────────
    getBankAccounts(): Observable<BankAccountDto[]> {
        return this.http.get<BankAccountDto[]>(`${this.apiUrl}/bank-accounts`);
    }

    getBankAccount(id: string): Observable<BankAccountDto> {
        return this.http.get<BankAccountDto>(`${this.apiUrl}/bank-accounts/${id}`);
    }

    // Backend returns Guid (string) on 201 Created
    createBankAccount(req: UpsertBankAccountRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/bank-accounts`, req);
    }

    updateBankAccount(id: string, req: UpsertBankAccountRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/bank-accounts/${id}`, req);
    }

    deleteBankAccount(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/bank-accounts/${id}`);
    }

    // ── Bank Transactions ──────────────────────────────────────────────
    // Backend uses startDateUtc / endDateUtc
    getBankTransactions(bankAccountId?: string, startDateUtc?: string, endDateUtc?: string, page?: number, pageSize?: number): Observable<BankTransactionDto[]> {
        let params = new HttpParams();
        if (bankAccountId) params = params.set('bankAccountId', bankAccountId);
        if (startDateUtc) params = params.set('startDateUtc', startDateUtc);
        if (endDateUtc) params = params.set('endDateUtc', endDateUtc);
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<BankTransactionDto[]>(`${this.apiUrl}/bank-transactions`, { params });
    }

    // Backend returns Guid (string) on 201 Created
    createBankTransaction(bankAccountId: string, req: CreateBankTransactionRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/bank-accounts/${bankAccountId}/transactions`, req);
    }

    deleteBankTransaction(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/bank-transactions/${id}`);
    }

    matchBankTransactionToFinanceMovement(bankTransactionId: string, financeMovementId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/bank-transactions/${bankTransactionId}/match-finance-movement/${financeMovementId}`, {});
    }

    // ── Collections & Payments (Tahsilat/Ödeme) ────────────────────────
    createCollectionPayment(req: CreateCollectionPaymentRequest): Observable<CollectionPaymentResultDto> {
        return this.http.post<CollectionPaymentResultDto>(`${this.apiUrl}/collections-payments`, req);
    }
}
