import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
    private readonly apiUrl = `${environment.apiUrl}/api/companies`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Company[]> { return this.http.get<Company[]>(this.apiUrl); }
    getById(id: string): Observable<Company> { return this.http.get<Company>(`${this.apiUrl}/${id}`); }
    create(c: Partial<Company>): Observable<Company> { return this.http.post<Company>(this.apiUrl, c); }
    update(id: string, c: Partial<Company>): Observable<Company> { return this.http.put<Company>(`${this.apiUrl}/${id}`, c); }
    delete(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
