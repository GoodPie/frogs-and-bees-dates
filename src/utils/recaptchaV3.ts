/*
 * reCAPTCHA v3 helper
 * - Lazy-loads the Google reCAPTCHA v3 script with the provided site key
 * - Provides an execute function that returns a token string or null on failure
 * - In Vitest/JSDOM or NODE_ENV==='test', returns a fake token and skips network/script loading
 */

// Minimal grecaptcha type for v3
interface GrecaptchaV3 {
  ready(cb: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaV3;
    __recaptchaV3Loading?: Promise<void>;
    __recaptchaV3Loaded?: boolean;
  }
}

const DEFAULT_SITE_KEY = '6LdNHwgsAAAAADXpFHdHGaql_EZB8OEMSTZWuQNF';

function getSiteKey(): string {
  // Prefer Vite env var if provided, else fall back to the default from the user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viteEnv = (typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined) || {};
  const fromEnv = viteEnv.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_SITE_KEY;
}

function isTestEnv(): boolean {
  // Vitest exposes import.meta.vitest; our setup-test.ts runs in jsdom
  // Also consider classic NODE_ENV==='test' fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta: any = typeof import.meta !== 'undefined' ? (import.meta as any) : {};
  const vitest = !!meta.vitest;
  const nodeEnvTest = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test';
  return vitest || nodeEnvTest;
}

function loadScriptOnce(siteKey: string): Promise<void> {
  if (isTestEnv()) return Promise.resolve();
  if (window.__recaptchaV3Loaded) return Promise.resolve();
  if (window.__recaptchaV3Loading) return window.__recaptchaV3Loading;

  window.__recaptchaV3Loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    script.onload = () => {
      window.__recaptchaV3Loaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });

  return window.__recaptchaV3Loading;
}

export async function executeRecaptchaV3(action: string): Promise<string | null> {
  const siteKey = getSiteKey();

  if (isTestEnv()) {
    // In tests we return a dummy token so flows proceed without external calls
    return `test-token-${action}`;
  }

  try {
    await loadScriptOnce(siteKey);
  } catch (e) {
    console.error('[reCAPTCHA] Script load error', e);
    return null;
  }

  const grecaptcha = window.grecaptcha;
  if (!grecaptcha || typeof grecaptcha.execute !== 'function') {
    console.error('[reCAPTCHA] grecaptcha is not available after script load');
    return null;
  }

  try {
    // Ensure grecaptcha is ready before executing
    await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
    const token = await grecaptcha.execute(siteKey, { action });
    return token || null;
  } catch (e) {
    console.error('[reCAPTCHA] execute error', e);
    return null;
  }
}
