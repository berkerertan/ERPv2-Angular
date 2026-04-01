export interface PosCartItem {
    productId: string;
    name: string;
    barcode: string;
    quantity: number;
    unitPrice: number;
    total: number;
}

export interface SavePosCartRequest {
    id?: string | null;
    label: string;
    buyerId?: string | null;
    buyerName?: string | null;
    paymentMethod: string;
    warehouseId: string;
    items: PosCartItem[];
}

export interface SavePosCartResponse {
    id: string;
    shareToken: string;
    label: string;
    updatedAt: string;
}

export interface PosCartSummary {
    id: string;
    shareToken: string;
    label: string;
    buyerName?: string;
    paymentMethod: string;
    itemCount: number;
    grandTotal: number;
    createdAt: string;
    updatedAt: string;
}

export interface PosCartDetail {
    id: string;
    shareToken: string;
    label: string;
    buyerId?: string;
    buyerName?: string;
    paymentMethod: string;
    warehouseId: string;
    items: PosCartItem[];
    createdAt: string;
    updatedAt: string;
}
