/** Çek/Senet Takibi — Backend DTO + Create/Update Requests */

/** Belge türü: Çek veya Senet (backend: CheckNoteType) */
export enum CheckBillType {
    Check           = 1,  // Çek
    PromissoryNote  = 2   // Senet
}

/** Belge yönü: Alacak veya Borç (backend: CheckNoteDirection) */
export enum CheckBillDirection {
    Receivable = 1,  // Alacak (müşteriden tahsil edilecek)
    Payable    = 2   // Borç (tedarikçiye ödenecek)
}

/** Belge durumu (backend: CheckNoteStatus) */
export enum CheckBillStatus {
    Portfolio  = 1,  // Portföyde
    Endorsed   = 2,  // Ciro edildi
    Protested  = 3,  // Protesto edildi
    Collected  = 4,  // Tahsil edildi
    Paid       = 5,  // Ödendi
    Cancelled  = 6   // İptal
}

/** Response DTO — backend: CheckNoteDto */
export interface CheckBill {
    id: string;
    code: string;
    type: CheckBillType;
    direction: CheckBillDirection;
    status: CheckBillStatus;
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

/** Çek/Senet oluşturma isteği — backend: UpsertCheckNoteRequest */
export interface CreateCheckBillRequest {
    code: string;
    type: CheckBillType;
    direction: CheckBillDirection;
    cariAccountId: string;
    amount: number;
    currency?: string;
    issueDateUtc?: string;
    dueDateUtc: string;
    bankName?: string;
    branchName?: string;
    accountNo?: string;
    serialNo?: string;
    description?: string;
}

/** Çek/Senet güncelleme isteği — backend: UpsertCheckNoteRequest */
export interface UpdateCheckBillRequest {
    code: string;
    type: CheckBillType;
    direction: CheckBillDirection;
    cariAccountId: string;
    amount: number;
    currency?: string;
    issueDateUtc?: string;
    dueDateUtc: string;
    bankName?: string;
    branchName?: string;
    accountNo?: string;
    serialNo?: string;
    description?: string;
}

/** Durum değişikliği isteği — backend: UpdateCheckNoteStatusRequest */
export interface ChangeCheckNoteStatusRequest {
    status: CheckBillStatus;
    note?: string;
}

/** Tahsil/Ödeme isteği — backend: SettleCheckNoteRequest */
export interface SettleCheckNoteRequest {
    channel: number;           // TreasuryChannel: Cash=1, Bank=2
    treasuryAccountId: string;
    transactionDateUtc?: string;
    description?: string;
    referenceNo?: string;
}
