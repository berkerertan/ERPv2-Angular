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

export interface ApplyInventoryCountItemRequest {
    productId: string;
    countedQuantity: number;
}

export interface ApplyInventoryCountRequest {
    sessionId?: string;
    warehouseId: string;
    referenceNo?: string;
    notes?: string;
    locationCode?: string;
    items: ApplyInventoryCountItemRequest[];
}

export interface ApplyInventoryCountResponse {
    sessionId: string;
    referenceNo: string;
    submittedItems: number;
    appliedItems: number;
    skippedItems: number;
    totalIncreaseQuantity: number;
    totalDecreaseQuantity: number;
}

export enum InventoryCountSessionStatus {
    Open = 1,
    Applied = 2,
    Cancelled = 3
}

export interface StartInventoryCountSessionRequest {
    warehouseId: string;
    referenceNo?: string;
    notes?: string;
    locationCode?: string;
}

export interface InventoryCountSessionListItem {
    id: string;
    warehouseId: string;
    warehouseName: string;
    status: InventoryCountSessionStatus;
    referenceNo: string;
    notes?: string;
    locationCode?: string;
    startedByUserName?: string;
    startedAtUtc: string;
    completedAtUtc?: string;
    submittedItems: number;
    appliedItems: number;
    skippedItems: number;
    totalIncreaseQuantity: number;
    totalDecreaseQuantity: number;
}

export interface InventoryCountSessionItem {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    barcode?: string;
    unit: string;
    locationCode?: string;
    countedByUserId?: string;
    countedByUserName?: string;
    systemQuantity: number;
    countedQuantity: number;
    differenceQuantity: number;
    countedAtUtc: string;
}

export interface InventoryCountSessionDetail {
    id: string;
    warehouseId: string;
    warehouseName: string;
    status: InventoryCountSessionStatus;
    referenceNo: string;
    notes?: string;
    locationCode?: string;
    startedByUserId?: string;
    startedByUserName?: string;
    startedAtUtc: string;
    completedAtUtc?: string;
    submittedItems: number;
    appliedItems: number;
    skippedItems: number;
    totalIncreaseQuantity: number;
    totalDecreaseQuantity: number;
    items: InventoryCountSessionItem[];
}
