import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CollectionPlanDashboard,
    UpdateCollectionPlanStatusRequest,
    UpsertCollectionPlanRequest
} from '../models/collection-plan.model';

@Injectable({ providedIn: 'root' })
export class CollectionPlanService {
    private readonly apiUrl = `${environment.apiUrl}/api/collection-plans`;

    constructor(private http: HttpClient) {}

    getDashboard(params?: { status?: number; priority?: number; onlyAssignedToMe?: boolean }): Observable<CollectionPlanDashboard> {
        let httpParams = new HttpParams();
        if (params?.status) httpParams = httpParams.set('status', params.status.toString());
        if (params?.priority) httpParams = httpParams.set('priority', params.priority.toString());
        if (params?.onlyAssignedToMe) httpParams = httpParams.set('onlyAssignedToMe', 'true');
        return this.http.get<CollectionPlanDashboard>(`${this.apiUrl}/dashboard`, { params: httpParams });
    }

    upsert(request: UpsertCollectionPlanRequest): Observable<string> {
        return this.http.post<string>(`${this.apiUrl}/upsert`, request);
    }

    updateStatus(id: string, request: UpdateCollectionPlanStatusRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/${id}/status`, request);
    }
}
