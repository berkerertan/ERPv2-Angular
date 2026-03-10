import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Company, CreateCompanyRequest, UpdateCompanyRequest } from '../models/company.model';

@Injectable({ providedIn: 'root' })
export class CompanyService {
    private readonly apiUrl = `${environment.apiUrl}/api/companies`;

    constructor(private http: HttpClient) { }

    /** Şirket listesi */
    getAll(): Observable<Company[]> {
        return this.http.get<Company[]>(this.apiUrl);
    }

    /** Şirket detayı */
    getById(id: string): Observable<Company> {
        return this.http.get<Company>(`${this.apiUrl}/${id}`);
    }

    /** Yeni şirket — 201 Created: uuid döner */
    create(company: CreateCompanyRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, company);
    }

    /** Şirket güncelle — 204 No Content */
    update(id: string, company: UpdateCompanyRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, company);
    }

    /** Şirket sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
