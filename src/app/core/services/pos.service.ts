import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** POS Barkod Tarama Sonucu — Backend PosProductScanDto */
export interface PosProductScanDto {
    productId: string;
    code?: string;
    name: string;
    unit?: string;
    category?: string;
    barcodeEan13?: string;
    qrCode?: string;
    defaultSalePrice: number;
    availableStock: number;
}

/** Hızlı satış item — Backend CreatePosQuickSaleItemRequest */
export interface CreatePosQuickSaleItemRequest {
    productId?: string;
    barcode?: string;
    quantity: number;
    unitPrice?: number;
}

/** Hızlı satış isteği — Backend CreatePosQuickSaleRequest */
export interface CreatePosQuickSaleRequest {
    customerCariAccountId?: string;
    warehouseId: string;
    items: CreatePosQuickSaleItemRequest[];
    note?: string;
}

/** Hızlı satış sonucu — Backend PosQuickSaleResult */
export interface PosQuickSaleResult {
    salesOrderId: string;
    orderNo?: string;
    totalAmount: number;
    itemCount: number;
    saleDateUtc: string;
}

@Injectable({ providedIn: 'root' })
export class PosService {
    private readonly apiUrl = `${environment.apiUrl}/api/pos`;

    constructor(private http: HttpClient) { }

    /** Barkod/QR ile ürün tara — stok ve fiyat bilgisi döner */
    scanProduct(warehouseId: string, barcode: string): Observable<PosProductScanDto> {
        return this.http.get<PosProductScanDto>(`${this.apiUrl}/products/scan`, {
            params: { warehouseId, barcode }
        });
    }

    /** Hızlı satış — sipariş oluştur, stok düş, cari bakiye artır */
    quickSale(saleData: CreatePosQuickSaleRequest): Observable<PosQuickSaleResult> {
        return this.http.post<PosQuickSaleResult>(`${this.apiUrl}/quick-sales`, saleData);
    }
}
