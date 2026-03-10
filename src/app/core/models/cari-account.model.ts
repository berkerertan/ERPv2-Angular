/** CariAccount — Backend CariAccountDto + DebtItem + Suggest + Details Response */

/** CariType enum: 1=Supplier, 2=Buyer, 3=Both */
export enum CariType {
    Supplier = 1,
    Buyer = 2,
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
    transactionDate?: string;
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
