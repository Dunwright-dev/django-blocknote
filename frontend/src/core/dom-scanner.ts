// core/dom-scanner.ts
import type {
    EditorConfig,
    UploadConfig,
    RemovalConfig,
    SlashMenuConfig,
    TemplateConfig,
} from '../types';

import { DEFAULT_TEMPLATE_CONFIG } from '../types';

// Define DocumentTemplate interface locally if not in main types
// TODO: This in types, using that causes readonly to flicker
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
        docTemplates: DocumentTemplate[],
        initialContent: unknown,
        readonly: boolean,
        templateConfig: TemplateConfig,
    ) => void
): void {
    console.debug('🔍 Scanning for BlockNote widgets...');
    // Find all BlockNote containers
    const containers = rootElement.querySelectorAll('[data-editor-id]');
    console.debug(`Found ${containers.length} potential widget containers`);

    containers.forEach((container) => {
        const editorId = container.getAttribute('data-editor-id');
        const isReadonly = container.getAttribute('data-readonly') === 'true';

        if (!editorId) {
            console.warn('Container missing data-editor-id:', container);
            return;
        }

        console.debug(`📝 Processing ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);

        // Get EDITOR configuration from script tag with ID "_editor_config"
        let editorConfig = {};
        const editorConfigScript = document.getElementById(`${editorId}_editor_config`);
        if (editorConfigScript) {
            try {
                editorConfig = JSON.parse(editorConfigScript.textContent || '{}');
                console.debug(`📋 Editor config loaded for ${editorId}:`, editorConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid editor config for ${editorId}:`, e);
            }
        }
        if (editorConfigScript) {
            try {
                editorConfig = JSON.parse(editorConfigScript.textContent || '{}');
                console.debug(`📋 Editor config loaded for ${editorId}:`, editorConfig);

                // 🔍 DEBUG: Specifically check for placeholder
                console.debug(`🔍 PLACEHOLDER DEBUG - Raw script content:`, editorConfigScript.textContent);
                console.debug(`🔍 PLACEHOLDER DEBUG - Parsed editorConfig:`, editorConfig);
                console.debug(`🔍 PLACEHOLDER DEBUG - editorConfig.placeholder:`, editorConfig.placeholder);
                console.debug(`🔍 PLACEHOLDER DEBUG - Has placeholder property:`, 'placeholder' in editorConfig);
                console.debug(`🔍 PLACEHOLDER DEBUG - typeof placeholder:`, typeof editorConfig.placeholder);

                // Check all keys to see what Django is actually sending
                console.debug(`🔍 PLACEHOLDER DEBUG - All keys in editorConfig:`, Object.keys(editorConfig));

            } catch (e) {
                console.warn(`⚠️ Invalid editor config for ${editorId}:`, e);
            }
        }

        // Get TEMPLATE loading configuration from script tag with ID "_template_config"
        let templateConfig: TemplateConfig = { ...DEFAULT_TEMPLATE_CONFIG }; // Start with defaults
        const templateConfigScript = document.getElementById(`${editorId}_template_config`);
        // Wherever you call initWidgetCallback, log the templateConfig parameter
        console.debug(`🔧 Widget Manager - templateConfig being passed:`, templateConfig);

        if (templateConfigScript) {
            try {
                const parsed = JSON.parse(templateConfigScript.textContent || '{}');
                templateConfig = { ...templateConfig, ...parsed }; // merge with defaults
                console.debug(`⚙️ Template config loaded for ${editorId}:`, templateConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid template config for ${editorId}:`, e);
            }
        }
        // In dom-scanner.ts, after parsing templateConfig:
        console.debug(`⚙️ Template config loaded for ${editorId}:`, templateConfig);
        console.debug(`🔍 DEBUG - Raw template script content:`, templateConfigScript?.textContent);
        console.debug(`🔍 DEBUG - Final template config:`, templateConfig);
        console.debug(`⚙️ DEBUG - maxBlocks: ${templateConfig.maxBlocks}, chunkSize: ${templateConfig.chunkSize}`);

        // Get UPLOAD configuration from script tag with ID "_image_upload_config"
        let uploadConfig = {};
        const imageUploadConfigScript = document.getElementById(`${editorId}_image_upload_config`);
        console.debug(`🔍 Looking for upload config script: ${editorId}_image_upload_config`);
        console.debug(`📜 Upload config script element:`, imageUploadConfigScript);
        if (imageUploadConfigScript) {
            try {
                uploadConfig = JSON.parse(imageUploadConfigScript.textContent || '{}');
                console.debug(`📤 Upload config loaded for ${editorId}:`, uploadConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid upload config for ${editorId}:`, e);
            }
        } else {
            console.error(`❌ No image upload config script found for ${editorId}_image_upload_config`);
        }

        if (!uploadConfig.uploadUrl) {
            console.error(`❌ Missing uploadUrl for ${editorId} - check Django widget configuration`);
            console.debug(`Upload Config for ${editorId} is`, uploadConfig);
            return; // Don't initialize broken widget
        }

        // Get REMOVAL configuration from script tag with ID "_image_removal_config"
        let removalConfig = {};
        const imageRemovalConfigScript = document.getElementById(`${editorId}_image_removal_config`);
        console.debug(`🔍 Looking for removal config script: ${editorId}_image_removal_config`);
        console.debug(`📜 Removal config script element:`, imageRemovalConfigScript);
        if (imageRemovalConfigScript) {
            try {
                removalConfig = JSON.parse(imageRemovalConfigScript.textContent || '{}');
                console.debug(`🗑️ Removal config loaded for ${editorId}:`, removalConfig);
            } catch (e) {
                console.warn(`⚠️ Invalid removal config for ${editorId}:`, e);
            }
        } else {
            console.error(`❌ No image removal config script found for ${editorId}_image_removal_config`);
        }

        if (!removalConfig.removalUrl) {
            console.error(`❌ Missing removalUrl for ${editorId} - check Django widget configuration`);
            console.debug(`Removal Config for ${editorId} is`, removalConfig);
            return; // Don't initialize broken widget
        }

        // Get SLASH MENU configuration from script tag with ID "_slash_menu_config"
        let slashMenuConfig = {};
        const slashMenuConfigScript = document.getElementById(`${editorId}_slash_menu_config`);
        console.debug(`🔍 Looking for slash menu config script: ${editorId}_slash_menu_config`);
        console.debug(`📜 Slash menu config script element:`, slashMenuConfigScript);
        if (slashMenuConfigScript) {
            try {
                slashMenuConfig = JSON.parse(slashMenuConfigScript.textContent || '{}');
                console.debug(`⚡ Slash menu config loaded for ${editorId}:`, slashMenuConfig);
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
        console.debug(`🔍 Looking for document templates script: ${editorId}_doc_templates`);
        console.debug(`📜 Document templates script element:`, docTemplatesScript);
        if (docTemplatesScript) {
            try {
                docTemplates = JSON.parse(docTemplatesScript.textContent || '[]');
                console.debug(`📄 Document templates loaded for ${editorId}:`, docTemplates);
                console.debug(`   Found ${docTemplates.length} templates`);
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
                console.debug(`📄 Content loaded from script tag for ${editorId}:`, content);
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
                    console.debug(`📄 Content loaded from data attribute for ${editorId}:`, content);
                } catch (e) {
                    console.error(`❌ Failed to parse data attribute content for ${editorId}:`, e);
                }
            }
        }

        // Initialize with all configs including templates
        console.debug(`✅ Initializing BlockNote ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);
        console.debug(`   🎯 Slash menu ${slashMenuConfig.enabled ? 'ENABLED' : 'DISABLED'} for ${editorId}`);
        console.debug(`   📄 Templates: ${docTemplates.length} available for ${editorId}`);
        // Add this debug line HERE (after templateConfig is fully parsed):
        console.debug(`🔧 DOM Scanner - Final templateConfig being passed to callback:`, templateConfig);

        initWidgetCallback(
            editorId,
            editorConfig,
            uploadConfig,
            removalConfig,
            slashMenuConfig,
            docTemplates,
            content,
            isReadonly,
            templateConfig,
        );
    });

    console.debug('✅ Widget scanning complete');
}
