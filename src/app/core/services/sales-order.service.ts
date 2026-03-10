import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SalesOrder } from '../models/sales-order.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
    private readonly apiUrl = `${environment.apiUrl}/api/sales-orders`;

    constructor(private http: HttpClient) { }

    /** Satış siparişi listesi — status filtresi destekler */
    getAll(params?: ApiQueryParams & { status?: string }): Observable<SalesOrder[]> {
        return this.http.get<SalesOrder[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Satış siparişi detayı */
    getById(id: string): Observable<SalesOrder> {
        return this.http.get<SalesOrder>(`${this.apiUrl}/${id}`);
    }

    /** Yeni satış siparişi */
    create(order: Partial<SalesOrder>): Observable<SalesOrder> {
        return this.http.post<SalesOrder>(this.apiUrl, order);
    }

    /** Satış siparişi güncelle */
    update(id: string, order: Partial<SalesOrder>): Observable<SalesOrder> {
        return this.http.put<SalesOrder>(`${this.apiUrl}/${id}`, order);
    }

    /** Satış siparişi sil */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Satış siparişini onayla — stok düşer, cari bakiye güncellenir */
    approve(id: string): Observable<SalesOrder> {
        return this.http.post<SalesOrder>(`${this.apiUrl}/${id}/approve`, {});
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
