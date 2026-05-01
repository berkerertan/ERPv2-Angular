import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-verify-email',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './verify-email.component.html',
    styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
    isLoading = signal(true);
    isSuccess = signal(false);
    message = signal('Dogrulama yapiliyor...');
    resolvedEmail = signal('');

    private route = inject(ActivatedRoute);
    private authService = inject(AuthService);

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            const email = (params.get('email') ?? '').trim();
            const token = (params.get('token') ?? '').trim();

            this.resolvedEmail.set(email);

            if (!email || !token) {
                this.isLoading.set(false);
                this.isSuccess.set(false);
                this.message.set('Dogrulama baglantisi eksik veya gecersiz.');
                return;
            }

            this.isLoading.set(true);
            this.authService.confirmEmail({ email, token }).subscribe({
                next: (response) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(response.isVerified);
                    this.message.set(response.message || 'E-posta dogrulama tamamlandi.');
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSuccess.set(false);
                    this.message.set(
                        err?.error?.detail || err?.error?.message || 'Dogrulama basarisiz oldu. Baglanti suresi dolmus olabilir.'
                    );
                }
            });
        });
    }
}
