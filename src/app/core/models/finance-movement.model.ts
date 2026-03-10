/** FinanceMovement — Backend FinanceMovementDto + Create/Update Requests */

/** FinanceMovementType enum: 1=Income, 2=Expense */
export enum FinanceMovementType {
    Income = 1,
    Expense = 2
}

export interface FinanceMovement {
    id: string;
    cariAccountId: string;
    type: FinanceMovementType;
    amount: number;
    movementDateUtc: string;
    description?: string;
    referenceNo?: string;
}

export interface CreateFinanceMovementRequest {
    cariAccountId: string;
    type: FinanceMovementType;
    amount: number;
    description?: string;
    referenceNo?: string;
}

export interface UpdateFinanceMovementRequest {
    cariAccountId?: string;
    type?: FinanceMovementType;
    amount?: number;
    description?: string;
    referenceNo?: string;
}
