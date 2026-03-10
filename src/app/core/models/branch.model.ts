export interface Branch {
    id: string;
    name: string;
    companyId: string;
    companyName?: string;
    address?: string;
    phone?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
