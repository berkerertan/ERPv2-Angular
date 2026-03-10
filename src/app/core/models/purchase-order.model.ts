/** PurchaseOrder — Backend PurchaseOrderDto + Items + Create/Update Requests */

import { OrderStatus } from './sales-order.model';

export interface PurchaseOrder {
    id: string;
    orderNo?: string;
    supplierCariAccountId: string;
    warehouseId: string;
    status: OrderStatus;
    orderDateUtc: string;
    totalAmount: number;
    items?: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface CreatePurchaseOrderRequest {
    orderNo?: string;
    supplierCariAccountId: string;
    warehouseId: string;
    items: CreatePurchaseOrderItemRequest[];
}

export interface CreatePurchaseOrderItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface UpdatePurchaseOrderRequest {
    orderNo?: string;
    supplierCariAccountId?: string;
    warehouseId?: string;
    items?: UpdatePurchaseOrderItemRequest[];
}

export interface UpdatePurchaseOrderItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}
