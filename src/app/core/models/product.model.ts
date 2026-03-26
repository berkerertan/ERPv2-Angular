/** Product — Backend ProductDto + CreateProductRequest + UpdateProductRequest + Bulk operations + ProductSuggestionDto */

export interface Product {
    id: string;
    code?: string | null;
    name: string;
    /** Frontend compatibility aliases */
    unitPrice?: number | null;
    categoryName?: string | null;
    barcode?: string | null;
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

export interface ProductImageUploadResponse {
    productId: string;
    imageUrl: string;
    publicId: string;
    format?: string | null;
    width?: number | null;
    height?: number | null;
    bytes?: number | null;
}

export interface ProductScanMatch {
    id: string;
    code: string;
    name: string;
    barcodeEan13?: string | null;
    qrCode?: string | null;
    defaultSalePrice: number;
    unit: string;
    imageUrl?: string | null;
    isActive: boolean;
}

export interface ProductScanDraft {
    code: string;
    name: string;
    unit: string;
    category: string;
    barcodeEan13?: string | null;
    qrCode?: string | null;
    defaultSalePrice: number;
    criticalStockLevel: number;
}

export interface ProductScanResponse {
    barcode: string;
    found: boolean;
    product?: ProductScanMatch | null;
    draft?: ProductScanDraft | null;
}
