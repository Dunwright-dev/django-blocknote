import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockNoteEditor } from './editor';

// Enhanced widget initialization with cleanup tracking
export const blockNoteRoots = new Map(); // Track React roots for cleanup

export function initWidgetWithData(editorId: string, config: Record<string, unknown> = {}, initialContent: unknown = null, readonly: boolean = false) {
    console.log('Initializing BlockNote widget:', editorId);
    
    const container = document.getElementById(editorId + '_editor');
    const textarea = document.getElementById(editorId);
    
    if (!container || !textarea) {
        console.error('Elements not found for editor:', editorId);
        return;
    }

    // Read upload config from DOM
    const uploadConfigElement = document.getElementById(`${editorId}_upload_config`);
    let uploadConfig: Record<string, unknown> = {};
    
    if (uploadConfigElement) {
        try {
            const uploadConfigText = uploadConfigElement.textContent || '{}';
            uploadConfig = JSON.parse(uploadConfigText);
            console.log('📤 Upload config loaded for', editorId, ':', uploadConfig);
        } catch (error) {
            console.warn('⚠️ Failed to parse upload config for', editorId, ':', error);
            uploadConfig = {}; // Fallback to empty config
        }
    } else {
        console.log('📤 No upload config found for', editorId, ', using defaults');
    }

    // Cleanup existing React root if it exists
    if (blockNoteRoots.has(editorId)) {
        console.log('Cleaning up existing React root for:', editorId);
        try {
            blockNoteRoots.get(editorId).unmount();
        } catch (e) {
            console.warn('Error unmounting existing root:', e);
        }
        blockNoteRoots.delete(editorId);
    }

    // Clear loading placeholder
    const loadingDiv = container.querySelector('.blocknote-loading');
    if (loadingDiv) {
        (loadingDiv as HTMLElement).style.display = 'none';
    }

    // Process initial content
    let processedContent: unknown = null;
    if (initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
        processedContent = initialContent;
    }
    
    // Extract fallback text
    let fallbackText = '';
    if (processedContent && Array.isArray(processedContent)) {
        try {
            fallbackText = processedContent
                .map((block: any) => {
                    if (block.content && Array.isArray(block.content)) {
                        return block.content
                            .filter((item: any) => item.type === 'text')
                            .map((item: any) => item.text || '')
                            .join('');
                    }
                    return '';
                })
                .join('\n');
        } catch (e) {
            console.log('Could not extract fallback text');
        }
    }

    // Change handler
    const handleChange = (content: unknown) => {
        try {
            const textareaElement = textarea as HTMLTextAreaElement;
            textareaElement.value = JSON.stringify(content || []);
            textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (error) {
            console.error('Error updating textarea:', error);
        }
    };

    try {
        const element = React.createElement(BlockNoteEditor, {
            editorId: editorId,
            initialContent: processedContent,
            config: {
                ...config,
            },
            uploadConfig: uploadConfig, // Add the upload config here
            onChange: handleChange,
            readonly: readonly,
        });

        const root = createRoot(container);
        root.render(element);
        
        // Store root for cleanup
        blockNoteRoots.set(editorId, root);
        
        console.log('✅ BlockNote widget rendered successfully:', editorId);
        
    } catch (error) {
        console.error('Critical widget initialization error:', error);
        
        // Ultimate fallback
        container.innerHTML = `
            <div style="border: 2px solid #ef4444; padding: 16px; border-radius: 8px; background: #fef2f2;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">
                    ⚠️ Editor Initialization Failed
                </div>
                <textarea 
                    placeholder="${(config.placeholder as string) || 'Enter your content here...'}"
                    style="width: 100%; min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; font-family: system-ui;"
                    oninput="
                        const content = this.value ? [{
                            id: 'fallback-' + Date.now(),
                            type: 'paragraph',
                            props: {},
                            content: [{ type: 'text', text: this.value }],
                            children: []
                        }] : [];
                        document.getElementById('${editorId}').value = JSON.stringify(content);
                        document.getElementById('${editorId}').dispatchEvent(new Event('change', { bubbles: true }));
                    "
                >${fallbackText}</textarea>
            </div>
        `;
    }
}
