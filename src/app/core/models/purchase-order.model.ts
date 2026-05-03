/** PurchaseOrder — Backend PurchaseOrderDto + Items + Create/Update Requests */

import { OrderStatus } from './sales-order.model';

export interface PurchaseOrder {
    id: string;
    orderNo?: string;
    supplierCariAccountId: string;
    warehouseId: string;
    status: OrderStatus;
    orderDateUtc: string;
    createdAtUtc: string;
    approvedAtUtc?: string | null;
    approvedByUserName?: string | null;
    cancelledAtUtc?: string | null;
    cancelledByUserName?: string | null;
    cancellationReason?: string | null;
    totalAmount: number;
    items?: PurchaseOrderItemDto[];
}

export interface PurchaseOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface CreatePurchaseOrderRequest {
    orderNo: string;
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

export interface PurchaseRecommendationSummary {
    totalItems: number;
    criticalItems: number;
    totalRecommendedQuantity: number;
    totalEstimatedCost: number;
}

export interface PurchaseRecommendationSupplierGroup {
    supplierCariAccountId?: string | null;
    supplierName: string;
    supplierLeadTimeDays: number;
    itemCount: number;
    totalRecommendedQuantity: number;
    totalEstimatedCost: number;
}

export interface PurchaseRecommendationItem {
    productId: string;
    productCode: string;
    productName: string;
    barcode: string;
    unit: string;
    suggestedSupplierCariAccountId?: string | null;
    suggestedSupplierName?: string | null;
    onHandQuantity: number;
    incomingDraftQuantity: number;
    availableQuantity: number;
    averageDailySales: number;
    daysOfCover: number;
    supplierLeadTimeDays: number;
    planningDays: number;
    criticalStockLevel: number;
    minimumStockLevel: number;
    maximumStockLevel?: number | null;
    targetStockLevel: number;
    recommendedOrderQuantity: number;
    suggestedUnitPrice: number;
    estimatedCost: number;
    isCritical: boolean;
    recommendationReason: string;
}

export interface PurchaseRecommendationResponse {
    warehouseId: string;
    supplierCariAccountId?: string | null;
    analysisDays: number;
    coverageDays: number;
    summary: PurchaseRecommendationSummary;
    supplierGroups: PurchaseRecommendationSupplierGroup[];
    items: PurchaseRecommendationItem[];
}
