/** notification.model.ts — Bildirimler */

export type NotificationType = 'info' | 'success' | 'warning' | 'danger';

export interface AppNotification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    link?: string;
}
