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
    TemplateConfig,
} from '../types';

import { DEFAULT_TEMPLATE_CONFIG } from '../types';

import {
    processDjangoEditorConfig
} from '../utils/editorConfig';
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
    templates = [],
    templateConfig,
    debounceDelay = 300,
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
    templateConfig: TemplateConfig;
    debounceDelay?: number; // New prop for debounce timing
}) {
    console.debug('Creating BlockNote 0.31.0 editor...');
    const editor1 = useCreateBlockNote({
        dictionary: "this will cause an error" // TypeScript will tell you what it expects
    });

    // Use upload hook - cast to ImageUploadConfig since we know it's images for now
    const { uploadFile } = useBlockNoteImageUpload(uploadConfig as ImageUploadConfig);
    const { removeImages } = useBlockNoteImageRemoval(removalConfig as ImageRemovalConfig);

    // State to track readonly status
    const [isReadonly, setIsReadonly] = React.useState(readonly);

    // Track previous document state
    const [previousDocument, setPreviousDocument] = React.useState(initialContent);

    // Separate state for the most recent content (for immediate UI updates)
    const [currentContent, setCurrentContent] = React.useState(initialContent);

    // Process Django config, but conditionally based on readonly state
    const processedEditorConfig = React.useMemo(() => {
        console.debug('🔍 READONLY DEBUG - Processing config:', {
            readonly,
            isReadonly,
            editorId,
            originalConfig: editorConfig
        });

        const config = processDjangoEditorConfig(editorConfig);

        console.debug('🔍 READONLY DEBUG - After processDjangoEditorConfig:', {
            config,
            hasDictionary: !!config.dictionary,
            isEditable: config.isEditable,
            djangoReadonly: config._django_readonly
        });

        // Check multiple readonly sources
        const isReadOnlyMode = readonly || isReadonly || config._django_readonly;

        if (isReadOnlyMode) {
            console.debug('🔍 READONLY DEBUG - Editor is readonly, disabling features');

            // For readonly editors, disable editing features
            delete config.dictionary;
            config.isEditable = false;

            // Clean up Django flag
            delete config._django_readonly;

            console.debug('🔍 READONLY DEBUG - After readonly processing:', {
                config,
                hasDictionary: !!config.dictionary,
                isEditable: config.isEditable
            });
        } else {
            console.debug('🔍 READONLY DEBUG - Editor is editable, keeping dictionary');
            // Clean up Django flag for editable editors too
            delete config._django_readonly;
        }

        return config;
    }, [editorConfig, readonly, isReadonly]);

    console.debug('🔍 READONLY DEBUG - Final config being passed to useCreateBlockNote:', {
        processedEditorConfig,
        readonly,
        isReadonly
    });
    console.debug('🔍 FINAL DEBUG - Config passed to useCreateBlockNote:', {
        ...processedEditorConfig,
        uploadFile: processedEditorConfig.uploadFile || uploadFile,
        isEditableOverride: processedEditorConfig.isEditable === undefined ? { isEditable: !isReadonly } : 'using processedEditorConfig.isEditable'
    });

    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...processedEditorConfig,
        uploadFile: processedEditorConfig.uploadFile || uploadFile,
        isEditable: false,
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
                    console.debug(`Readonly state changed for ${editorId}:`, newReadonlyValue);
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
                    console.debug('🗑️ Detected removed images, sending for cleanup:', removedUrls);
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
    const isEditable = processedEditorConfig.isEditable !== undefined ? processedEditorConfig.isEditable : !readonly;

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
                templates,
                templateConfig: templateConfig || DEFAULT_TEMPLATE_CONFIG,
            })
        );
    }

    // Default return without custom slash menu
    return React.createElement(BlockNoteView, blockNoteViewProps);
}
