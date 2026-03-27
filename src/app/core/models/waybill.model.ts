/** waybill.model.ts — Sevk İrsaliyesi */

export enum WaybillStatus {
    Draft = 1,
    Shipped = 2,
    Delivered = 3,
    Cancelled = 4
}

export enum WaybillType {
    Outgoing = 1,   // Satış sevkiyatı
    Incoming = 2    // Alım / iade sevkiyatı
}

export interface Waybill {
    id: string;
    waybillNo: string;
    type: WaybillType;
    cariAccountId: string;
    warehouseId: string;
    status: WaybillStatus;
    shipDateUtc: string;
    deliveryAddress?: string;
    notes?: string;
    totalAmount: number;
    items?: WaybillItemDto[];
}

export interface WaybillItemDto {
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
}

export interface CreateWaybillRequest {
    waybillNo: string;
    type: WaybillType;
    cariAccountId: string;
    warehouseId: string;
    deliveryAddress?: string;
    notes?: string;
    items: CreateWaybillItemRequest[];
}

export interface CreateWaybillItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}
