import React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useBlockNoteUpload } from '../hooks';

// Main BlockNote Editor Component
export function BlockNoteEditor({ 
    editorId,
    initialContent, 
    config = {}, 
    onChange = null, 
    readonly = false,
    uploadConfig = {} // Configuration for upload hook
}: {
    editorId: string;
    initialContent?: any;
    config?: Record<string, unknown>;
    onChange?: ((content: any) => void) | null;
    readonly?: boolean;
    uploadConfig?: Record<string, unknown>; // Add this type
}) {
    console.log('Creating BlockNote 0.31.0 editor...');
    
    // Use our custom upload hook
    const { uploadFile } = useBlockNoteUpload(uploadConfig);
    
    // State to track readonly status
    const [isReadonly, setIsReadonly] = React.useState(readonly);
    
    // Create editor with upload configuration
    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...config,
        // Use the upload function from our hook, allow override
        uploadFile: config.uploadFile || uploadFile,
        ...(config.isEditable === undefined && { isEditable: !isReadonly })
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
    
    // Handle content changes
    const handleChange = React.useCallback(() => {
        const isEditable = config.isEditable !== undefined ? config.isEditable : !readonly;
        if (onChange && isEditable && editor) {
            try {
                const content = editor.document;
                onChange(content);
                document.dispatchEvent(new CustomEvent('blocknote-change', {
                    detail: { content, editor }
                }));
            } catch (error) {
                console.warn('Error getting editor content:', error);
            }
        }
    }, [onChange, readonly, editor, config.isEditable]);
    
    // Use config.editable if available, otherwise fall back to !readonly
    const isEditable = config.isEditable !== undefined ? config.isEditable : !readonly;
    
    return React.createElement(BlockNoteView, { 
        editor,
        editable: isEditable,
        onChange: handleChange,
        theme: config.theme || 'light'
    });
}
