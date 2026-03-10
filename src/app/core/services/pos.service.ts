import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ScanResult {
    productId: string;
    productName: string;
    barcode: string;
    unitPrice: number;
    stockQuantity: number;
    unit: string;
}

export interface QuickSaleRequest {
    warehouseId: string;
    cariAccountId?: string;
    paymentType: 'Cash' | 'Card' | 'Credit';
    items: QuickSaleItem[];
}

export interface QuickSaleItem {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface QuickSaleResponse {
    orderId: string;
    orderNumber: string;
    totalAmount: number;
    success: boolean;
    message?: string;
}

@Injectable({ providedIn: 'root' })
export class PosService {
    private readonly apiUrl = `${environment.apiUrl}/api/pos`;

    constructor(private http: HttpClient) { }

    /** Barkod/QR ile ürün tara — stok ve fiyat bilgisi döner */
    scanProduct(warehouseId: string, barcode: string): Observable<ScanResult> {
        return this.http.get<ScanResult>(`${this.apiUrl}/products/scan`, {
            params: { warehouseId, barcode }
        });
    }

    /** Hızlı satış — sipariş oluştur, stok düş, cari bakiye artır */
    quickSale(saleData: QuickSaleRequest): Observable<QuickSaleResponse> {
        return this.http.post<QuickSaleResponse>(`${this.apiUrl}/quick-sales`, saleData);
    }
}
