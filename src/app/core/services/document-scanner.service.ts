import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ScanProvider = 'claude' | 'azure' | 'gemini';

export interface ScanDocumentRequest {
    imageBase64: string;
    mimeType: string;
    provider: ScanProvider;
}

export interface ScannedLineItem {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
    taxRate?: number;
}

export interface DocumentScanResult {
    vendorName?: string;
    vendorTaxId?: string;
    documentDate?: string;
    documentNumber?: string;
    documentType?: string;   // "invoice" | "waybill" | "receipt" | "other"
    currency?: string;
    items: ScannedLineItem[];
    subtotal?: number;
    taxAmount?: number;
    total?: number;
    provider: string;
    errorMessage?: string;
}

export type ScanCommitOperation = 'buyerDebt' | 'supplierPurchaseOrder' | 'stockIn';

export interface CommitScannedLineItemRequest {
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
}

export interface CommitScannedDocumentRequest {
    operation: ScanCommitOperation;
    buyerCariAccountId?: string | null;
    supplierCariAccountId?: string | null;
    warehouseId?: string | null;
    documentDate?: string | null;
    documentNumber?: string | null;
    createMissingProducts: boolean;
    items: CommitScannedLineItemRequest[];
}

export interface CommitScannedDocumentResponse {
    operation: string;
    sourceItemCount: number;
    processedItemCount: number;
    createdProductCount: number;
    createdProductIds: string[];
    createdRecordIds: string[];
    message: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentScannerService {
    private readonly apiUrl = `${environment.apiUrl}/api/DocumentScanner`;

    constructor(private http: HttpClient) {}

    analyze(request: ScanDocumentRequest): Observable<DocumentScanResult> {
        return this.http.post<DocumentScanResult>(`${this.apiUrl}/Analyze`, request);
    }

    commit(request: CommitScannedDocumentRequest): Observable<CommitScannedDocumentResponse> {
        return this.http.post<CommitScannedDocumentResponse>(`${this.apiUrl}/Commit`, request);
    }
}
