import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CheckNote,
    CheckNoteDueListItem,
    UpsertCheckNoteRequest,
    UpdateCheckNoteStatusRequest,
    SettleCheckNoteRequest,
    SettleCheckNoteResult
} from '../models/check-bill.model';

@Injectable({ providedIn: 'root' })
export class CheckNoteService {
    private readonly apiUrl = `${environment.apiUrl}/api/accounting/check-notes`;

    constructor(private http: HttpClient) {}

    /** Çek/Senet listesi (filtre parametreleriyle) */
    getAll(params?: Record<string, any>): Observable<CheckNote[]> {
        return this.http.get<CheckNote[]>(this.apiUrl, { params: this.buildParams(params) });
    }

    /** Detay */
    getById(id: string): Observable<CheckNote> {
        return this.http.get<CheckNote>(`${this.apiUrl}/${id}`);
    }

    /** Yeni çek/senet — 201 Created: uuid döner */
    create(request: UpsertCheckNoteRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, request);
    }

    /** Güncelle — 204 No Content */
    update(id: string, request: UpsertCheckNoteRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, request);
    }

    /** Durum değiştir (ciro, protesto, iptal vb.) — POST */
    changeStatus(id: string, request: UpdateCheckNoteStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/status`, request);
    }

    /** Tahsilat / ödeme tamamla — POST */
    settle(id: string, request: SettleCheckNoteRequest): Observable<SettleCheckNoteResult> {
        return this.http.post<SettleCheckNoteResult>(`${this.apiUrl}/${id}/settle`, request);
    }

    /** Vadesi yaklaşanlar listesi */
    getDueList(params?: Record<string, any>): Observable<CheckNoteDueListItem[]> {
        return this.http.get<CheckNoteDueListItem[]>(`${this.apiUrl}/due-list`, { params: this.buildParams(params) });
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
