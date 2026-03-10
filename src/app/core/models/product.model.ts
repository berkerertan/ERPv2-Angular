export interface Product {
    id: string;
    name: string;
    barcode?: string;
    description?: string;
    unitPrice: number;
    currency?: string;
    categoryName?: string;
    unit?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
