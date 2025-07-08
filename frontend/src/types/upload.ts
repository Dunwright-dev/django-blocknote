/**
 * Configuration for file uploads
 */
export interface BaseUploadConfig {
	/** URL endpoint for uploads */
	uploadUrl: string;
	/** Maximum file size in bytes */
	maxFileSize?: number;
	/** Allowed MIME types */
	allowedTypes?: string[];
	/** Show upload progress indicators */
	showProgress?: boolean;
	/** Maximum concurrent uploads */
	maxConcurrent?: number;
	/** Upload timeout in milliseconds */
	timeout?: number;
	/** Upload chunk size for large files */
	chunkSize?: number;
	/** Number of retry attempts on failure */
	retryAttempts?: number;
	/** Delay between retries in milliseconds */
	retryDelay?: number;
}

export interface ImageUploadConfig extends BaseUploadConfig {
	/** Image model identifier */
	img_model?: string;
	/** Auto-resize large images */
	autoResize?: boolean;
	/** Max width for resized images */
	maxWidth?: number;
	/** Max height for resized images */
	maxHeight?: number;
	/** JPEG compression quality (1-100) */
	quality?: number;
	/** Output format */
	format?: 'auto' | 'jpeg' | 'png' | 'webp';
}

// Future document config (ready for future implementation)
export interface DocumentUploadConfig extends BaseUploadConfig {
	/** Document model identifier */
	doc_model?: string;
	/** Enable OCR processing */
	ocrEnabled?: boolean;
	/** Extract text content */
	extractText?: boolean;
}

// Video upload config (ready for future implementation)
export interface VideoUploadConfig extends BaseUploadConfig {
	/** Video model identifier */
	video_model?: string;
	/** Video compression level */
	compression?: 'low' | 'medium' | 'high';
	/** Maximum video duration in seconds */
	maxDuration?: number;
	/** Generate thumbnail */
	generateThumbnail?: boolean;
}

export type UploadConfig = DocumentUploadConfig | ImageUploadConfig | VideoUploadConfig


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
 * Return type of useBlockNoteImageUpload hook
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
