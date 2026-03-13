import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Product,
    CreateProductRequest,
    UpdateProductRequest,
    ProductSuggestionDto,
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
