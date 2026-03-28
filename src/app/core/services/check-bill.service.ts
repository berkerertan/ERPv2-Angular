import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CheckBill,
    CreateCheckBillRequest,
    UpdateCheckBillRequest,
    ChangeCheckNoteStatusRequest,
    SettleCheckNoteRequest
} from '../models/check-bill.model';

@Injectable({ providedIn: 'root' })
export class CheckBillService {
    private readonly apiUrl = `${environment.apiUrl}/api/accounting/check-notes`;

    constructor(private http: HttpClient) {}

    /** Çek/Senet listesi */
    getAll(params?: Record<string, any>): Observable<CheckBill[]> {
        return this.http.get<CheckBill[]>(this.apiUrl, { params: this.buildParams(params) });
    }

    /** Detay */
    getById(id: string): Observable<CheckBill> {
        return this.http.get<CheckBill>(`${this.apiUrl}/${id}`);
    }

    /** Yeni çek/senet — 201 Created: uuid döner */
    create(request: CreateCheckBillRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, request);
    }

    /** Güncelle — 204 No Content */
    update(id: string, request: UpdateCheckBillRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, request);
    }

    /** Durum değiştir (ciro, protesto, iade vb.) */
    changeStatus(id: string, request: ChangeCheckNoteStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/status`, request);
    }

    /** Tahsil/Ödeme — FinanceMovement + Kasa/Banka hareketi oluşturur */
    settle(id: string, request: SettleCheckNoteRequest): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/${id}/settle`, request);
    }

    /** Vadesi yaklaşan/geçmiş belgelerin listesi */
    getDueList(days?: number): Observable<any[]> {
        const params = days !== undefined ? { days: days.toString() } : undefined;
        return this.http.get<any[]>(`${this.apiUrl}/due-list`, { params: this.buildParams(params) });
    }

    /** Sil — 204 No Content */
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
