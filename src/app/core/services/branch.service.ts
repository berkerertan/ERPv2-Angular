import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Branch } from '../models/branch.model';

@Injectable({ providedIn: 'root' })
export class BranchService {
    private readonly apiUrl = `${environment.apiUrl}/api/branches`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Branch[]> { return this.http.get<Branch[]>(this.apiUrl); }
    getById(id: string): Observable<Branch> { return this.http.get<Branch>(`${this.apiUrl}/${id}`); }
    create(b: Partial<Branch>): Observable<Branch> { return this.http.post<Branch>(this.apiUrl, b); }
    update(id: string, b: Partial<Branch>): Observable<Branch> { return this.http.put<Branch>(`${this.apiUrl}/${id}`, b); }
    delete(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
