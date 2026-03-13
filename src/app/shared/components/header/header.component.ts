import { Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css'
})
export class HeaderComponent {
    @Output() toggleSidebar = new EventEmitter<void>();

    showProfileMenu = signal(false);
    showNotifications = signal(false);

    public authService = inject(AuthService);
    public notificationService = inject(NotificationService);

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
        this.showNotifications.set(false);
    }

    toggleNotifications(): void {
        this.showNotifications.update(v => !v);
        this.showProfileMenu.set(false);
    }

    closeMenus(): void {
        this.showProfileMenu.set(false);
        this.showNotifications.set(false);
    }

    onMenuToggle(): void {
        this.toggleSidebar.emit();
    }

    markAsRead(id: string): void {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    logout(): void {
        this.authService.logout();
    }
}
