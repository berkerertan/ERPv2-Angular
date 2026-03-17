import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    Invoice,
    InvoiceItem,
    InvoiceType,
    InvoiceStatus,
    InvoiceCategory,
    CreateInvoiceRequest,
    UpdateInvoiceRequest,
    CreateInvoiceFromOrderRequest,
    InvoiceSummary,
    InvoiceListItemDto,
    InvoiceDetailDto
} from '../models/invoice.model';
import { ApiQueryParams } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
    private readonly apiUrl = `${environment.apiUrl}/api/invoices`;

    constructor(private http: HttpClient) { }

    // ─── Liste & Detay ────────────────────────────────────────

    /** Fatura listesi — type ve status filtresi (eski endpoint) */
    getAll(params?: ApiQueryParams & {
        invoiceType?: InvoiceType;
        status?: InvoiceStatus;
        startDate?: string;
        endDate?: string;
    }): Observable<Invoice[]> {
        return this.http.get<Invoice[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** E-Fatura listesi — GET /api/invoices/e-fatura */
    getEFaturaList(params?: { invoiceCategory?: InvoiceCategory; status?: InvoiceStatus }): Observable<InvoiceListItemDto[]> {
        return this.http.get<InvoiceListItemDto[]>(`${this.apiUrl}/e-fatura`, { params: this.buildParams(params) });
    }

    /** E-Arşiv listesi — GET /api/invoices/e-arsiv */
    getEArsivList(params?: { invoiceCategory?: InvoiceCategory; status?: InvoiceStatus }): Observable<InvoiceListItemDto[]> {
        return this.http.get<InvoiceListItemDto[]>(`${this.apiUrl}/e-arsiv`, { params: this.buildParams(params) });
    }

    /** Fatura başlık + kalemler tek çağrıda — GET /api/invoices/{id}/detail */
    getDetail(id: string): Observable<InvoiceDetailDto> {
        return this.http.get<InvoiceDetailDto>(`${this.apiUrl}/${id}/detail`);
    }

    /** Yazdırılabilir HTML önizleme — text/html döner */
    getPreviewHtml(id: string): Observable<string> {
        return this.http.get(`${this.apiUrl}/${id}/preview-html`, { responseType: 'text' });
    }

    /** Fatura detayı (sadece başlık) */
    getById(id: string): Observable<Invoice> {
        return this.http.get<Invoice>(`${this.apiUrl}/${id}`);
    }

    /** Fatura kalemleri */
    getItems(invoiceId: string): Observable<InvoiceItem[]> {
        return this.http.get<InvoiceItem[]>(`${this.apiUrl}/${invoiceId}/items`);
    }

    /** Fatura özet istatistikleri */
    getSummary(invoiceType?: InvoiceType): Observable<InvoiceSummary> {
        let params = new HttpParams();
        if (invoiceType) params = params.set('invoiceType', invoiceType.toString());
        return this.http.get<InvoiceSummary>(`${this.apiUrl}/summary`, { params });
    }

    // ─── CRUD ─────────────────────────────────────────────────

    /** Yeni fatura oluştur (taslak) */
    create(invoice: CreateInvoiceRequest): Observable<Invoice> {
        return this.http.post<Invoice>(this.apiUrl, invoice);
    }

    /** Fatura güncelle (sadece taslak durumda) */
    update(id: string, invoice: UpdateInvoiceRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, invoice);
    }

    /** Fatura sil (soft delete, sadece taslak) */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // ─── Sipariş'ten Fatura ─────────────────────────────────

    /** Satış siparisinden fatura oluştur */
    createFromSalesOrder(salesOrderId: string, request: CreateInvoiceFromOrderRequest): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiUrl}/from-sales-order/${salesOrderId}`, request);
    }

    /** Satın alma siparisinden fatura oluştur */
    createFromPurchaseOrder(purchaseOrderId: string, request: CreateInvoiceFromOrderRequest): Observable<Invoice> {
        return this.http.post<Invoice>(`${this.apiUrl}/from-purchase-order/${purchaseOrderId}`, request);
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
