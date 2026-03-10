/** Warehouse — Backend WarehouseDto + CreateWarehouseRequest + UpdateWarehouseRequest */

export interface Warehouse {
    id: string;
    branchId: string;
    code?: string;
    name: string;
}

export interface CreateWarehouseRequest {
    branchId: string;
    code?: string;
    name: string;
}

export interface UpdateWarehouseRequest {
    branchId?: string;
    code?: string;
    name?: string;
}
