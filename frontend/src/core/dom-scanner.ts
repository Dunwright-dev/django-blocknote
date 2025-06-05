// core/dom-scanner.ts
import type { EditorConfig, UploadConfig, RemovalConfig } from '../types';

export function scanForWidgets(
    rootElement: Document | Element = document,
    initWidgetCallback: (
        editorId: string,
        editorConfig: EditorConfig,
        uploadConfig: UploadConfig,
        removalConfig: RemovalConfig,
        initialContent: unknown,
        readonly: boolean
    ) => void
): void {
    console.log('🔍 Scanning for BlockNote widgets...');

    // Find all BlockNote containers
    const containers = rootElement.querySelectorAll('[data-editor-id]');
    console.log(`Found ${containers.length} potential widget containers`);

    containers.forEach((container) => {
        const editorId = container.getAttribute('data-editor-id');
        const isReadonly = container.getAttribute('data-readonly') === 'true';

        if (!editorId) {
            console.warn('Container missing data-editor-id:', container);
            return;
        }

        console.log(`📝 Processing ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);

        // Get EDITOR configuration from script tag with ID "_editor_config"
        let editorConfig = {};
        const editorConfigScript = document.getElementById(`${editorId}_editor_config`);
        if (editorConfigScript) {
            try {
                editorConfig = JSON.parse(editorConfigScript.textContent || '{}');
                console.log(`📋 Editor config loaded for ${editorId}:`, editorConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid editor config for ${editorId}:`, e);
            }
        }

        // Get UPLOAD configuration from script tag with ID "_image_upload_config"
        let uploadConfig = {};
        const imageUploadConfigScript = document.getElementById(`${editorId}_image_upload_config`);
        console.log(`🔍 Looking for upload config script: ${editorId}_image_upload_config`);
        console.log(`📜 Upload config script element:`, imageUploadConfigScript);

        if (imageUploadConfigScript) {
            try {
                uploadConfig = JSON.parse(imageUploadConfigScript.textContent || '{}');
                console.log(`📤 Upload config loaded for ${editorId}:`, uploadConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid upload config for ${editorId}:`, e);
            }
        } else {
            console.error(`❌ No image upload config script found for ${editorId}_image_upload_config`);
        }

        if (!uploadConfig.uploadUrl) {
            console.error(`❌ Missing uploadUrl for ${editorId} - check Django widget configuration`);
            console.log(`Upload Config for ${editorId} is`, uploadConfig);
            return; // Don't initialize broken widget
        }

        // Get REMOVAL configuration from script tag with ID "_image_removal_config"
        let removalConfig = {};
        const imageRemovalConfigScript = document.getElementById(`${editorId}_image_removal_config`);
        console.log(`🔍 Looking for removal config script: ${editorId}_image_removal_config`);
        console.log(`📜 Removal config script element:`, imageRemovalConfigScript);

        if (imageRemovalConfigScript) {
            try {
                removalConfig = JSON.parse(imageRemovalConfigScript.textContent || '{}');
                console.log(`🗑️ Removal config loaded for ${editorId}:`, removalConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid removal config for ${editorId}:`, e);
            }
        } else {
            console.error(`❌ No image removal config script found for ${editorId}_image_removal_config`);
        }

        if (!removalConfig.removalUrl) {
            console.error(`❌ Missing removalUrl for ${editorId} - check Django widget configuration`);
            console.log(`Removal Config for ${editorId} is`, removalConfig);
            return; // Don't initialize broken widget
        }

        // Get content from script tag with ID "_content"
        let content = [];
        const contentScript = document.getElementById(`${editorId}_content`);
        if (contentScript) {
            try {
                content = JSON.parse(contentScript.textContent || '[]');
                console.log(`📄 Content loaded from script tag for ${editorId}:`, content);
            } catch (e) {
                console.error(`❌ Failed to parse script tag content for ${editorId}:`, e);
            }
        }

        // Fallback methods for content
        if (!content.length) {
            const contentAttr = container.getAttribute('data-blocknote-content');
            if (contentAttr) {
                try {
                    content = JSON.parse(contentAttr);
                    console.log(`📄 Content loaded from data attribute for ${editorId}:`, content);
                } catch (e) {
                    console.error(`❌ Failed to parse data attribute content for ${editorId}:`, e);
                }
            }
        }

        // Initialize with all configs
        console.log(`✅ Initializing BlockNote ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);
        initWidgetCallback(editorId, editorConfig, uploadConfig, removalConfig, content, isReadonly);
    });

    console.log('✅ Widget scanning complete');
}
