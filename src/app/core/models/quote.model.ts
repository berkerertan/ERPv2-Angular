/** Teklifler — Backend API DTO eşleştirmesi */

export enum QuoteStatus {
    Draft = 1,
    Sent = 2,
    Accepted = 3,
    Rejected = 4,
    Expired = 5,
    ConvertedToOrder = 6
}

export interface QuoteItem {
    id: string;
    productId?: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    lineTotal: number;
    sortOrder: number;
}

export interface Quote {
    id: string;
    quoteNumber: string;
    cariAccountId?: string;
    cariCode?: string;
    cariName?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    status: QuoteStatus;
    quoteDateUtc: string;
    validUntilUtc: string;
    overallDiscountPercent: number;
    taxPercent: number;
    notes?: string;
    convertedSalesOrderId?: string;
    items: QuoteItem[];
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    grandTotal: number;
    createdAtUtc: string;
}

export interface QuoteListItem {
    id: string;
    quoteNumber: string;
    customerName: string;
    status: QuoteStatus;
    quoteDateUtc: string;
    validUntilUtc: string;
    itemCount: number;
    grandTotal: number;
    createdAtUtc: string;
}

export interface UpsertQuoteRequest {
    quoteNumber: string;
    cariAccountId?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    quoteDateUtc: string;
    validUntilUtc: string;
    overallDiscountPercent: number;
    taxPercent: number;
    notes?: string;
    items: UpsertQuoteItemRequest[];
}

export interface UpsertQuoteItemRequest {
    productId?: string;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
}

export interface UpdateQuoteStatusRequest {
    status: QuoteStatus;
}

export interface ConvertToOrderRequest {
    warehouseId: string;
}
