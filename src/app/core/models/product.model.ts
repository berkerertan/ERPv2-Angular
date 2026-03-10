/** Product — Backend ProductDto + CreateProductRequest + UpdateProductRequest + ProductSuggestionDto */

export interface Product {
    id: string;
    code?: string;
    name: string;
    unit?: string;
    category?: string;
    barcodeEan13?: string;
    qrCode?: string;
    defaultSalePrice: number;
    criticalStockLevel?: number;
}

export interface CreateProductRequest {
    code?: string;
    name: string;
    unit?: string;
    category?: string;
    barcodeEan13?: string;
    qrCode?: string;
    defaultSalePrice: number;
    criticalStockLevel?: number;
}

export interface UpdateProductRequest {
    code?: string;
    name?: string;
    unit?: string;
    category?: string;
    barcodeEan13?: string;
    qrCode?: string;
    defaultSalePrice?: number;
    criticalStockLevel?: number;
}

export interface ProductSuggestionDto {
    id: string;
    code?: string;
    name?: string;
    label?: string;
    subtitle?: string;
}
