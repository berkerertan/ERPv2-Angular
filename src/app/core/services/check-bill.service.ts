import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CheckNoteDto,
    CheckNoteDueListItemDto,
    UpsertCheckNoteRequest,
    UpdateCheckNoteStatusRequest,
    SettleCheckNoteRequest,
    SettleCheckNoteResultDto
} from '../models/check-bill.model';

@Injectable({ providedIn: 'root' })
export class CheckBillService {
    private readonly base = `${environment.apiUrl}/api/accounting/check-notes`;

    constructor(private http: HttpClient) {}

    getAll(params?: { type?: number; direction?: number; status?: number }): Observable<CheckNoteDto[]> {
        let httpParams = new HttpParams();
        if (params?.type != null) httpParams = httpParams.set('type', params.type);
        if (params?.direction != null) httpParams = httpParams.set('direction', params.direction);
        if (params?.status != null) httpParams = httpParams.set('status', params.status);
        return this.http.get<CheckNoteDto[]>(this.base, { params: httpParams });
    }

    getById(id: string): Observable<CheckNoteDto> {
        return this.http.get<CheckNoteDto>(`${this.base}/${id}`);
    }

    getDueList(): Observable<CheckNoteDueListItemDto[]> {
        return this.http.get<CheckNoteDueListItemDto[]>(`${this.base}/due-list`);
    }

    create(req: UpsertCheckNoteRequest): Observable<string> {
        return this.http.post<string>(this.base, req);
    }

    update(id: string, req: UpsertCheckNoteRequest): Observable<void> {
        return this.http.put<void>(`${this.base}/${id}`, req);
    }

    updateStatus(id: string, req: UpdateCheckNoteStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.base}/${id}/status`, req);
    }

    settle(id: string, req: SettleCheckNoteRequest): Observable<SettleCheckNoteResultDto> {
        return this.http.post<SettleCheckNoteResultDto>(`${this.base}/${id}/settle`, req);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}
