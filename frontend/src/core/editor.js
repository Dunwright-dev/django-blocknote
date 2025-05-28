import React from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';

// Main BlockNote Editor Component
export function BlockNoteEditor({ 
    editorId,
    initialContent, 
    config = {}, 
    onChange = null, 
    readonly = false
}) {
    console.log('Creating BlockNote 0.31.0 editor...');
    // State to track readonly status
    const [isReadonly, setIsReadonly] = React.useState(readonly);
    
    // Create editor with v0.31.0 API
    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...config,
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
                    const newReadonlyValue = container.dataset.readonly === "true";
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

    // Handle content changes - Fixed syntax
    const handleChange = React.useCallback(() => {
        const isEditable = config.editable !== undefined ? config.editable : !readonly;
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
    }, [onChange, readonly, editor, config.editable]);

    // Use config.editable if available, otherwise fall back to !readonly
    const isEditable = config.isEditable !== undefined ? config.isEditable : !readonly;

    return React.createElement(BlockNoteView, { 
        editor,
        editable: isEditable,
        onChange: handleChange,
        theme: config.theme || 'light'
    });
}
