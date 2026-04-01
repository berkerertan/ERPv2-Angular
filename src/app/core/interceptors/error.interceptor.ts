import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router     = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const isAuthEndpoint = req.url.includes('/api/Auth/');
                if (!isAuthEndpoint) {
                    // Hem localStorage hem in-memory sinyalleri temizle
                    // clearAuth() çağrılmazsa guestGuard kullanıcıyı hâlâ
                    // "giriş yapmış" sanır ve /dashboard'a yönlendirir
                    authService.clearAuth();
                    router.navigate(['/auth/login']);
                }
            }

            if (error.status === 403) {
                console.error('Access denied');
            }

            if (error.status === 0) {
                console.error('Server is unreachable');
            }

            return throwError(() => error);
        })
    );
};
