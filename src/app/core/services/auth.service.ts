import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    LoginRequest,
    RegisterRequest,
    RegisterSaasRequest,
    ConfirmEmailRequest,
    ConfirmEmailResponse,
    ResendVerificationEmailRequest,
    ResendVerificationEmailResponse,
    BootstrapAdminRequest,
    RefreshTokenRequest,
    LogoutRequest,
    AuthResponse,
    UserRegistrationResponse,
    CurrentUserDto,
    SubscriptionPlanOptionDto,
    ChangePasswordRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    TwoFactorStatusResponse,
    NotificationPreferences,
    UpdateNotificationPreferencesRequest,
    ActiveSession,
    User
} from '../models/user.model';
import { SocialProvider } from './social-auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/api/Auth`;
    private readonly sessionCheckIntervalMs = 15000;
    private readonly tokenExpirySkewMs = 30000;

    private currentUserSignal = signal<User | null>(null);
    private tokenSignal = signal<string | null>(null);
    private sessionTickSignal = signal(Date.now());

    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly token = this.tokenSignal.asReadonly();
    readonly isAuthenticated = computed(() => {
        this.sessionTickSignal();
        return this.isSessionValid(this.tokenSignal(), this.currentUserSignal());
    });
    readonly isPlatformAdmin = computed(() => {
        const user = this.currentUserSignal();
        return user?.role === 'SuperAdmin' || user?.role === 'Admin';
    });
    readonly userFullName = computed(() => {
        const user = this.currentUserSignal();
        return user ? user.userName : '';
    });

    constructor(private http: HttpClient, private router: Router) {
        this.loadFromStorage();
        setInterval(() => this.ensureSessionValidity(), this.sessionCheckIntervalMs);
    }

    login(request: LoginRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('Login failed:', error);
                return throwError(() => error);
            })
        );
    }

    register(request: RegisterRequest): Observable<UserRegistrationResponse> {
        return this.http.post<UserRegistrationResponse>(`${this.apiUrl}/register`, request).pipe(
            catchError(error => {
                console.error('Registration failed:', error);
                return throwError(() => error);
            })
        );
    }

    /** SaaS kayıt — tenant oluşturur ve giriş yapar */
    registerSaas(request: RegisterSaasRequest): Observable<UserRegistrationResponse> {
        return this.http.post<UserRegistrationResponse>(`${this.apiUrl}/register-saas`, request).pipe(
            catchError(error => {
                console.error('SaaS registration failed:', error);
                return throwError(() => error);
            })
        );
    }

    confirmEmail(request: ConfirmEmailRequest): Observable<ConfirmEmailResponse> {
        return this.http.post<ConfirmEmailResponse>(`${this.apiUrl}/confirm-email`, request);
    }

    resendVerificationEmail(request: ResendVerificationEmailRequest): Observable<ResendVerificationEmailResponse> {
        return this.http.post<ResendVerificationEmailResponse>(`${this.apiUrl}/resend-verification-email`, request);
    }

    bootstrapAdmin(request: BootstrapAdminRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/bootstrap-admin`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('Bootstrap admin failed:', error);
                return throwError(() => error);
            })
        );
    }

    /** Access token yenile */
    refreshToken(): Observable<AuthResponse> {
        const refreshToken = localStorage.getItem('stoknet_refresh_token');
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token'));
        }
        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken } as RefreshTokenRequest).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                this.clearAuth();
                return throwError(() => error);
            })
        );
    }

    /** Mevcut kullanıcı bilgisi */
    getMe(): Observable<CurrentUserDto> {
        return this.http.get<CurrentUserDto>(`${this.apiUrl}/me`);
    }

    /** Şifre değiştir */
    changePassword(request: ChangePasswordRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/me/password`, request);
    }

    /** Sosyal OAuth girişi — callback'ten gelen code'u backend'e iletir */
    loginSocial(payload: {
        provider: SocialProvider;
        code: string;
        redirectUri: string;
        codeVerifier?: string;
    }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/SocialLogin`, payload).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('Social login failed:', error);
                return throwError(() => error);
            })
        );
    }

    /** handleAuthResponse'u dışarıdan çağırabilmek için public wrapper */
    applyAuthResponse(response: AuthResponse): void {
        this.handleAuthResponse(response);
    }

    /** Abonelik planı seçenekleri */
    getSubscriptionPlans(): Observable<SubscriptionPlanOptionDto[]> {
        return this.http.get<SubscriptionPlanOptionDto[]>(`${this.apiUrl}/subscription-plans`);
    }

    /* ─── 2FA (İki Faktörlü Kimlik Doğrulama) ─────────────── */

    /** 2FA durumunu kontrol et */
    getTwoFactorStatus(): Observable<TwoFactorStatusResponse> {
        return this.http.get<TwoFactorStatusResponse>(`${this.apiUrl}/2fa/status`);
    }

    /** 2FA kurulumu başlat — QR kodu ve anahtar döner */
    setupTwoFactor(): Observable<TwoFactorSetupResponse> {
        return this.http.post<TwoFactorSetupResponse>(`${this.apiUrl}/2fa/setup`, {});
    }

    /** 2FA doğrula ve etkinleştir */
    enableTwoFactor(request: TwoFactorVerifyRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/2fa/enable`, request);
    }

    /** 2FA devre dışı bırak */
    disableTwoFactor(request: TwoFactorVerifyRequest): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/2fa/disable`, request);
    }

    /* ─── Bildirim Tercihleri ──────────────────────────────── */

    /** Bildirim tercihlerini getir */
    getNotificationPreferences(): Observable<NotificationPreferences> {
        return this.http.get<NotificationPreferences>(`${this.apiUrl}/notification-preferences`);
    }

    /** Bildirim tercihlerini güncelle */
    updateNotificationPreferences(request: UpdateNotificationPreferencesRequest): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/notification-preferences`, request);
    }

    /* ─── Aktif Oturumlar ──────────────────────────────────── */

    /** Aktif oturumları listele */
    getActiveSessions(): Observable<ActiveSession[]> {
        return this.http.get<ActiveSession[]>(`${this.apiUrl}/sessions`);
    }

    /** Belirli bir oturumu sonlandır */
    revokeSession(sessionId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/sessions/${sessionId}`);
    }

    /** Diğer tüm oturumları sonlandır */
    revokeOtherSessions(): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/sessions/revoke-others`, {});
    }

    logout(): void {
        const refreshToken = localStorage.getItem('stoknet_refresh_token');
        if (refreshToken) {
            this.http.post(`${this.apiUrl}/logout`, { refreshToken } as LogoutRequest)
                .subscribe({ error: () => {} });
        }
        this.clearAuth();
        this.router.navigate(['/auth/login']);
    }

    devLogin(): void {
        this.devLoginAs('Admin');
    }

    devLoginAs(role: string): void {
        if (environment.production) return;
        const roleLabels: Record<string, string> = {
            'SuperAdmin': 'Süper Admin',
            'Admin': 'Admin Geliştirici',
            'Manager': 'Şube Müdürü',
            'Cashier': 'Kasiyer',
            'Viewer': 'İzleyici'
        };
        const mockUser: User = {
            userName: roleLabels[role] || role,
            role: role,
            isPlatformAdmin: role === 'SuperAdmin' || role === 'Admin',
            accessTokenExpiresAtUtc: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };
        const mockToken = 'dev-mock-jwt-token';
        this.tokenSignal.set(mockToken);
        this.currentUserSignal.set(mockUser);
        localStorage.setItem('stoknet_token', mockToken);
        localStorage.setItem('stoknet_user', JSON.stringify(mockUser));
        if (role === 'SuperAdmin' || role === 'Admin') {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    getToken(): string | null {
        const token = this.tokenSignal();
        const user = this.currentUserSignal();
        if (this.isSessionValid(token, user)) {
            return token;
        }

        if (token || user) {
            this.clearAuth();
        }

        return null;
    }

    getDefaultPanelRoute(): string {
        const role = this.currentUserSignal()?.role;
        return role === 'SuperAdmin' || role === 'Admin' ? '/admin/dashboard' : '/dashboard';
    }

    private handleAuthResponse(response: AuthResponse): void {
        this.tokenSignal.set(response.accessToken);
        const user: User = {
            userName: response.userName,
            role: response.role,
            tenantId: response.tenantId,
            tenantName: response.tenantName,
            subscriptionPlan: response.subscriptionPlan,
            subscriptionStatus: response.subscriptionStatus,
            features: response.features,
            isPlatformAdmin: response.role === 'SuperAdmin' || response.role === 'Admin',
            accessTokenExpiresAtUtc: response.accessTokenExpiresAtUtc
        };
        this.currentUserSignal.set(user);
        localStorage.setItem('stoknet_token', response.accessToken);
        localStorage.setItem('stoknet_refresh_token', response.refreshToken);
        localStorage.setItem('stoknet_user', JSON.stringify(user));
    }

    clearAuth(): void {
        this.tokenSignal.set(null);
        this.currentUserSignal.set(null);
        localStorage.removeItem('stoknet_token');
        localStorage.removeItem('stoknet_refresh_token');
        localStorage.removeItem('stoknet_user');
    }

    private loadFromStorage(): void {
        const token = localStorage.getItem('stoknet_token');
        const userStr = localStorage.getItem('stoknet_user');
        if (token && userStr) {
            try {
                const parsedUser = JSON.parse(userStr) as User;
                if (!this.isSessionValid(token, parsedUser)) {
                    this.clearAuth();
                    return;
                }

                this.tokenSignal.set(token);
                this.currentUserSignal.set(parsedUser);
            } catch {
                this.clearAuth();
            }
        }
    }

    private ensureSessionValidity(): void {
        const token = this.tokenSignal();
        const user = this.currentUserSignal();
        if ((token || user) && !this.isSessionValid(token, user)) {
            this.clearAuth();
        }

        this.sessionTickSignal.set(Date.now());
    }

    private isSessionValid(token: string | null, user: User | null): boolean {
        if (!token || !user) {
            return false;
        }

        const expiresAt = this.resolveExpiryDate(token, user);
        if (!expiresAt) {
            return false;
        }

        return expiresAt.getTime() > Date.now() + this.tokenExpirySkewMs;
    }

    private resolveExpiryDate(token: string, user: User): Date | null {
        const fromUser = this.parseDate(user.accessTokenExpiresAtUtc);
        if (fromUser) {
            return fromUser;
        }

        const exp = this.readJwtExpClaim(token);
        if (!exp) {
            return null;
        }

        return new Date(exp * 1000);
    }

    private parseDate(value?: string): Date | null {
        if (!value) {
            return null;
        }

        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    private readJwtExpClaim(token: string): number | null {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }

        try {
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
            const payloadJson = atob(padded);
            const payload = JSON.parse(payloadJson) as { exp?: number };
            return typeof payload.exp === 'number' ? payload.exp : null;
        } catch {
            return null;
        }
    }
}
