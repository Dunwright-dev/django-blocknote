// core/dom-scanner.ts
export function scanForWidgets(
    rootElement: Document | Element = document,
    initWidgetCallback: (editorId: string, config: Record<string, unknown>, initialContent: unknown, readonly: boolean) => void
): void {
    console.log('🔍 Scanning for BlockNote widgets...');

    // Find all BlockNote containers (both editors and viewers)
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

        // Get configuration from data attribute
        let config = {};
        const configAttr = container.getAttribute('data-blocknote-config');
        if (configAttr) {
            try {
                config = JSON.parse(configAttr);
                console.log(`📋 Config loaded for ${editorId}:`, config);
            } catch (e) {
                console.warn(`⚠️ Invalid config for ${editorId}:`, e);
            }
        }

        // Get content - try multiple sources
        let content = [];

        // Method 1: From script tag (your current template uses this)
        const contentScript = document.getElementById(`${editorId}_content`);
        if (contentScript) {
            try {
                content = JSON.parse(contentScript.textContent || '[]');
                console.log(`📄 Content loaded from script tag for ${editorId}:`, content);
            } catch (e) {
                console.error(`❌ Failed to parse script tag content for ${editorId}:`, e);
            }
        }

        // Method 2: From data attribute (fallback)
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

        // Method 3: From textarea (another fallback)
        if (!content.length) {
            const textarea = rootElement.querySelector(`#${editorId}`) as HTMLTextAreaElement;
            if (textarea && textarea.value) {
                try {
                    content = JSON.parse(textarea.value);
                    console.log(`📄 Content loaded from textarea for ${editorId}:`, content);
                } catch (e) {
                    console.warn(`⚠️ Failed to parse textarea content for ${editorId}:`, e);
                }
            }
        }

        // Initialize using the callback (this is the key fix!)
        console.log(`✅ Initializing BlockNote ${isReadonly ? 'viewer' : 'widget'}: ${editorId}`);
        initWidgetCallback(editorId, config, content, isReadonly);
    });

    console.log('✅ Widget scanning complete');
}
