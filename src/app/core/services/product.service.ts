import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    ProductSuggestionDto,
    ProductScanResponse,
    ProductImageUploadResponse,
    BulkProductPriceUpdateRequest,
    BulkProductPriceUpdateResponse,
    BulkProductStockUpdateRequest,
    BulkProductStockUpdateResponse
} from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private readonly apiUrl = `${environment.apiUrl}/api/products`;

    constructor(private http: HttpClient) { }

    /** Ürün listesi — arama, sayfalama, sıralama */
    getAll(params?: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Tek ürün detayı */
    getById(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    /** Hızlı öneri arama (Intellisense) */
    suggest(q: string, limit: number = 8): Observable<ProductSuggestionDto[]> {
        return this.http.get<ProductSuggestionDto[]>(`${this.apiUrl}/suggest`, {
            params: { q, limit: limit.toString() }
        });
    }

    /** Barkod okutma sonucu urun bulunursa dondurur; bulunamazsa hizli taslak dondurur */
    scanBarcode(barcode: string): Observable<ProductScanResponse> {
        return this.http.get<ProductScanResponse>(`${this.apiUrl}/scan`, {
            params: { barcode }
        });
    }

    /** Yeni ürün oluştur — 201 Created: uuid döner */
    create(product: CreateProductRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, product);
    }

    /** Ürün güncelle — 204 No Content */
    update(id: string, product: UpdateProductRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, product);
    }

    /** Ürünü soft delete — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Urun gorselini cloud depoya yukler ve imageUrl gunceller */
    uploadImage(id: string, file: File, deletePrevious: boolean = true): Observable<ProductImageUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.post<ProductImageUploadResponse>(`${this.apiUrl}/${id}/image`, formData, {
            params: new HttpParams().set('deletePrevious', String(deletePrevious))
        });
    }

    /** Urun gorselini cloud depodan siler ve imageUrl temizler */
    removeImage(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}/image`);
    }

    /** Toplu fiyat güncelleme */
    bulkPriceUpdate(request: BulkProductPriceUpdateRequest): Observable<BulkProductPriceUpdateResponse> {
        return this.http.post<BulkProductPriceUpdateResponse>(`${this.apiUrl}/bulk-price-update`, request);
    }

    /** Toplu stok güncelleme */
    bulkStockUpdate(request: BulkProductStockUpdateRequest): Observable<BulkProductStockUpdateResponse> {
        return this.http.post<BulkProductStockUpdateResponse>(`${this.apiUrl}/bulk-stock-update`, request);
    }

    /** HTTP query param builder */
    private buildParams(params?: Record<string, any>): HttpParams {
        let httpParams = new HttpParams();
        if (!params) return httpParams;

        Object.keys(params).forEach(key => {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                httpParams = httpParams.set(key, value.toString());
            }
        });
        return httpParams;
    }
}
