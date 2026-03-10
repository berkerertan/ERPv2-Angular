import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, RegisterRequest, AuthResponse, User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly apiUrl = `${environment.apiUrl}/api/auth`;

    // Signals for reactive state
    private currentUserSignal = signal<User | null>(null);
    private tokenSignal = signal<string | null>(null);

    readonly currentUser = this.currentUserSignal.asReadonly();
    readonly token = this.tokenSignal.asReadonly();
    readonly isAuthenticated = computed(() => !!this.tokenSignal());
    readonly userFullName = computed(() => {
        const user = this.currentUserSignal();
        return user ? `${user.firstName} ${user.lastName}` : '';
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

    register(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('Registration failed:', error);
                return throwError(() => error);
            })
        );
    }

    bootstrapAdmin(request: RegisterRequest): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/bootstrap-admin`, request).pipe(
            tap(response => this.handleAuthResponse(response)),
            catchError(error => {
                console.error('Bootstrap admin failed:', error);
                return throwError(() => error);
            })
        );
    }

    /** Development-only login — simulates auth without backend */
    devLogin(): void {
        if (environment.production) return;
        const mockUser: User = {
            id: 'dev-001',
            email: 'admin@erp.dev',
            firstName: 'Admin',
            lastName: 'Geliştirici',
            role: 'Admin'
        };
        const mockToken = 'dev-mock-jwt-token';
        this.handleAuthResponse({ token: mockToken, user: mockUser });
        this.router.navigate(['/dashboard']);
    }

    logout(): void {
        this.tokenSignal.set(null);
        this.currentUserSignal.set(null);
        localStorage.removeItem('erp_token');
        localStorage.removeItem('erp_user');
        this.router.navigate(['/auth/login']);
    }

    getToken(): string | null {
        return this.tokenSignal();
    }

    private handleAuthResponse(response: AuthResponse): void {
        this.tokenSignal.set(response.token);
        this.currentUserSignal.set(response.user);
        localStorage.setItem('erp_token', response.token);
        localStorage.setItem('erp_user', JSON.stringify(response.user));
    }

    private loadFromStorage(): void {
        const token = localStorage.getItem('erp_token');
        const userStr = localStorage.getItem('erp_user');
        if (token && userStr) {
            try {
                this.tokenSignal.set(token);
                this.currentUserSignal.set(JSON.parse(userStr));
            } catch {
                this.logout();
            }
        }
    }
}
