import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent {
    userName = '';
    password = '';
    isLoading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);

    devRoles = [
        { role: 'Admin', label: 'Admin', icon: 'admin_panel_settings', color: '#4c6ef5' },
        { role: 'Manager', label: 'Şube Müdürü', icon: 'supervisor_account', color: '#7950f2' },
        { role: 'Cashier', label: 'Kasiyer', icon: 'point_of_sale', color: '#20c997' },
        { role: 'Viewer', label: 'İzleyici', icon: 'visibility', color: '#fab005' },
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onSubmit(): void {
        if (!this.userName || !this.password) {
            this.errorMessage.set('Kullanıcı adı ve şifre gereklidir.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.login({ userName: this.userName, password: this.password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                const role = this.authService.currentUser()?.role;
                if (role === 'SuperAdmin' || role === 'Admin') {
                    this.router.navigate(['/admin/dashboard']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.errorMessage.set(
                    err.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
                );
            }
        });
    }

    devLogin(): void {
        this.authService.devLogin();
    }

    devLoginAs(role: string): void {
        this.authService.devLoginAs(role);
    }
}
