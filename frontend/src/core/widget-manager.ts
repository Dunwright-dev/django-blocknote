import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockNoteEditor } from './editor';

import type {
    EditorConfig,
    UploadConfig,
    RemovalConfig,
} from '../types';
// Enhanced widget initialization with cleanup tracking
export const blockNoteRoots = new Map(); // Track React roots for cleanup

export function initWidgetWithData(
    editorId: string,
    editorConfig: EditorConfig,
    uploadConfig: UploadConfig,
    removalConfig: RemovalConfig,
    initialContent: unknown = null,
    readonly: boolean = false
): void {
    console.log('Initializing BlockNote widget:', editorId);
    const container = document.getElementById(editorId + '_editor');
    const textarea = document.getElementById(editorId);

    if (!container || !textarea) {
        console.error('Elements not found for editor:', editorId);
        return;
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

    // Process initial content and ensure it's valid JSON
    let processedContent: unknown = null;
    let textareaInitialValue = '[]';

    if (initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
        processedContent = initialContent;
        textareaInitialValue = JSON.stringify(initialContent);
    } else {
        processedContent = undefined;
        textareaInitialValue = '[]';
    }

    // This prevents "Enter a valid JSON" errors on form submission
    const textareaElement = textarea as HTMLTextAreaElement;
    try {
        textareaElement.value = textareaInitialValue;
        console.log(`🔧 Initialized textarea for ${editorId} with valid JSON:`, textareaInitialValue);
    } catch (error) {
        console.error(`❌ Failed to initialize textarea JSON for ${editorId}:`, error);
        textareaElement.value = '[]';
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

    // Change handler with error handling
    const handleChange = (content: unknown) => {
        try {
            const jsonContent = JSON.stringify(content || []);
            textareaElement.value = jsonContent;
            textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
            textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
            console.log(`📝 Updated textarea for ${editorId}`);
        } catch (error) {
            console.error(`❌ Error updating textarea for ${editorId}:`, error);
            textareaElement.value = '[]';
            textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    try {
        const element = React.createElement(BlockNoteEditor, {
            editorId: editorId,
            initialContent: processedContent,
            editorConfig: editorConfig,  // ← Fixed: was config
            uploadConfig: uploadConfig,  // ← Use parameter, not local variable
            removalConfig: removalConfig,
            onChange: handleChange,
            readonly: readonly,
        });

        const root = createRoot(container);
        root.render(element);
        blockNoteRoots.set(editorId, root);
        console.log('✅ BlockNote widget rendered successfully:', editorId);

    } catch (error) {
        console.error('Critical widget initialization error:', error);
        textareaElement.value = '[]';
        container.innerHTML = `
            <div style="border: 2px solid #ef4444; padding: 16px; border-radius: 8px; background: #fef2f2;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">
                    ⚠️ Editor Initialization Failed
                </div>
                <textarea 
                    placeholder="${(editorConfig.placeholder as string) || 'Enter your content here...'}"
                    style="width: 100%; min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; font-family: system-ui;"
                    oninput="
                        const content = this.value ? [{
                            id: 'fallback-' + Date.now(),
                            type: 'paragraph',
                            props: {},
                            content: [{ type: 'text', text: this.value }],
                            children: []
                        }] : [];
                        const jsonContent = JSON.stringify(content);
                        document.getElementById('${editorId}').value = jsonContent;
                        document.getElementById('${editorId}').dispatchEvent(new Event('change', { bubbles: true }));
                    "
                >${fallbackText}</textarea>
            </div>
        `;
    }
}
