/** return.model.ts — İade Yönetimi */

export enum ReturnStatus {
    Pending = 1,
    Approved = 2,
    Rejected = 3
}

export enum ReturnType {
    Sales = 1,    // Müşteriden gelen satış iadesi
    Purchase = 2  // Tedarikçiye gönderilen alım iadesi
}

export interface Return {
    id: string;
    returnNo: string;
    type: ReturnType;
    cariAccountId: string;
    warehouseId: string;
    status: ReturnStatus;
    returnDateUtc: string;
    reason?: string;
    totalAmount: number;
    items?: ReturnItemDto[];
}

export interface ReturnItemDto {
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
}

export interface CreateReturnRequest {
    returnNo: string;
    type: ReturnType;
    cariAccountId: string;
    warehouseId: string;
    reason?: string;
    items: CreateReturnItemRequest[];
}

export interface CreateReturnItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}
