// binding และ env ของ Worker (ดู wrangler.jsonc และ .dev.vars.example)
declare global {
  interface CloudflareEnv {
    DB: D1Database;
    ASSETS: Fetcher;
    TZ_NAME: string;
    APP_URL?: string;
    AUTH_SECRET?: string;
    ALLOWED_LINE_USER_IDS?: string;
    LINE_LOGIN_CHANNEL_ID?: string;
    LIFF_ID?: string;
    LINE_MESSAGING_CHANNEL_ACCESS_TOKEN?: string;
    DEV_LOGIN_LINE_USER_ID?: string;
  }
}

export {};
