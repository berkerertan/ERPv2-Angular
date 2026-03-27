/** Çek/Senet Takibi — Backend API DTO eşleştirmesi */

/** Belge türü: Çek veya Senet */
export enum CheckNoteType {
    Check          = 1,   // Çek
    PromissoryNote = 2    // Senet
}

/** Belge yönü: Alacak veya Borç */
export enum CheckNoteDirection {
    Receivable = 1,  // Alacak (müşteriden alınan)
    Payable    = 2   // Borç   (tedarikçiye verilen)
}

/** Belge durumu */
export enum CheckNoteStatus {
    Portfolio  = 1,  // Portföyde
    Endorsed   = 2,  // Ciro edildi
    Protested  = 3,  // Protestolu
    Collected  = 4,  // Tahsil edildi
    Paid       = 5,  // Ödendi
    Cancelled  = 6   // İptal
}

/** Tahsilat / ödeme kanalı */
export enum TreasuryChannel {
    Cash = 1,
    Bank = 2
}

/** Response DTO — Backend CheckNoteDto */
export interface CheckNote {
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

/** Vadeye yaklaşan çek/senet listesi */
export interface CheckNoteDueListItem {
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

/** Çek/Senet oluşturma / güncelleme isteği — Backend UpsertCheckNoteRequest */
export interface UpsertCheckNoteRequest {
    code: string;
    type: CheckNoteType;
    direction: CheckNoteDirection;
    cariAccountId: string;
    amount: number;
    currency?: string;
    issueDateUtc: string;
    dueDateUtc: string;
    bankName?: string;
    branchName?: string;
    accountNo?: string;
    serialNo?: string;
    description?: string;
}

/** Durum değişikliği isteği — Backend UpdateCheckNoteStatusRequest */
export interface UpdateCheckNoteStatusRequest {
    status: CheckNoteStatus;
    note?: string;
}

/** Tahsilat / ödeme tamamlama isteği — Backend SettleCheckNoteRequest */
export interface SettleCheckNoteRequest {
    channel: TreasuryChannel;
    treasuryAccountId: string;
    transactionDateUtc?: string;
    description?: string;
    referenceNo?: string;
}

/** Settle sonucu */
export interface SettleCheckNoteResult {
    checkNoteId: string;
    status: CheckNoteStatus;
    financeMovementId: string;
    cashTransactionId?: string;
    bankTransactionId?: string;
    cariBalance: number;
    treasuryBalance: number;
}
