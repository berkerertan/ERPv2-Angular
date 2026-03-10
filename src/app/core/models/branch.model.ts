/** Branch — Backend BranchDto + CreateBranchRequest + UpdateBranchRequest */

export interface Branch {
    id: string;
    companyId: string;
    code?: string;
    name: string;
}

export interface CreateBranchRequest {
    companyId: string;
    code?: string;
    name: string;
}

export interface UpdateBranchRequest {
    companyId?: string;
    code?: string;
    name?: string;
}
