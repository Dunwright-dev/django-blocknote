/**
 * Configuration for file uploads
 */
export interface UploadConfig {
    /** URL endpoint for uploads */
    uploadUrl?: string;
    /** Maximum file size in bytes (default: 10MB) */
    maxFileSize?: number;
    /** Allowed MIME types (default: ['image/*']) */
    allowedTypes?: string[];
    /** Show upload progress indicators */
    showProgress?: boolean;
    /** Maximum concurrent uploads */
    maxConcurrent?: number;
}

/**
 * Upload state information
 */
export interface UploadState {
    /** Whether an upload is currently in progress */
    uploading: boolean;
    /** Upload progress percentage (0-100) */
    progress: number;
    /** Current error, if any */
    error: UploadError | null;
    /** Queue of pending uploads */
    queue: UploadQueueItem[];
}

/**
 * Upload error information
 */
export interface UploadError {
    /** Human-readable error message */
    message: string;
    /** Error category for programmatic handling */
    code: 'NETWORK_ERROR' | 'FILE_TOO_LARGE' | 'INVALID_TYPE' | 'SERVER_ERROR';
    /** Original error object, if available */
    originalError?: Error;
}

/**
 * Individual upload queue item
 */
export interface UploadQueueItem {
    /** Unique identifier for this upload */
    id: string;
    /** File being uploaded */
    file: File;
    /** Upload progress (0-100) */
    progress: number;
    /** Current status */
    status: 'pending' | 'uploading' | 'completed' | 'failed';
}

/**
 * Return type of useBlockNoteUpload hook
 */
export interface UseBlockNoteUploadReturn {
    /** Function to upload a file */
    uploadFile: (file: File) => Promise<string>;
    /** Current upload state */
    uploading: boolean;
    progress: number;
    error: UploadError | null;
    queue: UploadQueueItem[];
    /** Clear the current error */
    clearError: () => void;
}
