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
    email = '';
    password = '';
    isLoading = signal(false);
    errorMessage = signal('');
    showPassword = signal(false);

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onSubmit(): void {
        if (!this.email || !this.password) {
            this.errorMessage.set('E-posta ve şifre gereklidir.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        this.authService.login({ email: this.email, password: this.password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
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
}
