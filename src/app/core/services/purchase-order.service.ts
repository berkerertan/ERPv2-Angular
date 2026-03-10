import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PurchaseOrder } from '../models/purchase-order.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
    private readonly apiUrl = `${environment.apiUrl}/api/purchase-orders`;

    constructor(private http: HttpClient) { }

    /** Satın alma siparişleri listesi */
    getAll(params?: ApiQueryParams & { status?: string }): Observable<PurchaseOrder[]> {
        return this.http.get<PurchaseOrder[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Sipariş detayı */
    getById(id: string): Observable<PurchaseOrder> {
        return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
    }

    /** Yeni satın alma siparişi oluştur */
    create(order: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(this.apiUrl, order);
    }

    /** Sipariş güncelle */
    update(id: string, order: Partial<PurchaseOrder>): Observable<PurchaseOrder> {
        return this.http.put<PurchaseOrder>(`${this.apiUrl}/${id}`, order);
    }

    /** Sipariş sil */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Siparişi onayla — stok girer, cari bakiye güncellenir */
    approve(id: string): Observable<PurchaseOrder> {
        return this.http.post<PurchaseOrder>(`${this.apiUrl}/${id}/approve`, {});
    }

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
