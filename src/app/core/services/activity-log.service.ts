import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    TenantActivityLogDto,
    TenantActivitySummaryDto,
    TenantActivityFilter
} from '../models/activity-log.model';

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
    private readonly base = `${environment.apiUrl}/api/activity-logs/me`;

    constructor(private http: HttpClient) {}

    getSummary(filter?: Partial<TenantActivityFilter>): Observable<TenantActivitySummaryDto> {
        return this.http.get<TenantActivitySummaryDto>(`${this.base}/summary`, {
            params: this.buildParams(filter)
        });
    }

    getLogs(filter?: TenantActivityFilter): Observable<TenantActivityLogDto[]> {
        return this.http.get<TenantActivityLogDto[]>(this.base, {
            params: this.buildParams(filter)
        });
    }

    getLog(id: string): Observable<TenantActivityLogDto> {
        return this.http.get<TenantActivityLogDto>(`${this.base}/${id}`);
    }

    exportCsv(filter?: TenantActivityFilter): Observable<Blob> {
        return this.http.get(`${this.base}/export`, {
            params: this.buildParams(filter),
            responseType: 'blob'
        });
    }

    exportExcel(filter?: TenantActivityFilter): Observable<Blob> {
        return this.http.get(`${this.base}/export/excel`, {
            params: this.buildParams(filter),
            responseType: 'blob'
        });
    }

    exportPdf(filter?: TenantActivityFilter): Observable<Blob> {
        return this.http.get(`${this.base}/export/pdf`, {
            params: this.buildParams(filter),
            responseType: 'blob'
        });
    }

    private buildParams(filter?: Record<string, any>): HttpParams {
        let params = new HttpParams();
        if (!filter) return params;
        Object.keys(filter).forEach(key => {
            const value = filter[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });
        return params;
    }
}
