/** Auth — Backend API DTO eşleştirmesi */

export interface LoginRequest {
    userName: string;
    password: string;
}

export interface RegisterRequest {
    userName: string;
    email: string;
    password: string;
    role?: string;
}

export interface BootstrapAdminRequest {
    userName: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAtUtc: string;
    role: string;
    userName: string;
}

export interface UserRegistrationResponse {
    userId: string;
    userName: string;
    role: string;
}

/** UI tarafında kullanılacak kullanıcı bilgisi (localStorage'dan) */
export interface User {
    userName: string;
    role: string;
    accessTokenExpiresAtUtc?: string;
}
