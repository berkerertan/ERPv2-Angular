import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    PurchaseOrder,
    CreatePurchaseOrderRequest,
    UpdatePurchaseOrderRequest,
    PurchaseRecommendationResponse
} from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
    private readonly apiUrl = `${environment.apiUrl}/api/purchase-orders`;

    constructor(private http: HttpClient) { }

    /** Satın alma siparişleri listesi */
    getAll(): Observable<PurchaseOrder[]> {
        return this.http.get<PurchaseOrder[]>(this.apiUrl);
    }

    /** Sipariş detayı */
    getById(id: string): Observable<PurchaseOrder> {
        return this.http.get<PurchaseOrder>(`${this.apiUrl}/${id}`);
    }

    getRecommendations(params: {
        warehouseId: string;
        supplierCariAccountId?: string;
        analysisDays?: number;
        coverageDays?: number;
        maxItems?: number;
        criticalOnly?: boolean;
    }): Observable<PurchaseRecommendationResponse> {
        let query = new HttpParams().set('warehouseId', params.warehouseId);
        if (params.supplierCariAccountId) query = query.set('supplierCariAccountId', params.supplierCariAccountId);
        if (params.analysisDays) query = query.set('analysisDays', params.analysisDays.toString());
        if (params.coverageDays) query = query.set('coverageDays', params.coverageDays.toString());
        if (params.maxItems) query = query.set('maxItems', params.maxItems.toString());
        if (params.criticalOnly !== undefined) query = query.set('criticalOnly', params.criticalOnly.toString());
        return this.http.get<PurchaseRecommendationResponse>(`${this.apiUrl}/recommendations`, { params: query });
    }

    /** Yeni satın alma siparişi — 201 Created: uuid döner */
    create(order: CreatePurchaseOrderRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, order);
    }

    /** Sipariş güncelle — 204 No Content */
    update(id: string, order: UpdatePurchaseOrderRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, order);
    }

    /** Sipariş sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Siparişi onayla — 204 No Content */
    approve(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/approve`, {});
    }

    reject(id: string, reason: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/reject`, { reason });
    }
}
