/** Product — Backend ProductDto + CreateProductRequest + UpdateProductRequest + Bulk operations + ProductSuggestionDto */

export interface Product {
    id: string;
    code?: string | null;
    name: string;
    shortDescription?: string | null;
    brand?: string | null;
    productType?: string | null;
    unit?: string | null;
    alternativeUnits?: string[] | null;
    category?: string | null;
    subCategory?: string | null;
    barcodeEan13?: string | null;
    alternativeBarcodes?: string[] | null;
    qrCode?: string | null;
    purchaseVatRate?: number | null;
    salesVatRate?: number | null;
    isActive: boolean;
    minimumStockLevel?: number | null;
    maximumStockLevel?: number | null;
    defaultWarehouseId?: string | null;
    defaultShelfCode?: string | null;
    imageUrl?: string | null;
    technicalDocumentUrl?: string | null;
    lastPurchasePrice?: number | null;
    lastSalePrice?: number | null;
    defaultSalePrice: number;
    criticalStockLevel: number;
}

export interface CreateProductRequest {
    code?: string | null;
    name: string;
    shortDescription?: string | null;
    brand?: string | null;
    productType?: string | null;
    unit?: string | null;
    alternativeUnits?: string[] | null;
    category?: string | null;
    subCategory?: string | null;
    barcodeEan13?: string | null;
    alternativeBarcodes?: string[] | null;
    qrCode?: string | null;
    purchaseVatRate?: number | null;
    salesVatRate?: number | null;
    isActive: boolean;
    minimumStockLevel?: number | null;
    maximumStockLevel?: number | null;
    defaultWarehouseId?: string | null;
    defaultShelfCode?: string | null;
    imageUrl?: string | null;
    technicalDocumentUrl?: string | null;
    lastPurchasePrice?: number | null;
    lastSalePrice?: number | null;
    defaultSalePrice: number;
    criticalStockLevel: number;
}

export interface UpdateProductRequest {
    code?: string | null;
    name?: string | null;
    shortDescription?: string | null;
    brand?: string | null;
    productType?: string | null;
    unit?: string | null;
    alternativeUnits?: string[] | null;
    category?: string | null;
    subCategory?: string | null;
    barcodeEan13?: string | null;
    alternativeBarcodes?: string[] | null;
    qrCode?: string | null;
    purchaseVatRate?: number | null;
    salesVatRate?: number | null;
    isActive?: boolean;
    minimumStockLevel?: number | null;
    maximumStockLevel?: number | null;
    defaultWarehouseId?: string | null;
    defaultShelfCode?: string | null;
    imageUrl?: string | null;
    technicalDocumentUrl?: string | null;
    lastPurchasePrice?: number | null;
    lastSalePrice?: number | null;
    defaultSalePrice?: number;
    criticalStockLevel?: number;
}

/* ── Bulk Price Update ── */

export interface BulkProductPriceUpdateItemRequest {
    productId: string;
    defaultSalePrice: number;
}

export interface BulkProductPriceUpdateRequest {
    items: BulkProductPriceUpdateItemRequest[];
}

export interface BulkProductPriceUpdateResponse {
    requested: number;
    updated: number;
    notFound: number;
}

/* ── Bulk Stock Update ── */

export interface BulkProductStockUpdateItemRequest {
    productId: string;
    quantityDelta: number;
    unitPrice: number;
}

export interface BulkProductStockUpdateRequest {
    warehouseId: string;
    items: BulkProductStockUpdateItemRequest[];
    referenceNo?: string;
    movementDateUtc?: string;
}

export interface BulkProductStockUpdateResponse {
    requested: number;
    movementsCreated: number;
    notFound: number;
    skippedZeroQuantity: number;
}

/* ── Product Suggestion ── */

export interface ProductSuggestionDto {
    id: string;
    code?: string;
    name?: string;
    label?: string;
    subtitle?: string;
}
