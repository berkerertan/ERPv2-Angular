import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService } from '../../../core/services/social-auth.service';

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

    private authService  = inject(AuthService);
    private socialAuth   = inject(SocialAuthService);
    private router       = inject(Router);

    loginWithGoogle(): void { this.socialAuth.initiateGoogle(); }
    loginWithGithub(): void { this.socialAuth.initiateGithub(); }

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
                const user = this.authService.currentUser();
                const role = user?.role;

                if (role === 'SuperAdmin' || role === 'Admin') {
                    this.router.navigate(['/admin/dashboard']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err: any) => {
                this.isLoading.set(false);
                this.errorMessage.set(
                    err.error?.detail || err.error?.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.'
                );
            }
        });
    }

    demoLogin(): void {
        this.userName = 'demo';
        this.password = 'Test123!';
        this.onSubmit();
    }
}
