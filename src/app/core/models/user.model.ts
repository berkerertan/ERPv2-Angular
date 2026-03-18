/** Auth — Backend API DTO eşleştirmesi */

/** SubscriptionPlan enum: 1=Starter, 2=Pro, 3=Enterprise */
export enum SubscriptionPlan {
    Starter = 1,
    Pro = 2,
    Enterprise = 3
}

/** SubscriptionStatus enum: 1=Trial, 2=Active, 3=Cancelled */
export enum SubscriptionStatus {
    Trial = 1,
    Active = 2,
    Cancelled = 3
}

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

/** SaaS kayıt — yeni tenant oluşturur */
export interface RegisterSaasRequest {
    userName: string;
    email: string;
    password: string;
    companyName: string;
    plan: SubscriptionPlan;
}

export interface BootstrapAdminRequest {
    userName: string;
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface LogoutRequest {
    refreshToken: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAtUtc: string;
    role: string;
    userName: string;
    tenantId?: string;
    tenantName?: string;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    features?: string[];
}

export interface UserRegistrationResponse {
    userId: string;
    userName: string;
    role: string;
}

/** /api/Auth/me yanıtı */
export interface CurrentUserDto {
    userId: string;
    userName: string;
    email: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    tenantCode?: string;
    isPlatformAdmin: boolean;
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    features?: string[];
}

/** Abonelik planı seçenekleri (register / plan listesi) */
export interface SubscriptionPlanOptionDto {
    plan: SubscriptionPlan;
    name: string;
    assignedRole?: string;
    monthlyPrice: number;
    maxUsers: number;
    isActive: boolean;
    features?: string[];
}

/** UI tarafında kullanılacak kullanıcı bilgisi (localStorage'dan) */
export interface User {
    userName: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: SubscriptionStatus;
    features?: string[];
    isPlatformAdmin?: boolean;
    accessTokenExpiresAtUtc?: string;
}
