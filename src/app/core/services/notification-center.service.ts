import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppNotification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
    private readonly apiUrl = `${environment.apiUrl}/api/notifications`;

    notifications = signal<AppNotification[]>([]);
    unreadCount = signal(0);

    constructor(private http: HttpClient) {}

    load(): void {
        this.http.get<AppNotification[]>(this.apiUrl).subscribe({
            next: (data) => {
                this.notifications.set(data);
                this.unreadCount.set(data.filter(n => !n.isRead).length);
            },
            error: () => {}
        });
    }

    markAllRead(): void {
        this.http.post(`${this.apiUrl}/mark-all-read`, {}).subscribe({
            next: () => {
                this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
                this.unreadCount.set(0);
            },
            error: () => {}
        });
    }

    markRead(id: string): void {
        this.notifications.update(list =>
            list.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        this.unreadCount.set(this.notifications().filter(n => !n.isRead).length);
    }
}
