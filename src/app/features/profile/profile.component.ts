import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CurrentUserDto } from '../../core/models/user.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css', '../../shared/styles/crud-page.css']
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);

    profile = signal<CurrentUserDto | null>(null);
    loading = signal(true);

    pwForm = { current: '', next: '', confirm: '' };
    pwLoading = signal(false);
    pwSuccess = signal('');
    pwError = signal('');

    readonly planLabels: Record<string, string> = {
        '1': 'Başlangıç',
        '2': 'Profesyonel',
        '3': 'Kurumsal',
        'Starter': 'Başlangıç',
        'Pro': 'Profesyonel',
        'Enterprise': 'Kurumsal'
    };

    readonly statusLabels: Record<string, string> = {
        '1': 'Deneme',
        '2': 'Aktif',
        '3': 'İptal',
        'Trial': 'Deneme',
        'Active': 'Aktif',
        'Cancelled': 'İptal'
    };

    ngOnInit(): void {
        this.authService.getMe().subscribe({
            next: (me) => {
                this.profile.set(me);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    /** Fallback değerler: API başarısızsa localStorage'dan */
    get displayName(): string {
        return this.profile()?.userName || this.authService.currentUser()?.userName || '—';
    }

    get displayRole(): string {
        return this.profile()?.role || this.authService.currentUser()?.role || '—';
    }

    get avatarInitials(): string {
        const name = this.profile()?.userName || this.authService.currentUser()?.userName || '';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }

    get planLabel(): string {
        const p = this.profile();
        if (!p?.subscriptionPlan) return '—';
        return this.planLabels[p.subscriptionPlan] || p.subscriptionPlan;
    }

    get statusLabel(): string {
        const p = this.profile();
        if (!p?.subscriptionStatus) return '—';
        return this.statusLabels[p.subscriptionStatus] || p.subscriptionStatus;
    }

    get statusClass(): string {
        const s = this.profile()?.subscriptionStatus || '';
        if (s === '2' || s === 'Active') return 'active';
        if (s === '1' || s === 'Trial') return 'trial';
        return 'cancelled';
    }

    changePassword(): void {
        this.pwError.set('');
        this.pwSuccess.set('');

        if (!this.pwForm.current || !this.pwForm.next || !this.pwForm.confirm) {
            this.pwError.set('Tüm alanlar zorunludur.');
            return;
        }
        if (this.pwForm.next !== this.pwForm.confirm) {
            this.pwError.set('Yeni şifreler eşleşmiyor.');
            return;
        }
        if (this.pwForm.next.length < 6) {
            this.pwError.set('Yeni şifre en az 6 karakter olmalıdır.');
            return;
        }

        this.pwLoading.set(true);
        this.authService.changePassword({
            currentPassword: this.pwForm.current,
            newPassword: this.pwForm.next
        }).subscribe({
            next: () => {
                this.pwSuccess.set('Şifreniz başarıyla güncellendi.');
                this.pwForm = { current: '', next: '', confirm: '' };
                this.pwLoading.set(false);
            },
            error: (err) => {
                this.pwError.set(err.error?.detail || 'Şifre güncellenemedi. Mevcut şifrenizi kontrol edin.');
                this.pwLoading.set(false);
            }
        });
    }
}
