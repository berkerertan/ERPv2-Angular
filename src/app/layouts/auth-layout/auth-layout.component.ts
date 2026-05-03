import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ShaderAnimationComponent } from '../../shared/components/shader-animation/shader-animation.component';
import { VersionBadgeComponent } from '../../shared/components/version-badge/version-badge.component';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ShaderAnimationComponent, VersionBadgeComponent],
    templateUrl: './auth-layout.component.html',
    styleUrl: './auth-layout.component.css'
})
export class AuthLayoutComponent { }
