import React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { findRemovedImages } from '../utils/documents';
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
} from '../types';

// Main BlockNote Editor Component
export function BlockNoteEditor({
    editorId,
    initialContent,
    editorConfig = {},
    onChange = null,
    readonly = false,
    uploadConfig = {},
    removalConfig = {},
}: {
    editorId: string;
    initialContent?: any;
    editorConfig?: EditorConfig;
    onChange?: ((content: any) => void) | null;
    readonly?: boolean;
    uploadConfig?: UploadConfig;  // Union type - future ready
    removalConfig?: RemovalConfig;
}) {
    console.log('Creating BlockNote 0.31.0 editor...');

    // Use upload hook - cast to ImageUploadConfig since we know it's images for now
    const { uploadFile } = useBlockNoteImageUpload(uploadConfig as ImageUploadConfig);

    const { removeImages } = useBlockNoteImageRemoval(removalConfig as ImageRemovalConfig);

    // State to track readonly status
    const [isReadonly, setIsReadonly] = React.useState(readonly);
    //
    // Track previous document state
    const [previousDocument, setPreviousDocument] = React.useState(initialContent);

    // Create editor with upload configuration
    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...editorConfig,
        // Use the upload function from our hook, allow override
        uploadFile: editorConfig.uploadFile || uploadFile,
        ...(editorConfig.isEditable === undefined && { isEditable: !isReadonly })
    });

    // Effect to watch for data-readonly changes
    React.useEffect(() => {
        if (!editorId) return;
        const container = document.querySelector(`[data-editor-id="${editorId}"]`);
        if (!container) return;

        // Set up MutationObserver to watch for attribute changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-readonly') {
                    const newReadonlyValue = container.getAttribute('data-readonly') === "true";
                    console.log(`Readonly state changed for ${editorId}:`, newReadonlyValue);
                    setIsReadonly(newReadonlyValue);
                    // Update editor editable state
                    if (editor) {
                        editor.isEditable = !newReadonlyValue;
                    }
                }
            });
        });

        // Start observing
        observer.observe(container, {
            attributes: true,
            attributeFilter: ['data-readonly']
        });

        // Cleanup observer on unmount
        return () => {
            observer.disconnect();
        };
    }, [editor, editorId]);

    // handleChange with image removal detection
    const handleChange = React.useCallback(() => {
        const isEditable = editorConfig.isEditable !== undefined ? editorConfig.isEditable : !readonly;
        if (editor && isEditable) {
            try {
                const currentContent = editor.document;

                // Check for removed images
                if (previousDocument) {
                    const removedUrls = findRemovedImages(previousDocument, currentContent);
                    if (removedUrls.length > 0) {
                        console.log('🗑️ Detected removed images, sending for cleanup:', removedUrls);
                        removeImages(removedUrls).catch(error => {
                            console.error('❌ Failed to remove images:', error);
                            // Don't block the editor change for removal failures
                        });
                    }
                }

                // Update previous document for next comparison
                setPreviousDocument(currentContent);

                // Existing onChange logic
                if (onChange) {
                    onChange(currentContent);
                    document.dispatchEvent(new CustomEvent('blocknote-change', {
                        detail: { content: currentContent, editor }
                    }));
                }
            } catch (error) {
                console.warn('Error during editor change handling:', error);
            }
        }
    }, [onChange, readonly, editor, editorConfig.isEditable, previousDocument, removeImages]);

    // Use editorConfig.isEditable if available, otherwise fall back to !readonly
    const isEditable = editorConfig.isEditable !== undefined ? editorConfig.isEditable : !readonly;

    return React.createElement(BlockNoteView, {
        editor,
        editable: isEditable,
        onChange: handleChange,
        theme: editorConfig.theme || 'light'
    });
}
