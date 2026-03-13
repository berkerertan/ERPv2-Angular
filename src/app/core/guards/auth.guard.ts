import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url }
    });
    return false;
};

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return true;
    }

    const role = authService.currentUser()?.role;
    if (role === 'SuperAdmin' || role === 'Admin') {
        router.navigate(['/admin/dashboard']);
    } else {
        router.navigate(['/dashboard']);
    }
    return false;
};
