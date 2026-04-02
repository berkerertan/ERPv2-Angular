import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService } from '../../../core/services/social-auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
    userName = '';
    password = '';
    isLoading = signal(false);
    errorMessage = signal('');
    infoMessage = signal('');
    resendMessage = signal('');
    showResendButton = signal(false);
    isResendLoading = signal(false);
    showPassword = signal(false);

    private authService = inject(AuthService);
    private socialAuth = inject(SocialAuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const verifyPending = params.get('verifyEmailPending');
            const email = params.get('email');
            if (verifyPending === '1') {
                if (email && !this.userName) {
                    this.userName = email;
                }

                this.infoMessage.set(
                    email
                        ? `${email} adresine dogrulama e-postasi gonderildi. Giris yapmadan once e-postanizi onaylayin.`
                        : 'Dogrulama e-postasi gonderildi. Giris yapmadan once e-postanizi onaylayin.'
                );
                this.showResendButton.set(!!email);
            }
        });
    }

    loginWithGoogle(): void { this.socialAuth.initiateGoogle(); }
    loginWithGithub(): void { this.socialAuth.initiateGithub(); }

    togglePassword(): void {
        this.showPassword.update(v => !v);
    }

    onSubmit(): void {
        if (!this.userName || !this.password) {
            this.errorMessage.set('Kullanici adi ve sifre gereklidir.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.resendMessage.set('');
        this.showResendButton.set(false);

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
                const detail = err?.error?.detail || err?.error?.message || 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.';
                this.errorMessage.set(detail);
                this.showResendButton.set(
                    this.isVerificationPendingError(detail) && this.isEmailFormat(this.userName)
                );
            }
        });
    }

    resendVerificationEmail(): void {
        const email = this.userName.trim();
        if (!this.isEmailFormat(email)) {
            this.resendMessage.set('Lutfen e-posta adresinizi girin.');
            return;
        }

        this.isResendLoading.set(true);
        this.resendMessage.set('');

        this.authService.resendVerificationEmail({ email }).subscribe({
            next: (response) => {
                this.isResendLoading.set(false);
                this.resendMessage.set(response.message || 'Dogrulama e-postasi tekrar gonderildi.');
            },
            error: (err: any) => {
                this.isResendLoading.set(false);
                this.resendMessage.set(err?.error?.detail || err?.error?.message || 'Dogrulama e-postasi gonderilemedi.');
            }
        });
    }

    demoLogin(): void {
        this.userName = 'demo';
        this.password = 'Test123!';
        this.onSubmit();
    }

    private isEmailFormat(value: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value ?? '').trim());
    }

    private isVerificationPendingError(detail: string): boolean {
        const normalized = (detail ?? '').toLowerCase();
        return normalized.includes('not verified')
            || normalized.includes('dogrulanmadi')
            || normalized.includes('dogrulama');
    }
}
