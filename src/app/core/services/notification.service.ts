import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'danger';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

  private _notifications = signal<AppNotification[]>([]);
  public notifications = this._notifications.asReadonly();

  constructor() {
    this.load();
  }

  get unreadCount() {
    return this._notifications().filter(n => !n.isRead).length;
  }

  load(): void {
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this._notifications.set(data.map(n => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: n.type,
          timestamp: n.createdAt,
          isRead: n.isRead,
          link: n.link
        })));
      },
      error: () => {
        // Fallback: welcome notification
        this._notifications.set([{
          id: '0',
          title: 'Sisteme Hoş Geldiniz!',
          message: 'ERPv2 sistemine giriş yaptınız.',
          type: 'success',
          timestamp: new Date().toISOString(),
          isRead: false
        }]);
      }
    });
  }

  broadcastNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title, message, type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    this._notifications.update(n => [newNotif, ...n]);
  }

  markAsRead(id: string) {
    this._notifications.update(n =>
      n.map(item => item.id === id ? { ...item, isRead: true } : item)
    );
  }

  markAllAsRead() {
    this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe();
    this._notifications.update(n => n.map(item => ({ ...item, isRead: true })));
  }

  deleteNotification(id: string) {
    this._notifications.update(n => n.filter(item => item.id !== id));
  }
}
