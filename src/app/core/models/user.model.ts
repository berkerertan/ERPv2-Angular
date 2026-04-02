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

export interface ConfirmEmailRequest {
    email: string;
    token: string;
}

export interface ConfirmEmailResponse {
    isVerified: boolean;
    message: string;
}

export interface ResendVerificationEmailRequest {
    email: string;
}

export interface ResendVerificationEmailResponse {
    isSent: boolean;
    message: string;
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

/* ─── 2FA (İki Faktörlü Kimlik Doğrulama) ─────────────────── */

/** 2FA kurulum başlangıç yanıtı */
export interface TwoFactorSetupResponse {
    sharedKey: string;
    qrCodeUri: string;
}

/** 2FA doğrulama/etkinleştirme isteği */
export interface TwoFactorVerifyRequest {
    code: string;
}

/** 2FA durumu */
export interface TwoFactorStatusResponse {
    isEnabled: boolean;
    hasAuthenticator: boolean;
}

/* ─── Bildirim Tercihleri ──────────────────────────────────── */

export interface NotificationPreferences {
    emailInvoice: boolean;       // Fatura bildirimleri
    emailPayment: boolean;       // Ödeme bildirimleri
    emailReminder: boolean;      // Hatırlatmalar
    emailMarketing: boolean;     // Pazarlama & güncellemeler
    pushEnabled: boolean;        // Anlık bildirimler
    pushOrderStatus: boolean;    // Sipariş durumu
    pushStockAlert: boolean;     // Stok uyarıları
}

export interface UpdateNotificationPreferencesRequest {
    emailInvoice?: boolean;
    emailPayment?: boolean;
    emailReminder?: boolean;
    emailMarketing?: boolean;
    pushEnabled?: boolean;
    pushOrderStatus?: boolean;
    pushStockAlert?: boolean;
}

/* ─── Aktif Oturumlar ──────────────────────────────────────── */

export interface ActiveSession {
    id: string;
    deviceName: string;
    ipAddress: string;
    location?: string;
    lastActiveUtc: string;
    isCurrent: boolean;
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
