import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StockMovement, StockBalance } from '../models/stock-movement.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class StockMovementService {
    private readonly apiUrl = `${environment.apiUrl}/api/stock-movements`;

    constructor(private http: HttpClient) { }

    /** Stok hareketleri listesi */
    getAll(params?: ApiQueryParams): Observable<StockMovement[]> {
        return this.http.get<StockMovement[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Tek hareket detayı */
    getById(id: string): Observable<StockMovement> {
        return this.http.get<StockMovement>(`${this.apiUrl}/${id}`);
    }

    /** Depo+ürün bazlı stok bakiyeleri */
    getBalances(warehouseId?: string): Observable<StockBalance[]> {
        let params = new HttpParams();
        if (warehouseId) params = params.set('warehouseId', warehouseId);
        return this.http.get<StockBalance[]>(`${this.apiUrl}/balances`, { params });
    }

    /** Yeni stok hareketi ekle (In/Out) */
    create(movement: Partial<StockMovement>): Observable<StockMovement> {
        return this.http.post<StockMovement>(this.apiUrl, movement);
    }

    /** Stok hareketi güncelle */
    update(id: string, movement: Partial<StockMovement>): Observable<StockMovement> {
        return this.http.put<StockMovement>(`${this.apiUrl}/${id}`, movement);
    }

    /** Stok hareketi sil */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

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
