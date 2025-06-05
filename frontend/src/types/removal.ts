/**
 * Configuration for file removal
 */

export interface BaseRemovalConfig {
    /** URL endpoint for removals */
    removalUrl: string;
    /** Number of retry attempts on failure */
    retryAttempts?: number;
    /** Delay between retries in milliseconds */
    retryDelay?: number;
    /** Removal timeout in milliseconds */
    timeout?: number;
    /** Maximum concurrent removals */
    maxConcurrent?: number;
}

export interface ImageRemovalConfig extends BaseRemovalConfig {
    /** Batch removals for efficiency (future) */
    batchRemoval?: boolean;
}
// Future removal configs (matching your upload pattern)
export interface DocumentRemovalConfig extends BaseRemovalConfig {
    /** Additional document cleanup options */
    cleanupMetadata?: boolean;
}

export interface VideoRemovalConfig extends BaseRemovalConfig {
    /** Remove associated thumbnails */
    removeThumbnails?: boolean;
}

export type RemovalConfig = DocumentRemovalConfig | ImageRemovalConfig | VideoRemovalConfig;

/**
 * Removal state information
 */
export interface RemovalState {
    /** Whether a removal is currently in progress */
    removing: boolean;
    /** Current error, if any */
    error: RemovalError | null;
    /** Queue of pending removals */
    queue: RemovalQueueItem[];
}

/**
 * Removal error information
 */
export interface RemovalError {
    /** Human-readable error message */
    message: string;
    /** Error category for programmatic handling */
    code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'NOT_FOUND' | 'PERMISSION_DENIED';
    /** Original error object, if available */
    originalError?: Error;
}

/**
 * Individual removal queue item
 */
export interface RemovalQueueItem {
    /** Unique identifier for this removal */
    id: string;
    /** URL being removed */
    url: string;
    /** Current status */
    status: 'pending' | 'removing' | 'completed' | 'failed';
    /** Retry count */
    retryCount: number;
}

/**
 * Return type of useBlockNoteImageRemoval hook
 */
export interface UseBlockNoteRemovalReturn {
    /** Function to remove an image by URL */
    removeImages: (url: string[]) => Promise<void>;
    /** Current removal state */
    removing: boolean;
    error: RemovalError | null;
    queue: RemovalQueueItem[];
    /** Clear the current error */
    clearError: () => void;
}
