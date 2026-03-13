import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    LoginRequest,
    RegisterRequest,
    RegisterSaasRequest,
    BootstrapAdminRequest,
    RefreshTokenRequest,
    LogoutRequest,
    AuthResponse,
    UserRegistrationResponse,
    CurrentUserDto,
    SubscriptionPlanOptionDto,
    User
} from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/api/Auth`;

    private currentUserSignal = signal<User | null>(null);
    private tokenSignal = signal<string | null>(null);

    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly token = this.tokenSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.tokenSignal());
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
    registerSaas(request: RegisterSaasRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register-saas`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('SaaS registration failed:', error);
                return throwError(() => error);
            })
        );
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
        const refreshToken = localStorage.getItem('erp_refresh_token');
        if (!refreshToken) {
            return throwError(() => new Error('No refresh token'));
        }
        return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken } as RefreshTokenRequest).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                this.clearStorage();
                return throwError(() => error);
            })
        );
    }

    /** Mevcut kullanıcı bilgisi */
    getMe(): Observable<CurrentUserDto> {
        return this.http.get<CurrentUserDto>(`${this.apiUrl}/me`);
    }

    /** Abonelik planı seçenekleri */
    getSubscriptionPlans(): Observable<SubscriptionPlanOptionDto[]> {
        return this.http.get<SubscriptionPlanOptionDto[]>(`${this.apiUrl}/subscription-plans`);
    }

    logout(): void {
        const refreshToken = localStorage.getItem('erp_refresh_token');
        if (refreshToken) {
            this.http.post(`${this.apiUrl}/logout`, { refreshToken } as LogoutRequest)
                .subscribe({ error: () => {} });
        }
        this.clearStorage();
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
            isPlatformAdmin: role === 'SuperAdmin' || role === 'Admin'
        };
        const mockToken = 'dev-mock-jwt-token';
        this.tokenSignal.set(mockToken);
        this.currentUserSignal.set(mockUser);
        localStorage.setItem('erp_token', mockToken);
        localStorage.setItem('erp_user', JSON.stringify(mockUser));
        if (role === 'SuperAdmin' || role === 'Admin') {
            this.router.navigate(['/admin/dashboard']);
        } else {
            this.router.navigate(['/dashboard']);
        }
    }

    getToken(): string | null {
        return this.tokenSignal();
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
        localStorage.setItem('erp_token', response.accessToken);
        localStorage.setItem('erp_refresh_token', response.refreshToken);
        localStorage.setItem('erp_user', JSON.stringify(user));
    }

    private clearStorage(): void {
        this.tokenSignal.set(null);
        this.currentUserSignal.set(null);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_refresh_token');
        localStorage.removeItem('erp_user');
    }

    private loadFromStorage(): void {
        const token = localStorage.getItem('erp_token');
        const userStr = localStorage.getItem('erp_user');
        if (token && userStr) {
            try {
                this.tokenSignal.set(token);
                this.currentUserSignal.set(JSON.parse(userStr));
            } catch {
                this.clearStorage();
            }
        }
    }
}
