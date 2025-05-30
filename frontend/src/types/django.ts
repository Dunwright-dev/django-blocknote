/**
 * Response from Django upload endpoint
 */
export interface DjangoUploadResponse {
    /** URL of uploaded file */
    url: string;
    /** Original filename */
    filename?: string;
    /** File size in bytes */
    size?: number;
    /** MIME type */
    content_type?: string;
}

/**
 * Error response from Django
 */
export interface DjangoUploadError {
    /** Error message */
    error: string;
    /** Error code for programmatic handling */
    code?: string;
    /** Additional error details */
    details?: Record<string, unknown>;
}

/**
 * CSRF token sources
 */
export type CsrfTokenSource = 'form' | 'meta' | 'cookie';
