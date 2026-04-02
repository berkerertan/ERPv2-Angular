import { Injectable, signal } from '@angular/core';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // State
  private _notifications = signal<AppNotification[]>([]);
  public notifications = this._notifications.asReadonly();

  constructor() {
    this.loadInitialNotifications();
  }

  // Derived state
  get unreadCount() {
    return this._notifications().filter(n => !n.isRead).length;
  }

  // Load some seed data or load from API (mocked)
  private loadInitialNotifications() {
    // We can start with empty or some generic welcome notification
    this._notifications.set([
      {
        id: '1',
        title: 'Sisteme Hoş Geldiniz!',
        message: 'StokNet sistemine giriş yaptınız. Tüm işlemlerinizi güvenle gerçekleştirebilirsiniz.',
        type: 'success',
        timestamp: new Date().toISOString(),
        isRead: false
      }
    ]);
  }

  // Simulated method for Admin to broadcast a message to all users
  broadcastNotification(title: string, message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const newNotif: AppNotification = {
      id: Date.now().toString(),
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    // Unshift to put it at the beginning
    this._notifications.update(n => [newNotif, ...n]);
  }

  markAsRead(id: string) {
    this._notifications.update(n => 
      n.map(item => item.id === id ? { ...item, isRead: true } : item)
    );
  }

  markAllAsRead() {
    this._notifications.update(n =>
      n.map(item => ({ ...item, isRead: true }))
    );
  }

  deleteNotification(id: string) {
    this._notifications.update(n => n.filter(item => item.id !== id));
  }
}
