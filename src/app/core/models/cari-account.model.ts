/** CariAccount — Backend CariAccountDto + DebtItem + Suggest + Details Response */

/** CariType enum: 1=Buyer, 2=Supplier, 3=Both (backend confirmed) */
export enum CariType {
    Buyer = 1,
    Supplier = 2,
    Both = 3
}

export interface CariAccount {
    id: string;
    code?: string;
    name: string;
    type: CariType;
    riskLimit: number;
    maturityDays: number;
    currentBalance: number;
    phone?: string;
}

export interface CreateCariAccountRequest {
    code?: string;
    name: string;
    type: CariType;
    riskLimit?: number;
    maturityDays?: number;
}

export interface UpdateCariAccountRequest {
    code?: string;
    name?: string;
    type?: CariType;
    riskLimit?: number;
    maturityDays?: number;
}

export interface CariAccountSuggestionDto {
    id: string;
    code?: string;
    name?: string;
    type: CariType;
    label?: string;
    subtitle?: string;
}

export interface CariDebtItem {
    id: string;
    cariAccountId: string;
    transactionDate: string;
    materialDescription?: string;
    quantity: number;
    listPrice: number;
    salePrice: number;
    totalAmount: number;
    payment: number;
    remainingBalance: number;
}

export interface CreateCariDebtItemRequest {
    transactionDate: string;
    materialDescription?: string;
    quantity: number;
    listPrice: number;
    salePrice: number;
    totalAmount: number;
    payment: number;
    remainingBalance: number;
}

export interface UpdateCariDebtItemRequest {
    transactionDate: string;
    materialDescription?: string;
    quantity?: number;
    listPrice?: number;
    salePrice?: number;
    totalAmount?: number;
    payment?: number;
    remainingBalance?: number;
}

export interface CariAccountDetailsResponse {
    account: CariAccount;
    items: CariDebtItem[];
}

export interface CariDebtItemImportResult {
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

export interface BuyerDebtItemsBatchImportFileResult {
    fileName?: string;
    cariAccountId?: string;
    cariAccountName?: string;
    cariCreated: boolean;
    totalRows: number;
    createdCount: number;
    failedCount: number;
    errors?: string[];
}

export interface BuyerDebtItemsBatchImportResult {
    totalFiles: number;
    processedFiles: number;
    createdCariCount: number;
    totalRows: number;
    totalCreatedCount: number;
    totalFailedCount: number;
    files?: BuyerDebtItemsBatchImportFileResult[];
}

export interface BuyerBatchImportOptions {
    replaceExisting?: boolean;
    transactionDateColumn?: string;
    materialDescriptionColumn?: string;
    quantityColumn?: string;
    listPriceColumn?: string;
    salePriceColumn?: string;
    totalAmountColumn?: string;
    paymentColumn?: string;
    remainingBalanceColumn?: string;
}

export interface BuyerRiskSummaryItem {
    cariAccountId: string;
    cariAccountCode: string;
    cariAccountName: string;
    currentBalance: number;
    riskLimit: number;
    maturityDays: number;
    overdueAmount: number;
    maxOverdueDays: number;
    riskUsageRate: number;
    severity: 'stable' | 'warning' | 'critical';
}

export interface BuyerRiskSummaryResponse {
    totalBuyerCount: number;
    riskyBuyerCount: number;
    criticalBuyerCount: number;
    totalCurrentBalance: number;
    totalOverdueAmount: number;
    items: BuyerRiskSummaryItem[];
}
