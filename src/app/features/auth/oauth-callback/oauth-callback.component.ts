import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SocialAuthService } from '../../../core/services/social-auth.service';

@Component({
    selector: 'app-oauth-callback',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './oauth-callback.component.html',
    styleUrl: './oauth-callback.component.css'
})
export class OAuthCallbackComponent implements OnInit {
    private route       = inject(ActivatedRoute);
    private router      = inject(Router);
    private authService = inject(AuthService);
    private socialAuth  = inject(SocialAuthService);

    error  = signal('');
    status = signal('Kimlik doğrulanıyor...');

    ngOnInit(): void {
        const params   = this.route.snapshot.queryParams;
        const code     = params['code']  as string | undefined;
        const state    = params['state'] as string | undefined;
        const errParam = params['error'] as string | undefined;

        // Provider erişimi reddetti
        if (errParam) {
            this.error.set(
                errParam === 'access_denied'
                    ? 'Giriş izni reddedildi.'
                    : `OAuth hatası: ${errParam}`
            );
            return;
        }

        if (!code || !state) {
            this.error.set('Geçersiz callback parametreleri.');
            return;
        }

        const payload = this.socialAuth.consumeCallback(code, state);
        if (!payload) {
            this.error.set('Güvenlik doğrulaması başarısız (state uyuşmuyor). Lütfen tekrar deneyin.');
            return;
        }

        this.status.set('Hesabınıza giriş yapılıyor...');

        this.authService.loginSocial(payload).subscribe({
            next: () => {
                const user = this.authService.currentUser();
                const role = user?.role;
                if (role === 'SuperAdmin' || role === 'Admin') {
                    this.router.navigate(['/admin/dashboard']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (err: any) => {
                this.error.set(
                    err.error?.detail ||
                    err.error?.message ||
                    'Sosyal giriş başarısız oldu. Lütfen tekrar deneyin.'
                );
            }
        });
    }

    retry(): void {
        this.router.navigate(['/auth/login']);
    }
}
