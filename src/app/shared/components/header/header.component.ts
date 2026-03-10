import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

    constructor(public authService: AuthService) { }

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

    logout(): void {
        this.authService.logout();
    }
}
