import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Waybill, CreateWaybillRequest } from '../models/waybill.model';

@Injectable({ providedIn: 'root' })
export class WaybillService {
    private readonly apiUrl = `${environment.apiUrl}/api/waybills`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Waybill[]> {
        return this.http.get<Waybill[]>(this.apiUrl);
    }

    getById(id: string): Observable<Waybill> {
        return this.http.get<Waybill>(`${this.apiUrl}/${id}`);
    }

    create(req: CreateWaybillRequest): Observable<string> {
        return this.http.post<string>(this.apiUrl, req);
    }

    ship(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/ship`, {});
    }

    deliver(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/deliver`, {});
    }

    cancel(id: string): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/cancel`, {});
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
