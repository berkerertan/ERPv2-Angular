import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CariAccount, DebtItem } from '../models/cari-account.model';

@Injectable({ providedIn: 'root' })
export class CariAccountService {
    private readonly apiUrl = `${environment.apiUrl}/api/cari-accounts`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(this.apiUrl);
    }

    getSuppliers(): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(`${this.apiUrl}/suppliers`);
    }

    getBuyers(): Observable<CariAccount[]> {
        return this.http.get<CariAccount[]>(`${this.apiUrl}/buyers`);
    }

    getById(id: string): Observable<CariAccount> {
        return this.http.get<CariAccount>(`${this.apiUrl}/${id}`);
    }

    getDetails(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}/details`);
    }

    create(account: Partial<CariAccount>): Observable<CariAccount> {
        return this.http.post<CariAccount>(this.apiUrl, account);
    }

    update(id: string, account: Partial<CariAccount>): Observable<CariAccount> {
        return this.http.put<CariAccount>(`${this.apiUrl}/${id}`, account);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    // Debt Items
    getDebtItems(cariAccountId: string): Observable<DebtItem[]> {
        return this.http.get<DebtItem[]>(`${this.apiUrl}/${cariAccountId}/debt-items`);
    }

    getDebtItem(cariAccountId: string, debtItemId: string): Observable<DebtItem> {
        return this.http.get<DebtItem>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`);
    }

    createDebtItem(cariAccountId: string, item: Partial<DebtItem>): Observable<DebtItem> {
        return this.http.post<DebtItem>(`${this.apiUrl}/${cariAccountId}/debt-items`, item);
    }

    updateDebtItem(cariAccountId: string, debtItemId: string, item: Partial<DebtItem>): Observable<DebtItem> {
        return this.http.put<DebtItem>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`, item);
    }

    deleteDebtItem(cariAccountId: string, debtItemId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${cariAccountId}/debt-items/${debtItemId}`);
    }

    importExcel(cariAccountId: string, file: File): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<any>(`${this.apiUrl}/${cariAccountId}/debt-items/import-excel`, formData);
    }
}
