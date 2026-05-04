import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ConvertSupplierQuoteResult,
    CreateSupplierQuoteRequestRequest,
    SupplierQuoteRequestDetail,
    SupplierQuoteRequestListItem,
    UpsertSupplierQuoteOfferRequest
} from '../models/supplier-quote.model';

@Injectable({ providedIn: 'root' })
export class SupplierQuoteService {
    private readonly apiUrl = `${environment.apiUrl}/api/supplier-quote-requests`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<SupplierQuoteRequestListItem[]> {
        return this.http.get<SupplierQuoteRequestListItem[]>(this.apiUrl);
    }

    getById(id: string): Observable<SupplierQuoteRequestDetail> {
        return this.http.get<SupplierQuoteRequestDetail>(`${this.apiUrl}/${id}`);
    }

    create(request: CreateSupplierQuoteRequestRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, request);
    }

    upsertOffer(requestId: string, offerId: string, request: UpsertSupplierQuoteOfferRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${requestId}/offers/${offerId}`, request);
    }

    selectOffer(requestId: string, offerId: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${requestId}/select-offer`, { offerId });
    }

    convertSelectedOffer(requestId: string): Observable<ConvertSupplierQuoteResult> {
        return this.http.post<ConvertSupplierQuoteResult>(`${this.apiUrl}/${requestId}/convert-selected-offer`, {});
    }
}
