import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Return, CreateReturnRequest } from '../models/return.model';

@Injectable({ providedIn: 'root' })
export class ReturnService {
    private readonly apiUrl = `${environment.apiUrl}/api/returns`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Return[]> {
        return this.http.get<Return[]>(this.apiUrl);
    }

    getById(id: string): Observable<Return> {
        return this.http.get<Return>(`${this.apiUrl}/${id}`);
    }

    create(req: CreateReturnRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, req);
    }

    approve(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/approve`, {});
    }

    reject(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/reject`, {});
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
