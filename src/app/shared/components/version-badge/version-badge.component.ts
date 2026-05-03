import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { APP_VERSION } from '../../../core/config/app-version';

@Component({
    selector: 'app-version-badge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './version-badge.component.html',
    styleUrl: './version-badge.component.css'
})
export class VersionBadgeComponent {
    readonly version = APP_VERSION;
}
