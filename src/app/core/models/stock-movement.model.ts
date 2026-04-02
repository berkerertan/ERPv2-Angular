/** StockMovement — Backend StockMovementDto + StockBalanceDto + CriticalStockAlertDto + Transfer */

/** StockMovementType enum: 1=In, 2=Out */
export enum StockMovementType {
    In = 1,
    Out = 2
}

/** StockMovementReason enum (backend ile birebir) */
export enum StockMovementReason {
    ManualAdjustment = 1,
    PurchaseApproval = 2,
    SalesApproval = 3,
    TransferOut = 4,
    TransferIn = 5,
    PosSale = 6,
    InventoryAdjustment = 7,
    WasteScrap = 8,
    ReturnIn = 9,
    ReturnOut = 10
}

export interface StockMovement {
    id: string;
    warehouseId: string;
    productId: string;
    type: StockMovementType;
    reason: StockMovementReason;
    reasonNote?: string;
    proofImageUrl?: string;
    quantity: number;
    unitPrice: number;
    movementDateUtc: string;
    referenceNo?: string;
}

export interface CreateStockMovementRequest {
    warehouseId: string;
    productId: string;
    type: StockMovementType;
    quantity: number;
    unitPrice: number;
    referenceNo?: string;
    reason?: StockMovementReason;
    reasonNote?: string;
    proofImageUrl?: string;
    proofImagePublicId?: string;
}

export interface UpdateStockMovementRequest {
    warehouseId?: string;
    productId?: string;
    type?: StockMovementType;
    quantity?: number;
    unitPrice?: number;
    referenceNo?: string;
    reason?: StockMovementReason;
    reasonNote?: string;
    proofImageUrl?: string;
    proofImagePublicId?: string;
}

export interface StockMovementProofUploadResponse {
    url: string;
    publicId: string;
    format?: string;
    bytes?: number;
}

export interface StockBalance {
    productId: string;
    productName?: string;
    barcode?: string;
    warehouseName?: string;
    balance: number;
    unit?: string;
    totalValue: number;
}

export interface CriticalStockAlertDto {
    warehouseId: string;
    warehouseCode?: string;
    productId: string;
    productCode?: string;
    productName?: string;
    currentQuantity: number;
    criticalStockLevel: number;
    missingQuantity: number;
}

export interface TransferStockRequest {
    sourceWarehouseId: string;
    destinationWarehouseId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    referenceNo?: string;
}

export interface TransferStockResult {
    outMovementId: string;
    inMovementId: string;
    referenceNo?: string;
    movementDateUtc: string;
}
