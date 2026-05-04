export type SupplierQuoteRequestStatus = 'Draft' | 'Open' | 'Closed' | 'Converted' | 'Cancelled';
export type SupplierQuoteOfferStatus = 'Pending' | 'Received' | 'Declined';

export interface SupplierQuoteRequestListItem {
    id: string;
    requestNo: string;
    title: string;
    warehouseId: string;
    warehouseName: string;
    neededByDateUtc?: string | null;
    status: number | SupplierQuoteRequestStatus;
    supplierCount: number;
    receivedOfferCount: number;
    estimatedBestTotal: number;
    createdByUserName?: string | null;
    createdAtUtc: string;
}

export interface SupplierQuoteRequestItem {
    productId: string;
    productCode: string;
    productName: string;
    unit: string;
    quantity: number;
    targetUnitPrice?: number | null;
    notes?: string | null;
}

export interface SupplierQuoteOfferItem {
    productId: string;
    productCode: string;
    productName: string;
    offeredQuantity: number;
    unitPrice: number;
    minimumOrderQuantity?: number | null;
    lineTotal: number;
}

export interface SupplierQuoteOffer {
    id: string;
    supplierCariAccountId: string;
    supplierName: string;
    status: number | SupplierQuoteOfferStatus;
    leadTimeDays: number;
    notes?: string | null;
    respondedAtUtc?: string | null;
    totalAmount: number;
    isSelected: boolean;
    items: SupplierQuoteOfferItem[];
}

export interface SupplierQuoteRequestDetail {
    id: string;
    requestNo: string;
    title: string;
    warehouseId: string;
    warehouseName: string;
    neededByDateUtc?: string | null;
    status: number | SupplierQuoteRequestStatus;
    notes?: string | null;
    createdByUserName?: string | null;
    createdAtUtc: string;
    selectedSupplierCariAccountId?: string | null;
    selectedOfferId?: string | null;
    items: SupplierQuoteRequestItem[];
    offers: SupplierQuoteOffer[];
}

export interface CreateSupplierQuoteRequestItemRequest {
    productId: string;
    quantity: number;
    targetUnitPrice?: number | null;
    notes?: string | null;
}

export interface CreateSupplierQuoteRequestRequest {
    title: string;
    warehouseId: string;
    neededByDateUtc?: string | null;
    notes?: string | null;
    supplierCariAccountIds: string[];
    items: CreateSupplierQuoteRequestItemRequest[];
}

export interface UpsertSupplierQuoteOfferItemRequest {
    productId: string;
    offeredQuantity: number;
    unitPrice: number;
    minimumOrderQuantity?: number | null;
}

export interface UpsertSupplierQuoteOfferRequest {
    status: number;
    leadTimeDays: number;
    notes?: string | null;
    items: UpsertSupplierQuoteOfferItemRequest[];
}

export interface ConvertSupplierQuoteResult {
    purchaseOrderId: string;
    orderNo: string;
}
