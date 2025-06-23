// core/dom-scanner.ts
import type { EditorConfig, UploadConfig, RemovalConfig, SlashMenuConfig } from '../types';

// Define DocumentTemplate interface locally if not in main types
interface DocumentTemplate {
    id: string;
    title: string;
    subtext: string;
    aliases: string[];
    group: string;
    icon: string;
    content: any[];
}

export function scanForWidgets(
    rootElement: Document | Element = document,
    initWidgetCallback: (
        editorId: string,
        editorConfig: EditorConfig,
        uploadConfig: UploadConfig,
        removalConfig: RemovalConfig,
        slashMenuConfig: SlashMenuConfig,
        docTemplates: DocumentTemplate[], // Add templates parameter
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

        // Get SLASH MENU configuration from script tag with ID "_slash_menu_config"
        let slashMenuConfig = {};
        const slashMenuConfigScript = document.getElementById(`${editorId}_slash_menu_config`);
        console.log(`🔍 Looking for slash menu config script: ${editorId}_slash_menu_config`);
        console.log(`📜 Slash menu config script element:`, slashMenuConfigScript);
        if (slashMenuConfigScript) {
            try {
                slashMenuConfig = JSON.parse(slashMenuConfigScript.textContent || '{}');
                console.log(`⚡ Slash menu config loaded for ${editorId}:`, slashMenuConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid slash menu config for ${editorId}:`, e);
            }
        } else {
            console.warn(`⚠️ No slash menu config script found for ${editorId}_slash_menu_config - using defaults`);
            // Set default config if script is missing
            slashMenuConfig = {
                enabled: false  // Default to disabled if no config found
            };
        }

        // Get DOCUMENT TEMPLATES from script tag with ID "_doc_templates"
        let docTemplates: DocumentTemplate[] = [];
        const docTemplatesScript = document.getElementById(`${editorId}_doc_templates`);
        console.log(`🔍 Looking for document templates script: ${editorId}_doc_templates`);
        console.log(`📜 Document templates script element:`, docTemplatesScript);
        if (docTemplatesScript) {
            try {
                docTemplates = JSON.parse(docTemplatesScript.textContent || '[]');
                console.log(`📄 Document templates loaded for ${editorId}:`, docTemplates);
                console.log(`   Found ${docTemplates.length} templates`);
            } catch (e) {
                console.warn(`⚠️ Invalid document templates for ${editorId}:`, e);
                docTemplates = []; // Fallback to empty array
            }
        } else {
            console.warn(`⚠️ No document templates script found for ${editorId}_doc_templates - using empty array`);
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

        // Initialize with all configs including templates
        console.log(`✅ Initializing BlockNote ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);
        console.log(`   🎯 Slash menu ${slashMenuConfig.enabled ? 'ENABLED' : 'DISABLED'} for ${editorId}`);
        console.log(`   📄 Templates: ${docTemplates.length} available for ${editorId}`);

        initWidgetCallback(
            editorId,
            editorConfig,
            uploadConfig,
            removalConfig,
            slashMenuConfig,
            docTemplates,  // Pass templates to callback
            content,
            isReadonly
        );
    });

    console.log('✅ Widget scanning complete');
}
