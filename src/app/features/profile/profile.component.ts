import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import {
    CurrentUserDto,
    TwoFactorSetupResponse,
    NotificationPreferences,
    ActiveSession
} from '../../core/models/user.model';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css', '../../shared/styles/crud-page.css']
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);
    private toastService = inject(ToastService);
    private confirmService = inject(ConfirmService);

    // ─── Genel State ─────────────────────────────────────────────
    profile = signal<CurrentUserDto | null>(null);
    loading = signal(true);
    activeTab = signal<'account' | 'security' | 'notifications' | 'sessions'>('account');

    // ─── Şifre Değiştirme ────────────────────────────────────────
    pwForm = { current: '', next: '', confirm: '' };
    pwLoading = signal(false);
    pwSuccess = signal('');
    pwError = signal('');

    // ─── 2FA ─────────────────────────────────────────────────────
    twoFactorEnabled = signal(false);
    twoFactorLoading = signal(false);
    twoFactorSetup = signal<TwoFactorSetupResponse | null>(null);
    twoFactorCode = '';
    twoFactorError = signal('');
    twoFactorSuccess = signal('');
    showDisable2FA = signal(false);
    disable2FACode = '';

    // ─── Bildirim Tercihleri ─────────────────────────────────────
    notifPrefs = signal<NotificationPreferences>({
        emailInvoice: true,
        emailPayment: true,
        emailReminder: true,
        emailMarketing: false,
        pushEnabled: true,
        pushOrderStatus: true,
        pushStockAlert: true
    });
    notifLoading = signal(false);
    notifSaving = signal(false);

    // ─── Aktif Oturumlar ─────────────────────────────────────────
    sessions = signal<ActiveSession[]>([]);
    sessionsLoading = signal(false);

    // ─── Label Maps ──────────────────────────────────────────────
    readonly planLabels: Record<string, string> = {
        '1': 'Başlangıç', '2': 'Profesyonel', '3': 'Kurumsal',
        'Starter': 'Başlangıç', 'Pro': 'Profesyonel', 'Enterprise': 'Kurumsal'
    };
    readonly statusLabels: Record<string, string> = {
        '1': 'Deneme', '2': 'Aktif', '3': 'İptal',
        'Trial': 'Deneme', 'Active': 'Aktif', 'Cancelled': 'İptal'
    };

    // ─── Lifecycle ───────────────────────────────────────────────
    ngOnInit(): void {
        this.authService.getMe().subscribe({
            next: (me) => { this.profile.set(me); this.loading.set(false); },
            error: () => { this.loading.set(false); }
        });
        this.load2FAStatus();
        this.loadNotificationPreferences();
    }

    switchTab(tab: 'account' | 'security' | 'notifications' | 'sessions'): void {
        this.activeTab.set(tab);
        if (tab === 'sessions') this.loadSessions();
    }

    // ─── Hesap Bilgileri ─────────────────────────────────────────
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

    // ─── Şifre Değiştirme ────────────────────────────────────────
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

    // ─── 2FA ─────────────────────────────────────────────────────
    private load2FAStatus(): void {
        this.authService.getTwoFactorStatus().subscribe({
            next: (status) => this.twoFactorEnabled.set(status.isEnabled),
            error: () => {}
        });
    }

    start2FASetup(): void {
        this.twoFactorLoading.set(true);
        this.twoFactorError.set('');
        this.twoFactorSuccess.set('');
        this.twoFactorCode = '';

        this.authService.setupTwoFactor().subscribe({
            next: (setup) => {
                this.twoFactorSetup.set(setup);
                this.twoFactorLoading.set(false);
            },
            error: (err) => {
                this.twoFactorError.set(err.error?.detail || '2FA kurulumu başlatılamadı.');
                this.twoFactorLoading.set(false);
            }
        });
    }

    confirm2FASetup(): void {
        if (!this.twoFactorCode || this.twoFactorCode.length < 6) {
            this.twoFactorError.set('6 haneli doğrulama kodunu girin.');
            return;
        }

        this.twoFactorLoading.set(true);
        this.twoFactorError.set('');

        this.authService.enableTwoFactor({ code: this.twoFactorCode }).subscribe({
            next: () => {
                this.twoFactorEnabled.set(true);
                this.twoFactorSetup.set(null);
                this.twoFactorCode = '';
                this.twoFactorSuccess.set('İki faktörlü kimlik doğrulama etkinleştirildi.');
                this.twoFactorLoading.set(false);
                this.toastService.success('2FA Aktif', 'İki faktörlü kimlik doğrulama etkinleştirildi.');
            },
            error: (err) => {
                this.twoFactorError.set(err.error?.detail || 'Doğrulama kodu yanlış. Tekrar deneyin.');
                this.twoFactorLoading.set(false);
            }
        });
    }

    cancel2FASetup(): void {
        this.twoFactorSetup.set(null);
        this.twoFactorCode = '';
        this.twoFactorError.set('');
    }

    openDisable2FA(): void {
        this.showDisable2FA.set(true);
        this.disable2FACode = '';
        this.twoFactorError.set('');
    }

    cancelDisable2FA(): void {
        this.showDisable2FA.set(false);
        this.disable2FACode = '';
        this.twoFactorError.set('');
    }

    confirmDisable2FA(): void {
        if (!this.disable2FACode || this.disable2FACode.length < 6) {
            this.twoFactorError.set('Doğrulama kodunu girin.');
            return;
        }

        this.twoFactorLoading.set(true);
        this.twoFactorError.set('');

        this.authService.disableTwoFactor({ code: this.disable2FACode }).subscribe({
            next: () => {
                this.twoFactorEnabled.set(false);
                this.showDisable2FA.set(false);
                this.disable2FACode = '';
                this.twoFactorSuccess.set('İki faktörlü kimlik doğrulama devre dışı bırakıldı.');
                this.twoFactorLoading.set(false);
                this.toastService.warning('2FA Kapalı', 'İki faktörlü kimlik doğrulama devre dışı bırakıldı.');
            },
            error: (err) => {
                this.twoFactorError.set(err.error?.detail || 'Doğrulama başarısız.');
                this.twoFactorLoading.set(false);
            }
        });
    }

    // ─── Bildirim Tercihleri ─────────────────────────────────────
    private loadNotificationPreferences(): void {
        this.notifLoading.set(true);
        this.authService.getNotificationPreferences().subscribe({
            next: (prefs) => { this.notifPrefs.set(prefs); this.notifLoading.set(false); },
            error: () => { this.notifLoading.set(false); }
        });
    }

    saveNotificationPreferences(): void {
        this.notifSaving.set(true);
        this.authService.updateNotificationPreferences(this.notifPrefs()).subscribe({
            next: () => {
                this.notifSaving.set(false);
                this.toastService.success('Kaydedildi', 'Bildirim tercihleri güncellendi.');
            },
            error: (err) => {
                this.notifSaving.set(false);
                this.toastService.error('Hata', err.error?.detail || 'Bildirim tercihleri güncellenemedi.');
            }
        });
    }

    toggleNotif(key: keyof NotificationPreferences): void {
        this.notifPrefs.update(p => ({ ...p, [key]: !p[key] }));
    }

    // ─── Aktif Oturumlar ─────────────────────────────────────────
    loadSessions(): void {
        this.sessionsLoading.set(true);
        this.authService.getActiveSessions().subscribe({
            next: (data) => { this.sessions.set(data); this.sessionsLoading.set(false); },
            error: () => { this.sessionsLoading.set(false); }
        });
    }

    async revokeSession(session: ActiveSession): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Oturumu Sonlandır',
            message: `"${session.deviceName}" cihazındaki oturumu sonlandırmak istediğinize emin misiniz?`,
            confirmText: 'Sonlandır',
            type: 'danger'
        });
        if (!confirmed) return;

        this.authService.revokeSession(session.id).subscribe({
            next: () => {
                this.loadSessions();
                this.toastService.success('Sonlandırıldı', 'Oturum başarıyla kapatıldı.');
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'Oturum sonlandırılamadı.')
        });
    }

    async revokeOtherSessions(): Promise<void> {
        const confirmed = await this.confirmService.confirm({
            title: 'Tüm Oturumları Kapat',
            message: 'Bu cihaz dışındaki tüm aktif oturumlar sonlandırılacak. Devam etmek istiyor musunuz?',
            confirmText: 'Tümünü Kapat',
            type: 'warning'
        });
        if (!confirmed) return;

        this.authService.revokeOtherSessions().subscribe({
            next: () => {
                this.loadSessions();
                this.toastService.success('Tamamlandı', 'Diğer tüm oturumlar kapatıldı.');
            },
            error: (err) => this.toastService.error('Hata', err.error?.detail || 'İşlem başarısız.')
        });
    }

    sessionDeviceIcon(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('mobile') || lower.includes('iphone') || lower.includes('android')) return 'smartphone';
        if (lower.includes('tablet') || lower.includes('ipad')) return 'tablet';
        return 'computer';
    }

    formatDate(utc: string): string {
        if (!utc) return '—';
        try {
            return new Date(utc).toLocaleString('tr-TR', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        } catch { return utc; }
    }
}
