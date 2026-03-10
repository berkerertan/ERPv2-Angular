import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Invoice, InvoiceItem, InvoiceCreateRequest, InvoiceSummary } from '../models/invoice.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private readonly apiUrl = `${environment.apiUrl}/api/invoices`;

    constructor(private http: HttpClient) { }

    // ─── Liste & Detay ────────────────────────────────────────

    /** Fatura listesi — type ve status filtresi */
    getAll(params?: ApiQueryParams & {
        invoiceType?: 'EFatura' | 'EArsiv';
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Fatura detayı */
    getById(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    /** Fatura kalemleri */
    getItems(invoiceId: string): Observable<InvoiceItem[]> {
        return this.http.get<InvoiceItem[]>(`${this.apiUrl}/${invoiceId}/items`);
    }

    /** Fatura özet istatistikleri */
    getSummary(invoiceType?: 'EFatura' | 'EArsiv'): Observable<InvoiceSummary> {
        let params = new HttpParams();
        if (invoiceType) params = params.set('invoiceType', invoiceType);
        return this.http.get<InvoiceSummary>(`${this.apiUrl}/summary`, { params });
    }

    // ─── CRUD ─────────────────────────────────────────────────

    /** Yeni fatura oluştur (taslak) */
    create(invoice: InvoiceCreateRequest): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, invoice);
    }

    /** Fatura güncelle (sadece taslak durumda) */
    update(id: string, invoice: Partial<InvoiceCreateRequest>): Observable<Invoice> {
        return this.http.put<Invoice>(`${this.apiUrl}/${id}`, invoice);
    }

    /** Fatura sil (soft delete, sadece taslak) */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // ─── İşlemler ─────────────────────────────────────────────

    /** Faturayı gönder (Draft → Sent) — GIB'e iletilir */
    send(id: string): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiUrl}/${id}/send`, {});
    }

    /** Faturayı iptal et */
    cancel(id: string, reason: string): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiUrl}/${id}/cancel`, { reason });
    }

    /** Fatura PDF indir */
    downloadPdf(id: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/pdf`, {
            responseType: 'blob'
        });
    }

    /** Fatura XML indir (UBL) */
    downloadXml(id: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${id}/xml`, {
            responseType: 'blob'
        });
    }

    // ─── Yardımcılar ──────────────────────────────────────────

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
