import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CariAccount,
    CreateCariAccountRequest,
    UpdateCariAccountRequest,
    CariAccountSuggestionDto,
    CariDebtItem,
    CreateCariDebtItemRequest,
    UpdateCariDebtItemRequest,
    CariAccountDetailsResponse,
    CariDebtItemImportResult,
    BuyerDebtItemsBatchImportResult,
    BuyerBatchImportOptions,
    BuyerRiskSummaryResponse
} from '../models/cari-account.model';

@Injectable({ providedIn: 'root' })
export class CariAccountService {
    private readonly apiUrl = `${environment.apiUrl}/api/cari-accounts`;

    constructor(private http: HttpClient) { }

    /** Tüm cari hesaplar — arama, sayfalama, sıralama */
    getAll(params?: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(this.apiUrl, {
            params: this.buildParams(params)
        });
    }

    /** Sadece tedarikçiler */
    getSuppliers(params?: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(`${this.apiUrl}/suppliers`, {
            params: this.buildParams(params)
        });
    }

    /** Sadece alıcılar */
    getBuyers(params?: { q?: string; page?: number; pageSize?: number; sortBy?: string; sortDir?: string }): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(`${this.apiUrl}/buyers`, {
            params: this.buildParams(params)
        });
    }

    getBuyerRiskSummary(limit: number = 20): Observable<BuyerRiskSummaryResponse> {
        return this.http.get<BuyerRiskSummaryResponse>(`${this.apiUrl}/buyers/risk-summary`, {
            params: { limit: limit.toString() }
        });
    }

    /** Tüm cari suggest (hızlı öneri) */
    suggest(q: string, limit: number = 8): Observable<CariAccountSuggestionDto[]> {
        return this.http.get<CariAccountSuggestionDto[]>(`${this.apiUrl}/suggest`, {
            params: { q, limit: limit.toString() }
        });
    }

    /** Alıcı suggest */
    suggestBuyers(q: string, limit: number = 8): Observable<CariAccountSuggestionDto[]> {
        return this.http.get<CariAccountSuggestionDto[]>(`${this.apiUrl}/buyers/suggest`, {
            params: { q, limit: limit.toString() }
        });
    }

    /** Tedarikçi suggest */
    suggestSuppliers(q: string, limit: number = 8): Observable<CariAccountSuggestionDto[]> {
        return this.http.get<CariAccountSuggestionDto[]>(`${this.apiUrl}/suppliers/suggest`, {
            params: { q, limit: limit.toString() }
        });
    }

    /** Tek cari hesap detayı */
    getById(id: string): Observable<CariAccount> {
        return this.http.get<CariAccount>(`${this.apiUrl}/${id}`);
    }

    /** Cari hesap detay sayfası (account + debt items) */
    getDetails(id: string): Observable<CariAccountDetailsResponse> {
        return this.http.get<CariAccountDetailsResponse>(`${this.apiUrl}/${id}/details`);
    }

    /** Yeni cari hesap oluştur — 201 Created: uuid döner */
    create(account: CreateCariAccountRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, account);
    }

    /** Cari hesap güncelle — 204 No Content */
    update(id: string, account: UpdateCariAccountRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, account);
    }

    /** Cari hesap sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // ═══════════ Debt Items ═══════════

    /** Cari hesabın borç kalemleri */
    getDebtItems(cariAccountId: string): Observable<CariDebtItem[]> {
        return this.http.get<CariDebtItem[]>(`${this.apiUrl}/${cariAccountId}/debt-items`);
    }

    /** Tek borç kalemi */
    getDebtItem(cariAccountId: string, debtItemId: string): Observable<CariDebtItem> {
        return this.http.get<CariDebtItem>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`);
    }

    /** Yeni borç kalemi ekle — 201 Created: uuid döner */
    createDebtItem(cariAccountId: string, item: CreateCariDebtItemRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/${cariAccountId}/debt-items`, item);
    }

    /** Borç kalemi güncelle — 204 No Content */
    updateDebtItem(cariAccountId: string, debtItemId: string, item: UpdateCariDebtItemRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`, item);
    }

    /** Borç kalemi sil — 204 No Content */
    deleteDebtItem(cariAccountId: string, debtItemId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`);
    }

    /** Excel'den toplu borç kalemi import */
    importExcel(cariAccountId: string, formData: FormData): Observable<CariDebtItemImportResult> {
        return this.http.post<CariDebtItemImportResult>(
            `${this.apiUrl}/${cariAccountId}/debt-items/import-excel`,
            formData
        );
    }

    /** Toplu alıcı import — birden fazla Excel dosyasını yükler, alıcı adını dosya isminden çıkarır */
    importBuyersBatch(files: File[], options?: BuyerBatchImportOptions): Observable<BuyerDebtItemsBatchImportResult> {
        const formData = new FormData();
        files.forEach(f => formData.append('Files', f));
        if (options?.replaceExisting !== undefined) formData.append('ReplaceExisting', options.replaceExisting.toString());
        if (options?.transactionDateColumn) formData.append('TransactionDateColumn', options.transactionDateColumn);
        if (options?.materialDescriptionColumn) formData.append('MaterialDescriptionColumn', options.materialDescriptionColumn);
        if (options?.quantityColumn) formData.append('QuantityColumn', options.quantityColumn);
        if (options?.listPriceColumn) formData.append('ListPriceColumn', options.listPriceColumn);
        if (options?.salePriceColumn) formData.append('SalePriceColumn', options.salePriceColumn);
        if (options?.totalAmountColumn) formData.append('TotalAmountColumn', options.totalAmountColumn);
        if (options?.paymentColumn) formData.append('PaymentColumn', options.paymentColumn);
        if (options?.remainingBalanceColumn) formData.append('RemainingBalanceColumn', options.remainingBalanceColumn);
        return this.http.post<BuyerDebtItemsBatchImportResult>(`${this.apiUrl}/buyers/import-excel`, formData);
    }

    /** Belirli bir alıcının veresiye verilerini Excel olarak indir (import formatıyla aynı) */
    exportBuyerExcel(cariAccountId: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/${cariAccountId}/export-excel`, {
            responseType: 'blob'
        });
    }

    /** HTTP query param builder */
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
