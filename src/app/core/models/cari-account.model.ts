export interface CariAccount {
    id: string;
    name: string;
    type: 'Supplier' | 'Buyer';
    phone?: string;
    email?: string;
    address?: string;
    taxNumber?: string;
    balance: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface DebtItem {
    id: string;
    cariAccountId: string;
    description?: string;
    amount: number;
    dueDate?: string;
    isPaid: boolean;
    paidAt?: string;
    createdAt?: string;
    updatedAt?: string;
}
