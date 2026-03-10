export interface Company {
    id: string;
    name: string;
    taxNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}
