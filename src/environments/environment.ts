export const environment = {
    production: false,
    apiUrl: '',  // proxy.conf.json ile /api istekleri localhost:5058'e yönlendiriliyor
    appName: 'StokNet',

    // ── Social OAuth ─────────────────────────────────────────────────────
    // Google: https://console.cloud.google.com → Credentials → OAuth 2.0 Client IDs
    // Authorized redirect URI: http://localhost:4200/auth/callback
    googleClientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

    // GitHub: https://github.com/settings/developers → OAuth Apps
    // Authorization callback URL: http://localhost:4200/auth/callback
    githubClientId: 'YOUR_GITHUB_CLIENT_ID',
};
