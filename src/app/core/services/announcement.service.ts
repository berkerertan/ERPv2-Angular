import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnnouncementDto, UpsertAnnouncementRequest } from '../models/announcement.model';

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private readonly apiUrl = `${environment.apiUrl}/api/announcements`;
    private readonly adminApiUrl = `${environment.apiUrl}/api/platform-admin/announcements`;

    constructor(private http: HttpClient) {}

    // ── Public endpoints (tüm kullanıcılar) ────────────────────────────
    getPublished(q?: string, page?: number, pageSize?: number): Observable<AnnouncementDto[]> {
        let params = new HttpParams();
        if (q) params = params.set('q', q);
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<AnnouncementDto[]>(this.apiUrl, { params });
    }

    getById(id: string): Observable<AnnouncementDto> {
        return this.http.get<AnnouncementDto>(`${this.apiUrl}/${id}`);
    }

    // ── Admin endpoints (PlatformAdmin) ─────────────────────────────────
    adminGetAll(q?: string, includeUnpublished = true, page?: number, pageSize?: number): Observable<AnnouncementDto[]> {
        let params = new HttpParams();
        if (q) params = params.set('q', q);
        params = params.set('includeUnpublished', includeUnpublished.toString());
        if (page) params = params.set('page', page.toString());
        if (pageSize) params = params.set('pageSize', pageSize.toString());
        return this.http.get<AnnouncementDto[]>(this.adminApiUrl, { params });
    }

    adminGetById(id: string): Observable<AnnouncementDto> {
        return this.http.get<AnnouncementDto>(`${this.adminApiUrl}/${id}`);
    }

    adminCreate(req: UpsertAnnouncementRequest): Observable<string> {
        return this.http.post<string>(`${this.adminApiUrl}`, req);
    }

    adminUpdate(id: string, req: UpsertAnnouncementRequest): Observable<void> {
        return this.http.put<void>(`${this.adminApiUrl}/${id}`, req);
    }

    adminDelete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.adminApiUrl}/${id}`);
    }

    adminPublish(id: string): Observable<void> {
        return this.http.post<void>(`${this.adminApiUrl}/${id}/publish`, {});
    }

    adminUnpublish(id: string): Observable<void> {
        return this.http.post<void>(`${this.adminApiUrl}/${id}/unpublish`, {});
    }
}
