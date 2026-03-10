import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ApiQueryParams, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private readonly apiUrl = `${environment.apiUrl}/api/products`;

    constructor(private http: HttpClient) { }

    /** Tüm ürünleri getir (basit) */
    getAll(params?: ApiQueryParams): Observable<Product[]> {
        return this.http.get<Product[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Sayfalanmış ürün listesi */
    getPaginated(params?: ApiQueryParams): Observable<PaginatedResponse<Product>> {
        return this.http.get<PaginatedResponse<Product>>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Tek ürün detayı */
    getById(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}/${id}`);
    }

    /** Yeni ürün oluştur */
    create(product: Partial<Product>): Observable<Product> {
        return this.http.post<Product>(this.apiUrl, product);
    }

    /** Ürün güncelle */
    update(id: string, product: Partial<Product>): Observable<Product> {
        return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
    }

    /** Ürünü soft delete */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Barkod ile ürün ara */
    searchByBarcode(barcode: string): Observable<Product> {
        return this.http.get<Product>(`${this.apiUrl}`, {
            params: { barcode }
        });
    }

    /** HTTP query param builder */
    private buildParams(params?: ApiQueryParams): HttpParams {
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
