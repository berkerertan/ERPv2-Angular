export interface SalesOrder {
    id: string;
    orderNumber?: string;
    cariAccountId: string;
    cariAccountName?: string;
    status: 'Draft' | 'Approved' | 'Cancelled';
    totalAmount: number;
    items?: SalesOrderItem[];
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SalesOrderItem {
    id?: string;
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
