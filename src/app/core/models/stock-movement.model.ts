/** StockMovement — Backend StockMovementDto + StockBalanceDto + CriticalStockAlertDto + Transfer */

/** StockMovementType enum: 1=In, 2=Out */
export enum StockMovementType {
    In = 1,
    Out = 2
}

export interface StockMovement {
    id: string;
    warehouseId: string;
    productId: string;
    type: StockMovementType;
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
}

export interface UpdateStockMovementRequest {
    warehouseId?: string;
    productId?: string;
    type?: StockMovementType;
    quantity?: number;
    unitPrice?: number;
    referenceNo?: string;
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
