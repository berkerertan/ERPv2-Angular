import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import {
    CurrentUserDto, UpdateProfileRequest,
    TwoFactorStatusDto, TwoFactorSetupDto,
    NotificationPreferencesDto, ActiveSessionDto
} from '../../core/models/user.model';

type ProfileTab = 'account' | '2fa' | 'notifications' | 'sessions';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);

    activeTab = signal<ProfileTab>('account');
    profile = signal<CurrentUserDto | null>(null);
    loading = signal(true);

    // ─── Şifre Değiştir ────────────────────────────────────
    pwForm = { current: '', next: '', confirm: '' };
    pwLoading = signal(false);
    pwSuccess = signal('');
    pwError = signal('');

    // ─── Profil Düzenle ────────────────────────────────────
    editMode = signal(false);
    editForm: UpdateProfileRequest = { userName: '', email: '' };
    editLoading = signal(false);
    editSuccess = signal('');
    editError = signal('');

    // ─── 2FA ───────────────────────────────────────────────
    twoFaStatus = signal<TwoFactorStatusDto | null>(null);
    twoFaSetup = signal<TwoFactorSetupDto | null>(null);
    twoFaCode = '';
    twoFaLoading = signal(false);
    twoFaError = signal('');
    twoFaSuccess = signal('');
    showSetupModal = signal(false);
    showDisableModal = signal(false);
    disableCode = '';

    // ─── Bildirimler ───────────────────────────────────────
    notifPrefs = signal<NotificationPreferencesDto | null>(null);
    notifLoading = signal(false);
    notifSaved = signal(false);

    // ─── Oturumlar ─────────────────────────────────────────
    sessions = signal<ActiveSessionDto[]>([]);
    sessionsLoading = signal(false);
    revokeLoading = signal<string | null>(null);

    // ─── Toast ─────────────────────────────────────────────
    toast = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
    private toastTimer: any = null;

    readonly planLabels: Record<string, string> = {
        '1': 'Başlangıç', '2': 'Profesyonel', '3': 'Kurumsal',
        'Starter': 'Başlangıç', 'Pro': 'Profesyonel', 'Enterprise': 'Kurumsal'
    };
    readonly statusLabels: Record<string, string> = {
        '1': 'Deneme', '2': 'Aktif', '3': 'İptal',
        'Trial': 'Deneme', 'Active': 'Aktif', 'Cancelled': 'İptal'
    };

    ngOnInit(): void {
        this.authService.getMe().subscribe({
            next: (me) => { this.profile.set(me); this.loading.set(false); },
            error: () => this.loading.set(false)
        });
    }

    setTab(tab: ProfileTab): void {
        this.activeTab.set(tab);
        if (tab === '2fa' && !this.twoFaStatus()) this.load2FA();
        if (tab === 'notifications' && !this.notifPrefs()) this.loadNotifications();
        if (tab === 'sessions' && this.sessions().length === 0) this.loadSessions();
    }

    // ─── Computed ──────────────────────────────────────────
    get displayName(): string {
        return this.profile()?.userName || this.authService.currentUser()?.userName || '—';
    }
    get displayRole(): string {
        return this.profile()?.role || this.authService.currentUser()?.role || '—';
    }
    get avatarInitials(): string {
        const name = this.profile()?.userName || '';
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    }
    get planLabel(): string {
        const p = this.profile()?.subscriptionPlan;
        return p ? (this.planLabels[p] || p) : '—';
    }
    get statusLabel(): string {
        const s = this.profile()?.subscriptionStatus;
        return s ? (this.statusLabels[s] || s) : '—';
    }
    get statusClass(): string {
        const s = this.profile()?.subscriptionStatus || '';
        if (s === '2' || s === 'Active') return 'active';
        if (s === '1' || s === 'Trial') return 'trial';
        return 'cancelled';
    }

    // ─── Profil Düzenleme ──────────────────────────────────
    startEdit(): void {
        const p = this.profile();
        this.editForm = { userName: p?.userName || '', email: p?.email || '' };
        this.editError.set('');
        this.editSuccess.set('');
        this.editMode.set(true);
    }

    cancelEdit(): void {
        this.editMode.set(false);
    }

    saveEdit(): void {
        this.editError.set('');
        if (!this.editForm.userName || !this.editForm.email) {
            this.editError.set('Kullanıcı adı ve e-posta zorunludur.');
            return;
        }
        this.editLoading.set(true);
        this.authService.updateProfile(this.editForm).subscribe({
            next: () => {
                this.editLoading.set(false);
                this.editMode.set(false);
                this.authService.getMe().subscribe(me => this.profile.set(me));
                this.showToast('Profil güncellendi', 'success');
            },
            error: (err) => {
                this.editLoading.set(false);
                this.editError.set(err.error?.detail || 'Güncellenemedi.');
            }
        });
    }

    // ─── Şifre Değiştir ────────────────────────────────────
    changePassword(): void {
        this.pwError.set('');
        this.pwSuccess.set('');
        if (!this.pwForm.current || !this.pwForm.next || !this.pwForm.confirm) {
            this.pwError.set('Tüm alanlar zorunludur.'); return;
        }
        if (this.pwForm.next !== this.pwForm.confirm) {
            this.pwError.set('Yeni şifreler eşleşmiyor.'); return;
        }
        if (this.pwForm.next.length < 6) {
            this.pwError.set('En az 6 karakter olmalıdır.'); return;
        }
        this.pwLoading.set(true);
        this.authService.changePassword({ currentPassword: this.pwForm.current, newPassword: this.pwForm.next }).subscribe({
            next: () => {
                this.pwSuccess.set('Şifre başarıyla güncellendi.');
                this.pwForm = { current: '', next: '', confirm: '' };
                this.pwLoading.set(false);
            },
            error: (err) => {
                this.pwError.set(err.error?.detail || 'Mevcut şifrenizi kontrol edin.');
                this.pwLoading.set(false);
            }
        });
    }

    // ─── 2FA ───────────────────────────────────────────────
    load2FA(): void {
        this.authService.getTwoFactorStatus().subscribe({
            next: s => this.twoFaStatus.set(s),
            error: () => {}
        });
    }

    openSetup(): void {
        this.twoFaCode = '';
        this.twoFaError.set('');
        this.twoFaSuccess.set('');
        this.twoFaLoading.set(true);
        this.authService.setupTwoFactor().subscribe({
            next: (data) => {
                this.twoFaSetup.set(data);
                this.twoFaLoading.set(false);
                this.showSetupModal.set(true);
            },
            error: () => {
                this.twoFaLoading.set(false);
                this.twoFaError.set('Kurulum başlatılamadı.');
            }
        });
    }

    enable2FA(): void {
        if (!this.twoFaCode || this.twoFaCode.length < 6) {
            this.twoFaError.set('6 haneli kod gerekli.'); return;
        }
        this.twoFaLoading.set(true);
        this.twoFaError.set('');
        this.authService.enableTwoFactor({ code: this.twoFaCode }).subscribe({
            next: () => {
                this.twoFaLoading.set(false);
                this.showSetupModal.set(false);
                this.twoFaStatus.set({ isEnabled: true, hasSecret: true });
                this.showToast('İki faktörlü doğrulama aktif edildi', 'success');
            },
            error: (err) => {
                this.twoFaLoading.set(false);
                this.twoFaError.set(err.error?.detail || 'Kod doğrulanamadı.');
            }
        });
    }

    openDisable(): void {
        this.disableCode = '';
        this.twoFaError.set('');
        this.showDisableModal.set(true);
    }

    disable2FA(): void {
        if (!this.disableCode || this.disableCode.length < 6) {
            this.twoFaError.set('6 haneli kod gerekli.'); return;
        }
        this.twoFaLoading.set(true);
        this.twoFaError.set('');
        this.authService.disableTwoFactor({ code: this.disableCode }).subscribe({
            next: () => {
                this.twoFaLoading.set(false);
                this.showDisableModal.set(false);
                this.twoFaStatus.set({ isEnabled: false, hasSecret: false });
                this.showToast('İki faktörlü doğrulama devre dışı bırakıldı', 'success');
            },
            error: (err) => {
                this.twoFaLoading.set(false);
                this.twoFaError.set(err.error?.detail || 'Kod doğrulanamadı.');
            }
        });
    }

    // ─── Bildirimler ───────────────────────────────────────
    loadNotifications(): void {
        this.notifLoading.set(true);
        this.authService.getNotificationPreferences().subscribe({
            next: (p) => { this.notifPrefs.set(p); this.notifLoading.set(false); },
            error: () => this.notifLoading.set(false)
        });
    }

    saveNotifications(): void {
        const prefs = this.notifPrefs();
        if (!prefs) return;
        this.notifLoading.set(true);
        this.authService.updateNotificationPreferences(prefs).subscribe({
            next: () => {
                this.notifLoading.set(false);
                this.notifSaved.set(true);
                setTimeout(() => this.notifSaved.set(false), 2500);
            },
            error: () => this.notifLoading.set(false)
        });
    }

    // ─── Oturumlar ─────────────────────────────────────────
    loadSessions(): void {
        this.sessionsLoading.set(true);
        this.authService.getActiveSessions().subscribe({
            next: (s) => { this.sessions.set(s); this.sessionsLoading.set(false); },
            error: () => this.sessionsLoading.set(false)
        });
    }

    revokeSession(id: string): void {
        this.revokeLoading.set(id);
        this.authService.revokeSession(id).subscribe({
            next: () => {
                this.revokeLoading.set(null);
                this.sessions.update(s => s.filter(x => x.id !== id));
                this.showToast('Oturum sonlandırıldı', 'success');
            },
            error: () => { this.revokeLoading.set(null); this.showToast('Sonlandırılamadı', 'error'); }
        });
    }

    revokeOthers(): void {
        this.sessionsLoading.set(true);
        this.authService.revokeOtherSessions().subscribe({
            next: () => {
                this.sessionsLoading.set(false);
                this.loadSessions();
                this.showToast('Diğer oturumlar sonlandırıldı', 'success');
            },
            error: () => this.sessionsLoading.set(false)
        });
    }

    formatLastActive(dt: string): string {
        const d = new Date(dt);
        return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    // ─── Toast ─────────────────────────────────────────────
    showToast(msg: string, type: 'success' | 'error'): void {
        this.toast.set({ msg, type });
        if (this.toastTimer) clearTimeout(this.toastTimer);
        this.toastTimer = setTimeout(() => this.toast.set(null), 3000);
    }
}
