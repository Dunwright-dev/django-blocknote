import { useCallback, useMemo, useState } from 'react';
import type { 
    UploadConfig, 
    UploadState, 
    UploadError, 
    UseBlockNoteUploadReturn 
} from '../types/upload';
import type { DjangoUploadResponse, DjangoUploadError } from '../types/django';
import { getCsrfToken } from '../internal/csrf-helpers';

/**
 * Custom hook for handling BlockNote file uploads with Django backend
 * 
 * @param config Upload configuration options
 * @returns Upload utilities and state
 * 
 * @example
 * ```typescript
 * const { uploadFile, uploading, error } = useBlockNoteUpload({
 *   uploadUrl: '/blog/upload-image/',
 *   maxFileSize: 5 * 1024 * 1024 // 5MB
 * });
 * ```
 */
export function useBlockNoteUpload(config: UploadConfig = {}): UseBlockNoteUploadReturn {
    console.log('🔧 useBlockNoteUpload called with config:', config);
    
    // ES2022 + TypeScript: Create config with defaults
    const uploadConfig = useMemo((): Required<UploadConfig> => {
        const result = {
            uploadUrl: config.uploadUrl ?? '/django-blocknote/upload-image/',
            maxFileSize: config.maxFileSize ?? (10 * 1024 * 1024),
            allowedTypes: config.allowedTypes ?? ['image/*'],
            showProgress: config.showProgress ?? false,
            maxConcurrent: config.maxConcurrent ?? 1,
        };
        console.log('🔧 Final upload config:', result);
        return result;
    }, [config]);
    
    // Upload state with TypeScript
    const [state, setState] = useState<UploadState>({
        uploading: false,
        progress: 0,
        error: null,
        queue: [],
    });
    
    /**
     * Validate file before upload
     */
    const validateFile = useCallback((file: File): void => {
        // Check file size
        if (file.size > uploadConfig.maxFileSize) {
            const error: UploadError = {
                message: `File size ${file.size} bytes exceeds limit of ${uploadConfig.maxFileSize} bytes`,
                code: 'FILE_TOO_LARGE'
            };
            throw error;
        }
        
        // Check file type
        const isAllowed = uploadConfig.allowedTypes.some((allowedType: string) => {
            if (allowedType.endsWith('/*')) {
                const baseType = allowedType.slice(0, -2);
                return file.type.startsWith(baseType);
            }
            return file.type === allowedType;
        });
        
        if (!isAllowed) {
            const error: UploadError = {
                message: `File type "${file.type}" is not allowed. Allowed types: ${uploadConfig.allowedTypes.join(', ')}`,
                code: 'INVALID_TYPE'
            };
            throw error;
        }
    }, [uploadConfig.maxFileSize, uploadConfig.allowedTypes]);
    
    /**
     * Upload a file to the Django backend
     */
    const uploadFile = useCallback(async (file: File): Promise<string> => {
        // Input validation
        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file provided');
        }
        
        try {
            // Validate file
            validateFile(file);
            
            // Update state
            setState(prev => ({ 
                ...prev, 
                uploading: true, 
                error: null,
                progress: 0 
            }));
            
            // Prepare request
            const formData = new FormData();
            formData.append('file', file);
            
            const csrfToken = getCsrfToken();
            
            // Make request
            const response = await fetch(uploadConfig.uploadUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,
                },
            });
            
            // Handle response
            if (!response.ok) {
                let errorData: DjangoUploadError;
                try {
                    errorData = await response.json() as DjangoUploadError;
                } catch {
                    errorData = { 
                        error: `HTTP ${response.status}: ${response.statusText}` 
                    };
                }
                
                throw new Error(errorData.error);
            }
            
            // Parse successful response
            const data: DjangoUploadResponse = await response.json();
            
            if (!data.url || typeof data.url !== 'string') {
                throw new Error('Invalid server response: missing or invalid URL');
            }
            
            // Update state - success
            setState(prev => ({ 
                ...prev, 
                uploading: false,
                progress: 100 
            }));
            
            return data.url;
            
        } catch (originalError) {
            // Create typed error
            const error: UploadError = {
                message: originalError instanceof Error 
                    ? originalError.message 
                    : 'Unknown upload error',
                code: originalError instanceof Error && originalError.message.includes('File size') 
                    ? 'FILE_TOO_LARGE'
                    : originalError instanceof Error && originalError.message.includes('not allowed')
                    ? 'INVALID_TYPE'
                    : 'SERVER_ERROR',
                originalError: originalError instanceof Error ? originalError : undefined,
            };
            
            // Update state - error
            setState(prev => ({ 
                ...prev, 
                uploading: false, 
                error 
            }));
            
            throw error;
        }
    }, [uploadConfig.uploadUrl, validateFile]);
    
    /**
     * Clear current error
     */
    const clearError = useCallback((): void => {
        setState(prev => ({ ...prev, error: null }));
    }, []);
    
    // Return hook API
    return {
        uploadFile,
        uploading: state.uploading,
        progress: state.progress,
        error: state.error,
        queue: state.queue,
        clearError,
    };
}
