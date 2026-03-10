import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    FinanceMovement,
    CreateFinanceMovementRequest,
    UpdateFinanceMovementRequest,
    FinanceMovementType
} from '../models/finance-movement.model';

@Injectable({ providedIn: 'root' })
export class FinanceMovementService {
    private readonly apiUrl = `${environment.apiUrl}/api/finance-movements`;

    constructor(private http: HttpClient) { }

    /** Finans hareketleri listesi */
    getAll(): Observable<FinanceMovement[]> {
        return this.http.get<FinanceMovement[]>(this.apiUrl);
    }

    /** Hareket detayı */
    getById(id: string): Observable<FinanceMovement> {
        return this.http.get<FinanceMovement>(`${this.apiUrl}/${id}`);
    }

    /** Yeni finans hareketi — 201 Created: uuid döner */
    create(movement: CreateFinanceMovementRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, movement);
    }

    /** Hareket güncelle — 204 No Content */
    update(id: string, movement: UpdateFinanceMovementRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, movement);
    }

    /** Hareket sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
