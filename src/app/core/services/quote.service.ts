import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Quote,
    QuoteListItem,
    UpsertQuoteRequest,
    UpdateQuoteStatusRequest,
    ConvertToOrderRequest
} from '../models/quote.model';

@Injectable({ providedIn: 'root' })
export class QuoteService {
    private readonly apiUrl = `${environment.apiUrl}/api/quotes`;

    constructor(private http: HttpClient) {}

    getAll(params?: Record<string, any>): Observable<QuoteListItem[]> {
        return this.http.get<QuoteListItem[]>(this.apiUrl, { params: this.buildParams(params) });
    }

    getById(id: string): Observable<Quote> {
        return this.http.get<Quote>(`${this.apiUrl}/${id}`);
    }

    create(request: UpsertQuoteRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, request);
    }

    update(id: string, request: UpsertQuoteRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, request);
    }

    changeStatus(id: string, request: UpdateQuoteStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/status`, request);
    }

    convertToOrder(id: string, request: ConvertToOrderRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/${id}/convert-to-order`, request);
    }

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
