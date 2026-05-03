import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { CariAccountService } from './cari-account.service';
import { BuyerRiskSummaryItem, BuyerRiskSummaryResponse } from '../models/cari-account.model';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  link?: string | null;
}

interface NotificationApiDto {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAtUtc: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;
  private readonly refreshMs = 30000;
  private _notifications = signal<AppNotification[]>([]);
  public notifications = this._notifications.asReadonly();
  private _showUnreadOnly = signal(false);
  public showUnreadOnly = this._showUnreadOnly.asReadonly();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cariAccountService: CariAccountService
  ) {
    this.refresh();
    setInterval(() => this.refresh(), this.refreshMs);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.refresh();
      }
    });
  }

  get unreadCount() {
    return this._notifications().filter(n => !n.isRead).length;
  }

  get readCount() {
    return this._notifications().filter(n => n.isRead).length;
  }

  get visibleNotifications() {
    return this._notifications().filter(item => !this._showUnreadOnly() || !item.isRead);
  }

  refresh(): void {
    if (!this.authService.isAuthenticated()) {
      this._notifications.set([]);
      return;
    }

    forkJoin({
      notifications: this.http.get<NotificationApiDto[]>(this.apiUrl).pipe(catchError(() => of([]))),
      riskSummary: this.cariAccountService.getBuyerRiskSummary(3).pipe(catchError(() => of(null as BuyerRiskSummaryResponse | null)))
    }).subscribe(({ notifications, riskSummary }) => {
      const apiItems = notifications.map(item => this.mapApiNotification(item));
      const riskItems = this.mapRiskNotifications(riskSummary?.items ?? []);
      this._notifications.set([...riskItems, ...apiItems].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    });
  }

  broadcastNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const newNotif: AppNotification = {
      id: `local-${Date.now()}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false,
      link: null
    };
    this._notifications.update(n => [newNotif, ...n]);
  }

  markAsRead(notificationOrId: AppNotification | string) {
    const id = typeof notificationOrId === 'string' ? notificationOrId : notificationOrId.id;
    this._notifications.update(n =>
      n.map(item => item.id === id ? { ...item, isRead: true } : item)
    );
    if (!id.startsWith('system-risk-')) {
      this.http.post<void>(`${this.apiUrl}/${id}/read`, {}).pipe(catchError(() => of(void 0))).subscribe();
    }
  }

  markAllAsRead() {
    this._notifications.update(n => n.map(item => ({ ...item, isRead: true })));
    this.http.post<void>(`${this.apiUrl}/read-all`, {}).pipe(catchError(() => of(void 0))).subscribe();
  }

  setUnreadOnly(value: boolean) {
    this._showUnreadOnly.set(value);
  }

  deleteNotification(id: string) {
    this._notifications.update(n => n.filter(item => item.id !== id));
    if (!id.startsWith('system-risk-')) {
      this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(catchError(() => of(void 0))).subscribe();
    }
  }

  clearReadNotifications() {
    this._notifications.update(n => n.filter(item => !item.isRead));
    this.http.delete<void>(`${this.apiUrl}/read`).pipe(catchError(() => of(void 0))).subscribe();
  }

  private mapApiNotification(item: NotificationApiDto): AppNotification {
    return {
      id: item.id,
      title: item.title,
      message: item.message,
      type: this.normalizeType(item.type),
      timestamp: item.createdAtUtc,
      isRead: item.isRead,
      link: item.link ?? null
    };
  }

  private mapRiskNotifications(items: BuyerRiskSummaryItem[]): AppNotification[] {
    return items
      .filter(item => item.severity !== 'stable')
      .map(item => ({
        id: `system-risk-${item.cariAccountId}`,
        title: item.severity === 'critical' ? 'Kritik cari riski' : 'Cari risk uyarisi',
        message: `${item.cariAccountName} icin geciken bakiye ${item.overdueAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL. Risk kullanim orani: %${Math.round(item.riskUsageRate * 100)}.`,
        type: item.severity === 'critical' ? 'error' : 'warning',
        timestamp: new Date().toISOString(),
        isRead: false,
        link: '/cari-accounts/buyers'
      }));
  }

  private normalizeType(type: string): 'info' | 'warning' | 'error' | 'success' {
    const normalized = (type ?? '').toLowerCase();
    if (normalized.includes('success')) return 'success';
    if (normalized.includes('error')) return 'error';
    if (normalized.includes('warning')) return 'warning';
    return 'info';
  }
}
