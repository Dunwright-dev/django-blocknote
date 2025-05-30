/**
 * Internal utilities for CSRF token handling
 * Not part of the public API
 */

/**
 * Get CSRF token from various sources
 * @returns CSRF token string or empty string if not found
 */
export function getCsrfToken(): string {
    // Try form input first
    const formToken = getCsrfFromForm();
    if (formToken) return formToken;
    
    // Try meta tag
    const metaToken = getCsrfFromMeta();
    if (metaToken) return metaToken;
    
    // Try cookie last
    return getCsrfFromCookie();
}

/**
 * Get CSRF token from form input
 */
function getCsrfFromForm(): string {
    const input = document.querySelector<HTMLInputElement>('[name=csrfmiddlewaretoken]');
    return input?.value ?? '';
}

/**
 * Get CSRF token from meta tag
 */
function getCsrfFromMeta(): string {
    const meta = document.querySelector<HTMLMetaElement>('meta[name=csrf-token]');
    return meta?.getAttribute('content') ?? '';
}

/**
 * Get CSRF token from cookie
 */
function getCsrfFromCookie(): string {
    return getCookieValue('csrftoken');
}

/**
 * Extract cookie value by name
 * @param name Cookie name
 * @returns Cookie value or empty string
 */
function getCookieValue(name: string): string {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() ?? '';
    }
    return '';
}

/**
 * Get information about where CSRF token was found (for debugging)
 */
export function getCsrfTokenSource(): 'form' | 'meta' | 'cookie' | null {
    if (getCsrfFromForm()) return 'form';
    if (getCsrfFromMeta()) return 'meta';
    if (getCsrfFromCookie()) return 'cookie';
    return null;
}
