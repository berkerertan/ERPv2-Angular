import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinanceMovement } from '../models/finance-movement.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class FinanceMovementService {
    private readonly apiUrl = `${environment.apiUrl}/api/finance-movements`;

    constructor(private http: HttpClient) { }

    /** Finans hareketleri listesi — type filtresi (Income/Expense) */
    getAll(params?: ApiQueryParams & { type?: 'Income' | 'Expense' }): Observable<FinanceMovement[]> {
        return this.http.get<FinanceMovement[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Hareket detayı */
    getById(id: string): Observable<FinanceMovement> {
        return this.http.get<FinanceMovement>(`${this.apiUrl}/${id}`);
    }

    /** Yeni finans hareketi */
    create(movement: Partial<FinanceMovement>): Observable<FinanceMovement> {
        return this.http.post<FinanceMovement>(this.apiUrl, movement);
    }

    /** Hareket güncelle */
    update(id: string, movement: Partial<FinanceMovement>): Observable<FinanceMovement> {
        return this.http.put<FinanceMovement>(`${this.apiUrl}/${id}`, movement);
    }

    /** Hareket sil */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
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
