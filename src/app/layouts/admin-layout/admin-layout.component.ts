import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface NavItem {
    label: string;
    icon: string;
    route: string;
    badge?: string;
}

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLinkActive],
    templateUrl: './admin-layout.component.html',
    styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
    sidebarCollapsed = signal(false);

    navItems: NavItem[] = [
        { label: 'Genel Bakış', icon: 'dashboard', route: '/admin/dashboard' },
        { label: 'Aboneler', icon: 'people', route: '/admin/subscribers' },
        { label: 'Abonelik Planları', icon: 'workspace_premium', route: '/admin/plans' },
        { label: 'Gelir & Analitik', icon: 'analytics', route: '/admin/revenue' },
        { label: 'Sayfa İçeriği', icon: 'edit_document', route: '/admin/content' },
        { label: 'Duyurular', icon: 'campaign', route: '/admin/announcements' },
        { label: 'Denetim Kayıtları', icon: 'shield', route: '/admin/audit-logs' },
    ];

    constructor(
        public authService: AuthService,
        private router: Router
    ) {}

    toggleSidebar() {
        this.sidebarCollapsed.update(v => !v);
    }

    logout() {
        this.authService.logout();
    }

    goToApp() {
        this.router.navigate(['/dashboard']);
    }
}
