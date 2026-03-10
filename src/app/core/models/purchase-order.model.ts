export interface PurchaseOrder {
    id: string;
    orderNumber?: string;
    cariAccountId: string;
    cariAccountName?: string;
    status: 'Draft' | 'Approved' | 'Cancelled';
    totalAmount: number;
    items?: PurchaseOrderItem[];
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface PurchaseOrderItem {
    id?: string;
    productId: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}
