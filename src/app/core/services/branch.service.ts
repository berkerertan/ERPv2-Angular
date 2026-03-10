import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Branch, CreateBranchRequest, UpdateBranchRequest } from '../models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
    private readonly apiUrl = `${environment.apiUrl}/api/branches`;

    constructor(private http: HttpClient) { }

    /** Şube listesi */
    getAll(): Observable<Branch[]> {
        return this.http.get<Branch[]>(this.apiUrl);
    }

    /** Şube detayı */
    getById(id: string): Observable<Branch> {
        return this.http.get<Branch>(`${this.apiUrl}/${id}`);
    }

    /** Yeni şube — 201 Created: uuid döner */
    create(branch: CreateBranchRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, branch);
    }

    /** Şube güncelle — 204 No Content */
    update(id: string, branch: UpdateBranchRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, branch);
    }

    /** Şube sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
