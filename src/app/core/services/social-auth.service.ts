import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export type SocialProvider = 'google' | 'github';

const REDIRECT_URI = `${window.location.origin}/auth/callback`;
const SESSION_STATE    = 'oauth_state';
const SESSION_PROVIDER = 'oauth_provider';
const SESSION_VERIFIER = 'oauth_code_verifier';

@Injectable({ providedIn: 'root' })
export class SocialAuthService {

    // ── Google OAuth 2.0 + PKCE ──────────────────────────────────────────
    async initiateGoogle(): Promise<void> {
        const state        = this.randomHex(16);
        const codeVerifier = this.randomHex(32);
        const challenge    = await this.sha256Base64Url(codeVerifier);

        sessionStorage.setItem(SESSION_STATE,    state);
        sessionStorage.setItem(SESSION_PROVIDER, 'google');
        sessionStorage.setItem(SESSION_VERIFIER, codeVerifier);

        const params = new URLSearchParams({
            client_id:             environment.googleClientId,
            redirect_uri:          REDIRECT_URI,
            response_type:         'code',
            scope:                 'openid email profile',
            state,
            code_challenge:        challenge,
            code_challenge_method: 'S256',
            access_type:           'offline',
            prompt:                'select_account',
        });

        window.location.href =
            `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    }

    // ── GitHub OAuth (PKCE desteklemiyor, state yeterli) ─────────────────
    initiateGithub(): void {
        const state = this.randomHex(16);

        sessionStorage.setItem(SESSION_STATE,    state);
        sessionStorage.setItem(SESSION_PROVIDER, 'github');

        const params = new URLSearchParams({
            client_id:    environment.githubClientId,
            redirect_uri: REDIRECT_URI,
            scope:        'user:email read:user',
            state,
        });

        window.location.href =
            `https://github.com/login/oauth/authorize?${params}`;
    }

    // ── Callback bilgilerini oku ve temizle ───────────────────────────────
    consumeCallback(code: string, state: string): {
        provider: SocialProvider;
        code: string;
        codeVerifier?: string;
        redirectUri: string;
    } | null {
        const savedState    = sessionStorage.getItem(SESSION_STATE);
        const provider      = sessionStorage.getItem(SESSION_PROVIDER) as SocialProvider;
        const codeVerifier  = sessionStorage.getItem(SESSION_VERIFIER) ?? undefined;

        sessionStorage.removeItem(SESSION_STATE);
        sessionStorage.removeItem(SESSION_PROVIDER);
        sessionStorage.removeItem(SESSION_VERIFIER);

        if (!code || state !== savedState || !provider) return null;

        return { provider, code, codeVerifier, redirectUri: REDIRECT_URI };
    }

    // ── Yardımcı ─────────────────────────────────────────────────────────
    private randomHex(bytes: number): string {
        const arr = new Uint8Array(bytes);
        crypto.getRandomValues(arr);
        return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    }

    private async sha256Base64Url(input: string): Promise<string> {
        const data   = new TextEncoder().encode(input);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
}
