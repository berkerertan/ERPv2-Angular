/** price-list.model.ts — Fiyat Listeleri */

export interface PriceList {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    discountRate: number;
    items?: PriceListItemDto[];
}

export interface PriceListItemDto {
    productId: string;
    productName?: string;
    originalPrice: number;
    customPrice: number;
}

export interface CreatePriceListRequest {
    name: string;
    description?: string;
    isActive: boolean;
    startDate: string;
    endDate: string;
    discountRate: number;
    items: CreatePriceListItemRequest[];
}

export interface CreatePriceListItemRequest {
    productId: string;
    customPrice: number;
}

export interface UpdatePriceListRequest {
    name?: string;
    description?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string;
    discountRate?: number;
    items?: CreatePriceListItemRequest[];
}
