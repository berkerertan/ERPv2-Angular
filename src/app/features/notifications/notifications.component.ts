import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './notifications.component.html',
    styleUrls: ['./notifications.component.css', '../../shared/styles/crud-page.css']
})
export class NotificationsComponent {
    notificationService = inject(NotificationService);

    activeFilter: 'all' | 'unread' = 'all';

    get filtered() {
        const all = this.notificationService.notifications();
        return this.activeFilter === 'unread' ? all.filter(n => !n.isRead) : all;
    }

    getIcon(type: string): string {
        switch (type) {
            case 'success': return 'check_circle';
            case 'danger':
            case 'error':   return 'error';
            case 'warning': return 'warning';
            default:        return 'info';
        }
    }

    timeAgo(timestamp: string): string {
        const diff = Date.now() - new Date(timestamp).getTime();
        const mins  = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days  = Math.floor(diff / 86400000);
        if (mins < 1)    return 'Az önce';
        if (mins < 60)   return `${mins} dk önce`;
        if (hours < 24)  return `${hours} sa önce`;
        return `${days} gün önce`;
    }

    markRead(id: string): void { this.notificationService.markAsRead(id); }
    markAllRead(): void { this.notificationService.markAllAsRead(); }
    delete(id: string): void { this.notificationService.deleteNotification(id); }
}
