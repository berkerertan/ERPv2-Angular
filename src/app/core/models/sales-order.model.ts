/** SalesOrder — Backend SalesOrderDto + Items + Create/Update Requests */

/** OrderStatus enum: 1=Draft, 2=Approved, 3=Cancelled */
export enum OrderStatus {
    Draft = 1,
    Approved = 2,
    Cancelled = 3
}

export interface SalesOrder {
    id: string;
    orderNo?: string;
    customerCariAccountId: string;
    warehouseId: string;
    status: OrderStatus;
    orderDateUtc: string;
    totalAmount: number;
    items?: SalesOrderItemDto[];
}

export interface SalesOrderItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface CreateSalesOrderRequest {
    orderNo?: string;
    customerCariAccountId: string;
    warehouseId: string;
    items: CreateSalesOrderItemRequest[];
}

export interface CreateSalesOrderItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}

export interface UpdateSalesOrderRequest {
    orderNo?: string;
    customerCariAccountId?: string;
    warehouseId?: string;
    items?: UpdateSalesOrderItemRequest[];
}

export interface UpdateSalesOrderItemRequest {
    productId: string;
    quantity: number;
    unitPrice: number;
}
