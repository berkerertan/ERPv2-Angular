export interface Warehouse {
    id: string;
    name: string;
    branchId?: string;
    branchName?: string;
    address?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
