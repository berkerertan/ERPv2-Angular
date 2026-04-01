import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    PosCartDetail,
    PosCartSummary,
    SavePosCartRequest,
    SavePosCartResponse
} from '../models/pos-cart.model';

@Injectable({ providedIn: 'root' })
export class PosCartService {
    private readonly base = `${environment.apiUrl}/api/PosCart`;

    constructor(private http: HttpClient) {}

    list(): Observable<PosCartSummary[]> {
        return this.http.get<PosCartSummary[]>(`${this.base}/List`);
    }

    save(request: SavePosCartRequest): Observable<SavePosCartResponse> {
        return this.http.post<SavePosCartResponse>(`${this.base}/Save`, request);
    }

    delete(id: string): Observable<string> {
        return this.http.delete<string>(`${this.base}/Delete/${id}`);
    }

    byToken(token: string): Observable<PosCartDetail> {
        return this.http.get<PosCartDetail>(`${this.base}/ByToken/${token}`);
    }
}
