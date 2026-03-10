export interface StockMovement {
    id: string;
    productId: string;
    productName?: string;
    warehouseId: string;
    warehouseName?: string;
    movementType: 'In' | 'Out';
    quantity: number;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface StockBalance {
    productId: string;
    productName: string;
    warehouseId: string;
    warehouseName: string;
    balance: number;
}
