import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse, CreateWarehouseRequest, UpdateWarehouseRequest } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
    private readonly apiUrl = `${environment.apiUrl}/api/warehouses`;

    constructor(private http: HttpClient) { }

    /** Depo listesi */
    getAll(): Observable<Warehouse[]> {
        return this.http.get<Warehouse[]>(this.apiUrl);
    }

    /** Depo detayı */
    getById(id: string): Observable<Warehouse> {
        return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
    }

    /** Yeni depo — 201 Created: uuid döner */
    create(warehouse: CreateWarehouseRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, warehouse);
    }

    /** Depo güncelle — 204 No Content */
    update(id: string, warehouse: UpdateWarehouseRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, warehouse);
    }

    /** Depo sil — 204 No Content */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
