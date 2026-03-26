// Enums — backend ile birebir eşleşiyor
export enum CheckNoteType {
    Check = 1,           // Çek
    PromissoryNote = 2   // Senet
}

export enum CheckNoteDirection {
    Receivable = 1,  // Tahsil (alacaklı)
    Payable = 2      // Ödeme (borçlu)
}

export enum CheckNoteStatus {
    Portfolio = 1,   // Portföyde
    Endorsed = 2,    // Ciro edildi
    Protested = 3,   // Protesto edildi
    Collected = 4,   // Tahsil edildi
    Paid = 5,        // Ödendi
    Cancelled = 6    // İptal
}

export enum TreasuryChannel {
    Cash = 1,
    Bank = 2
}

export interface CheckNoteDto {
    id: string;
    code: string;
    type: CheckNoteType;
    direction: CheckNoteDirection;
    status: CheckNoteStatus;
    cariAccountId: string;
    cariCode: string;
    cariName: string;
    amount: number;
    currency: string;
    issueDateUtc: string;
    dueDateUtc: string;
    bankName?: string;
    branchName?: string;
    accountNo?: string;
    serialNo?: string;
    description?: string;
    lastActionNote?: string;
    relatedFinanceMovementId?: string;
    settledAtUtc?: string;
    createdAtUtc: string;
}

export interface CheckNoteDueListItemDto {
    id: string;
    code: string;
    type: CheckNoteType;
    direction: CheckNoteDirection;
    status: CheckNoteStatus;
    cariAccountId: string;
    cariCode: string;
    cariName: string;
    amount: number;
    currency: string;
    dueDate: string;
    remainingDays: number;
}

export interface UpsertCheckNoteRequest {
    code: string;
    type: CheckNoteType;
    direction: CheckNoteDirection;
    cariAccountId: string;
    amount: number;
    currency: string;
    issueDateUtc: string;
    dueDateUtc: string;
    bankName?: string;
    branchName?: string;
    accountNo?: string;
    serialNo?: string;
    description?: string;
}

export interface UpdateCheckNoteStatusRequest {
    status: CheckNoteStatus;
    note?: string;
}

export interface SettleCheckNoteRequest {
    channel: TreasuryChannel;
    treasuryAccountId: string;
    transactionDateUtc?: string;
    description?: string;
    referenceNo?: string;
}

export interface SettleCheckNoteResultDto {
    checkNoteId: string;
    status: CheckNoteStatus;
    financeMovementId: string;
    cashTransactionId?: string;
    bankTransactionId?: string;
    cariBalance: number;
    treasuryBalance: number;
}
