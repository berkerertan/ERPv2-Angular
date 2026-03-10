import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    StockMovement,
    CreateStockMovementRequest,
    UpdateStockMovementRequest,
    StockBalance,
    CriticalStockAlertDto,
    TransferStockRequest,
    TransferStockResult,
    StockMovementType
} from '../models/stock-movement.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
    private readonly apiUrl = `${environment.apiUrl}/api/stock-movements`;

    constructor(private http: HttpClient) { }

    /** Stok hareketleri listesi — gelişmiş filtreleme */
    getAll(params?: {
        q?: string;
        warehouseId?: string;
        productId?: string;
        type?: StockMovementType;
        fromUtc?: string;
        toUtc?: string;
        page?: number;
        pageSize?: number;
        sortDir?: string;
    }): Observable<StockMovement[]> {
        return this.http.get<StockMovement[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Tek hareket detayı */
    getById(id: string): Observable<StockMovement> {
        return this.http.get<StockMovement>(`${this.apiUrl}/${id}`);
    }

    /** Depo+ürün bazlı stok bakiyeleri */
    getBalances(): Observable<StockBalance[]> {
        return this.http.get<StockBalance[]>(`${this.apiUrl}/balances`);
    }

    /** Kritik stok uyarıları */
    getCriticalAlerts(warehouseId?: string): Observable<CriticalStockAlertDto[]> {
        let params = new HttpParams();
        if (warehouseId) params = params.set('warehouseId', warehouseId);
        return this.http.get<CriticalStockAlertDto[]>(`${this.apiUrl}/critical-alerts`, { params });
    }

    /** Yeni stok hareketi — 201 Created: uuid döner */
    create(movement: CreateStockMovementRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, movement);
    }

    /** Stok hareketi güncelle — 204 No Content */
    update(id: string, movement: UpdateStockMovementRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, movement);
    }

    /** Stok hareketi sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Depolar arası stok transferi */
    transfer(request: TransferStockRequest): Observable<TransferStockResult> {
        return this.http.post<TransferStockResult>(`${this.apiUrl}/transfer`, request);
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
