import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    SalesOrder,
    CreateSalesOrderRequest,
    UpdateSalesOrderRequest
} from '../models/sales-order.model';

@Injectable({ providedIn: 'root' })
export class SalesOrderService {
    private readonly apiUrl = `${environment.apiUrl}/api/sales-orders`;

    constructor(private http: HttpClient) { }

    /** Satış siparişi listesi */
    getAll(): Observable<SalesOrder[]> {
        return this.http.get<SalesOrder[]>(this.apiUrl);
    }

    /** Satış siparişi detayı */
    getById(id: string): Observable<SalesOrder> {
        return this.http.get<SalesOrder>(`${this.apiUrl}/${id}`);
    }

    /** Yeni satış siparişi — 201 Created: uuid döner */
    create(order: CreateSalesOrderRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, order);
    }

    /** Satış siparişi güncelle — 204 No Content */
    update(id: string, order: UpdateSalesOrderRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, order);
    }

    /** Satış siparişi sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Satış siparişini onayla — 204 No Content */
    approve(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/approve`, {});
    }
}
