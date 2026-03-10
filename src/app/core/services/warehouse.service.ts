import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Warehouse } from '../models/warehouse.model';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
    private readonly apiUrl = `${environment.apiUrl}/api/warehouses`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Warehouse[]> { return this.http.get<Warehouse[]>(this.apiUrl); }
    getById(id: string): Observable<Warehouse> { return this.http.get<Warehouse>(`${this.apiUrl}/${id}`); }
    create(w: Partial<Warehouse>): Observable<Warehouse> { return this.http.post<Warehouse>(this.apiUrl, w); }
    update(id: string, w: Partial<Warehouse>): Observable<Warehouse> { return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, w); }
    delete(id: string): Observable<void> { return this.http.delete<void>(`${this.apiUrl}/${id}`); }
}
