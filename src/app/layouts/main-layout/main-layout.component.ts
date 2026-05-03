import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { VersionBadgeComponent } from '../../shared/components/version-badge/version-badge.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent, ToastComponent, ConfirmDialogComponent, VersionBadgeComponent],
    templateUrl: './main-layout.component.html',
    styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
    @ViewChild(SidebarComponent) sidebar!: SidebarComponent;

    onToggleSidebar(): void {
        this.sidebar.toggleMobile();
    }

    get isSidebarCollapsed(): boolean {
        return this.sidebar?.isCollapsed() ?? false;
    }
}
