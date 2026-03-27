import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PriceList, CreatePriceListRequest, UpdatePriceListRequest } from '../models/price-list.model';

@Injectable({ providedIn: 'root' })
export class PriceListService {
    private readonly apiUrl = `${environment.apiUrl}/api/price-lists`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<PriceList[]> {
        return this.http.get<PriceList[]>(this.apiUrl);
    }

    getById(id: string): Observable<PriceList> {
        return this.http.get<PriceList>(`${this.apiUrl}/${id}`);
    }

    create(req: CreatePriceListRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, req);
    }

    update(id: string, req: UpdatePriceListRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, req);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
