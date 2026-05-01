import { Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppNotification, NotificationService } from '../../../core/services/notification.service';
import { ThemeService } from '../../../core/services/theme.service';

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
    public themeService = inject(ThemeService);
    private router = inject(Router);

    toggleProfileMenu(): void {
        this.showProfileMenu.update(v => !v);
        this.showNotifications.set(false);
    }

    toggleNotifications(): void {
        this.showNotifications.update(v => !v);
        this.showProfileMenu.set(false);
        if (this.showNotifications()) {
            this.notificationService.refresh();
        }
    }

    closeMenus(): void {
        this.showProfileMenu.set(false);
        this.showNotifications.set(false);
    }

    onMenuToggle(): void {
        this.toggleSidebar.emit();
    }

    markAsRead(notification: AppNotification | string): void {
        if (typeof notification === 'string') {
            this.notificationService.markAsRead(notification);
            return;
        }

        this.notificationService.markAsRead(notification);
        this.closeMenus();
        if (notification.link) {
            this.router.navigateByUrl(notification.link);
        }
    }

    markAllAsRead(): void {
        this.notificationService.markAllAsRead();
    }

    logout(): void {
        this.authService.logout();
    }
}
