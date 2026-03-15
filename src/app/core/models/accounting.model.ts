/** Accounting module — Backend API DTO eşleştirmesi */

/** AccountType enum: 1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense */
export enum AccountType {
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    Expense = 5
}

/** JournalEntryStatus enum: 1=Draft, 2=Posted, 3=Reversed */
export enum JournalEntryStatus {
    Draft = 1,
    Posted = 2,
    Reversed = 3
}

/** BankTransactionType enum: 1=Deposit, 2=Withdrawal, 3=Transfer, 4=Fee */
export enum BankTransactionType {
    Deposit = 1,
    Withdrawal = 2,
    Transfer = 3,
    Fee = 4
}

/** CashTransactionType enum: 1=Income, 2=Expense, 3=Transfer, 4=Adjustment */
export enum CashTransactionType {
    Income = 1,
    Expense = 2,
    Transfer = 3,
    Adjustment = 4
}

/** TreasuryChannel enum: 1=Cash, 2=Bank */
export enum TreasuryChannel {
    Cash = 1,
    Bank = 2
}

/** FinanceMovementType — re-exported from finance-movement module (1=Income, 2=Expense) */
import { FinanceMovementType } from './finance-movement.model';
export { FinanceMovementType };

export interface ChartOfAccountDto {
    id: string;
    code?: string;
    name?: string;
    type: AccountType;
    isActive: boolean;
    createdAtUtc: string;
}

export interface UpsertChartOfAccountRequest {
    code?: string;
    name?: string;
    type: AccountType;
    isActive: boolean;
}

export interface JournalEntryLineDto {
    id: string;
    chartOfAccountId: string;
    chartOfAccountCode?: string;
    chartOfAccountName?: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface JournalEntryDto {
    id: string;
    voucherNo?: string;
    entryDateUtc: string;
    status: JournalEntryStatus;
    description?: string;
    totalDebit: number;
    totalCredit: number;
    lines?: JournalEntryLineDto[];
    createdAtUtc: string;
}

export interface UpsertJournalEntryLineRequest {
    chartOfAccountId: string;
    debit: number;
    credit: number;
    description?: string;
}

export interface UpsertJournalEntryRequest {
    voucherNo?: string;
    entryDateUtc: string;
    description?: string;
    postOnCreate: boolean;
    lines?: UpsertJournalEntryLineRequest[];
}

export interface CashAccountDto {
    id: string;
    code?: string;
    name?: string;
    currency?: string;
    balance: number;
    createdAtUtc: string;
}

export interface UpsertCashAccountRequest {
    code: string;
    name: string;
    currency?: string;
}

export interface CashTransactionDto {
    id: string;
    cashAccountId: string;
    cariAccountId?: string;
    financeMovementId?: string;
    type: CashTransactionType;
    amount: number;
    transactionDateUtc: string;
    description?: string;
    referenceNo?: string;
    createdAtUtc: string;
}

export interface CreateCashTransactionRequest {
    cariAccountId?: string;
    financeMovementId?: string;
    type: CashTransactionType;
    amount: number;
    transactionDateUtc?: string;
    description?: string;
    referenceNo?: string;
}

export interface BankAccountDto {
    id: string;
    bankName?: string;
    branchName?: string;
    iban?: string;
    currency?: string;
    balance: number;
    createdAtUtc: string;
}

export interface UpsertBankAccountRequest {
    bankName?: string;
    branchName?: string;
    iban?: string;
    currency?: string;
}

export interface BankTransactionDto {
    id: string;
    bankAccountId: string;
    cariAccountId?: string;
    financeMovementId?: string;
    type: BankTransactionType;
    amount: number;
    transactionDateUtc: string;
    description?: string;
    referenceNo?: string;
    createdAtUtc: string;
}

export interface CreateBankTransactionRequest {
    cariAccountId?: string;
    financeMovementId?: string;
    type: BankTransactionType;
    amount: number;
    transactionDateUtc?: string;
    description?: string;
    referenceNo?: string;
}

export interface CreateCollectionPaymentRequest {
    cariAccountId: string;
    type: FinanceMovementType;
    amount: number;
    description?: string;
    referenceNo?: string;
    channel: TreasuryChannel;
    treasuryAccountId: string;
    transactionDateUtc?: string;
}

export interface CollectionPaymentResultDto {
    financeMovementId: string;
    cashTransactionId?: string;
    bankTransactionId?: string;
    cariBalance: number;
    treasuryBalance: number;
}
