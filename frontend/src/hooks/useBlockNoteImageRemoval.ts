import { useCallback, useMemo, useState } from 'react';
import type {
    ImageRemovalConfig,
    RemovalState,
    RemovalError,
    UseBlockNoteRemovalReturn
} from '../types/removal';
import type { DjangoRemovalResponse, DjangoRemovalError } from '../types/django';
import { getCsrfToken } from '../internal/csrf-helpers';

/**
 * Custom hook for handling BlockNote image removal with Django backend
 * 
 * @param config Removal configuration options
 * @returns Removal utilities and state
 * 
 * @example
 * ```typescript
 * const { removeImages, removing, error } = useBlockNoteImageRemoval({
 *   removalUrl: '/blog/remove-images/',
 *   retryAttempts: 3
 * });
 * ```
 */
export function useBlockNoteImageRemoval(config: ImageRemovalConfig): UseBlockNoteRemovalReturn {
    console.log('🗑️ useBlockNoteImageRemoval called with config:', config);

    // Validate early
    if (!config.removalUrl) {
        throw new Error('Removal URL is required - check Django widget configuration');
    }

    // Create config with defaults
    const removalConfig = useMemo((): Required<ImageRemovalConfig> => {
        const result = {
            removalUrl: config.removalUrl,
            retryAttempts: config.retryAttempts ?? 3,
            retryDelay: config.retryDelay ?? 1000,
            timeout: config.timeout ?? 30000,
            maxConcurrent: config.maxConcurrent ?? 1,
            batchRemoval: config.batchRemoval ?? true, // Always batch for now
        };
        console.log('🗑️ Final removal config:', result);
        return result;
    }, [config]);

    // Removal state
    const [state, setState] = useState<RemovalState>({
        removing: false,
        error: null,
        queue: [],
    });

    /**
     * Remove multiple images by URLs
     */
    const removeImages = useCallback(async (urls: string[]): Promise<void> => {
        // Input validation
        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            console.log('🗑️ No URLs provided for removal, skipping');
            return;
        }

        // Filter out invalid URLs
        const validUrls = urls.filter(url => url && typeof url === 'string');
        if (validUrls.length === 0) {
            console.warn('🗑️ No valid URLs provided for removal');
            return;
        }

        if (validUrls.length !== urls.length) {
            console.warn('🗑️ Some invalid URLs filtered out:', {
                original: urls.length,
                valid: validUrls.length
            });
        }

        console.log('🗑️ Starting removal for URLs:', validUrls);

        // Check if already removing (simple concurrency control)
        if (state.removing) {
            console.log('🗑️ Already removing images, queuing for later...');
            // For now, just log and return. Could implement proper queuing later
            return;
        }

        let attempt = 0;
        const maxAttempts = removalConfig.retryAttempts + 1; // +1 for initial attempt

        while (attempt < maxAttempts) {
            try {
                // Update state - start removal
                setState(prev => ({
                    ...prev,
                    removing: true,
                    error: null,
                }));

                console.log(`🗑️ Removal attempt ${attempt + 1}/${maxAttempts} for ${validUrls.length} URLs`);

                // Prepare request payload (matching your Django backend format)
                const payload = {
                    imageUrls: validUrls
                };

                const csrfToken = getCsrfToken();

                // Make request with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), removalConfig.timeout);

                const response = await fetch(removalConfig.removalUrl, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrfToken,
                    },
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                // Handle response
                if (!response.ok) {
                    let errorData: DjangoRemovalError;
                    try {
                        errorData = await response.json() as DjangoRemovalError;
                    } catch {
                        errorData = {
                            error: {
                                message: `HTTP ${response.status}: ${response.statusText}`
                            }
                        };
                    }
                    throw new Error(errorData.error.message);
                }

                // Parse successful response
                const data: DjangoRemovalResponse = await response.json();
                console.log('✅ Images removal successful:', data.success.message);

                // Update state - success
                setState(prev => ({
                    ...prev,
                    removing: false,
                }));

                return; // Success, exit retry loop

            } catch (originalError) {
                attempt++;
                console.error(`❌ Removal attempt ${attempt} failed:`, originalError);

                // If this was the last attempt, handle final error
                if (attempt >= maxAttempts) {
                    // Create typed error
                    const error: RemovalError = {
                        message: originalError instanceof Error
                            ? originalError.message
                            : 'Unknown removal error',
                        code: originalError instanceof Error && originalError.name === 'AbortError'
                            ? 'NETWORK_ERROR'
                            : originalError instanceof Error && originalError.message.includes('HTTP')
                                ? 'SERVER_ERROR'
                                : 'SERVER_ERROR',
                        originalError: originalError instanceof Error ? originalError : undefined,
                    };

                    // Update state - final error
                    setState(prev => ({
                        ...prev,
                        removing: false,
                        error
                    }));

                    console.error('🚨 All removal attempts failed:', error);
                    throw error;
                }

                // Wait before retry (unless it's the last attempt)
                if (attempt < maxAttempts) {
                    console.log(`⏳ Waiting ${removalConfig.retryDelay}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, removalConfig.retryDelay));
                }
            }
        }
    }, [removalConfig, state.removing]);

    /**
     * Clear current error
     */
    const clearError = useCallback((): void => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    // Return hook API
    return {
        removeImages,
        removing: state.removing,
        error: state.error,
        queue: state.queue, // Empty for now, could implement proper queuing later
        clearError,
    };
}
