export interface FinanceMovement {
    id: string;
    type: 'Income' | 'Expense';
    amount: number;
    description?: string;
    category?: string;
    cariAccountId?: string;
    cariAccountName?: string;
    createdAt?: string;
    updatedAt?: string;
}
