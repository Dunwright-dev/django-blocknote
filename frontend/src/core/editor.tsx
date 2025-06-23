import React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { findRemovedImages } from '../utils/documents';
import { CustomSlashMenu } from './slash-menu';
import {
    useBlockNoteImageUpload,
    useBlockNoteImageRemoval,
} from '../hooks';
import type {
    EditorConfig,
    UploadConfig,
    ImageUploadConfig,
    RemovalConfig,
    ImageRemovalConfig,
    SlashMenuConfig,
} from '../types';

// Define DocumentTemplate interface
interface DocumentTemplate {
    id: string;
    title: string;
    subtext: string;
    aliases: string[];
    group: string;
    icon: string;
    content: any[];
}

// Debounce hook
function useDebounce<T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T {
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    return React.useCallback(function(...args: Parameters<T>) {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(function() {
            callback(...args);
        }, delay);
    } as T, [callback, delay]);
}

// Main BlockNote Editor Component
export function BlockNoteEditor({
    editorId,
    initialContent,
    editorConfig = {},
    onChange = null,
    readonly = false,
    uploadConfig = {},
    removalConfig = {},
    slashMenuConfig,
    templates = [], // Add templates prop
    debounceDelay = 300, // Add configurable debounce delay
}: {
    editorId: string;
    initialContent?: any;
    editorConfig?: EditorConfig;
    onChange?: ((content: any) => void) | null;
    readonly?: boolean;
    uploadConfig?: UploadConfig;
    removalConfig?: RemovalConfig;
    slashMenuConfig?: SlashMenuConfig;
    templates?: DocumentTemplate[]; // Add templates to props interface
    debounceDelay?: number; // New prop for debounce timing
}) {
    console.log('Creating BlockNote 0.31.0 editor...');

    // Use upload hook - cast to ImageUploadConfig since we know it's images for now
    const { uploadFile } = useBlockNoteImageUpload(uploadConfig as ImageUploadConfig);
    const { removeImages } = useBlockNoteImageRemoval(removalConfig as ImageRemovalConfig);

    // State to track readonly status
    const [isReadonly, setIsReadonly] = React.useState(readonly);

    // Track previous document state
    const [previousDocument, setPreviousDocument] = React.useState(initialContent);

    // Separate state for the most recent content (for immediate UI updates)
    const [currentContent, setCurrentContent] = React.useState(initialContent);

    // Create editor with upload configuration
    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...editorConfig,
        uploadFile: editorConfig.uploadFile || uploadFile,
        ...(editorConfig.isEditable === undefined && { isEditable: !isReadonly }),
    });

    // Effect to watch for data-readonly changes
    React.useEffect(function() {
        if (!editorId) return;

        const container = document.querySelector(`[data-editor-id="${editorId}"]`);
        if (!container) return;

        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-readonly') {
                    const newReadonlyValue = container.getAttribute('data-readonly') === "true";
                    console.log(`Readonly state changed for ${editorId}:`, newReadonlyValue);
                    setIsReadonly(newReadonlyValue);
                    if (editor) {
                        editor.isEditable = !newReadonlyValue;
                    }
                }
            });
        });

        observer.observe(container, {
            attributes: true,
            attributeFilter: ['data-readonly']
        });

        return function() {
            observer.disconnect();
        };
    }, [editor, editorId]);

    // Debounced function for expensive operations (image cleanup + external onChange)
    const debouncedProcessChange = useDebounce(function(content: any) {
        try {
            // Check for removed images (expensive operation)
            if (previousDocument) {
                const removedUrls = findRemovedImages(previousDocument, content);
                if (removedUrls.length > 0) {
                    console.log('🗑️ Detected removed images, sending for cleanup:', removedUrls);
                    removeImages(removedUrls).catch(function(error) {
                        console.error('❌ Failed to remove images:', error);
                    });
                }
            }

            // Update previous document for next comparison
            setPreviousDocument(content);

            // Call external onChange (potentially expensive, like API calls)
            if (onChange) {
                onChange(content);
                document.dispatchEvent(new CustomEvent('blocknote-change', {
                    detail: { content: content, editor }
                }));
            }
        } catch (error) {
            console.warn('Error during debounced change processing:', error);
        }
    }, debounceDelay);

    // Immediate change handler (for UI responsiveness)
    const handleImmediateChange = React.useCallback(function() {
        const isEditable = editorConfig.isEditable !== undefined ? editorConfig.isEditable : !readonly;
        if (editor && isEditable) {
            try {
                const content = editor.document;
                // Update current content immediately (for UI state)
                setCurrentContent(content);
                // Process expensive operations with debounce
                debouncedProcessChange(content);
            } catch (error) {
                console.warn('Error during immediate change handling:', error);
            }
        }
    }, [editor, editorConfig.isEditable, readonly, debouncedProcessChange]);

    // Cleanup debounced function on unmount
    React.useEffect(function() {
        return function() {
            // Force final execution of debounced function on unmount
            if (currentContent && onChange) {
                try {
                    onChange(currentContent);
                } catch (error) {
                    console.warn('Error during final change execution:', error);
                }
            }
        };
    }, [currentContent, onChange]);

    // Use editorConfig.isEditable if available, otherwise fall back to !readonly
    const isEditable = editorConfig.isEditable !== undefined ? editorConfig.isEditable : !readonly;

    // Create the base BlockNoteView props
    const blockNoteViewProps = {
        editor,
        editable: isEditable,
        onChange: handleImmediateChange, // Use the immediate handler
        theme: editorConfig.theme || 'light',
        slashMenu: slashMenuConfig?.enabled ? false : true
    };

    // If custom slash menu is enabled, add it as a child
    if (slashMenuConfig?.enabled) {
        return React.createElement(BlockNoteView, blockNoteViewProps,
            React.createElement(CustomSlashMenu, {
                editor,
                config: slashMenuConfig,
                templates // Pass templates to CustomSlashMenu
            })
        );
    }

    // Default return without custom slash menu
    return React.createElement(BlockNoteView, blockNoteViewProps);
}
