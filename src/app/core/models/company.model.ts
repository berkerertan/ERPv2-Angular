/** Company — Backend CompanyDto + CreateCompanyRequest + UpdateCompanyRequest */

export interface Company {
    id: string;
    code?: string;
    name: string;
    taxNumber?: string;
}

export interface CreateCompanyRequest {
    code?: string;
    name: string;
    taxNumber?: string;
}

export interface UpdateCompanyRequest {
    code?: string;
    name?: string;
    taxNumber?: string;
}
