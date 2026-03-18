import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status === 401) {
                const isAuthEndpoint = req.url.includes('/api/Auth/');
                if (!isAuthEndpoint) {
                    localStorage.removeItem('erp_token');
                    localStorage.removeItem('erp_refresh_token');
                    localStorage.removeItem('erp_user');
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
