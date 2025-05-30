// DOM Scanner for finding and initializing BlockNote widgets
export function scanForWidgets(
    rootElement: Document | Element = document,
    initWidgetCallback: (editorId: string, config: Record<string, unknown>, initialContent: unknown, readonly: boolean) => void
): void {
    console.log('🔍 Scanning for BlockNote widgets...');
    
    const containers = rootElement.querySelectorAll('.django-blocknote-container[data-editor-id]');
    console.log(`Found ${containers.length} potential widget containers`);
    
    containers.forEach((container) => {
        const editorId = container.getAttribute('data-editor-id');
        if (!editorId) {
            console.warn('Container missing data-editor-id:', container);
            return;
        }
        
        console.log(`📝 Processing widget: ${editorId}`);
        
        // Check if already initialized
        const textarea = document.getElementById(editorId);
        if (!textarea) {
            console.warn(`No textarea found for editor ID: ${editorId}`);
            return;
        }
        
        // Read configuration from script tags
        let config: Record<string, unknown> = {};
        let initialContent: unknown = null;
        
        // Read config
        const configElement = document.getElementById(`${editorId}_config`);
        if (configElement) {
            try {
                const configText = configElement.textContent || '{}';
                config = JSON.parse(configText);
                console.log(`📋 Config loaded for ${editorId}:`, config);
            } catch (error) {
                console.warn(`Failed to parse config for ${editorId}:`, error);
            }
        }
        
        // Read initial content
        const contentElement = document.getElementById(`${editorId}_content`);
        if (contentElement) {
            try {
                const contentText = contentElement.textContent || '[]';
                initialContent = JSON.parse(contentText);
                console.log(`📄 Content loaded for ${editorId}:`, initialContent);
            } catch (error) {
                console.warn(`Failed to parse content for ${editorId}:`, error);
                initialContent = [];
            }
        }
        
        // Check readonly status
        const readonly = container.getAttribute('data-readonly') === 'true';
        
        // Initialize the widget
        try {
            initWidgetCallback(editorId, config, initialContent, readonly);
        } catch (error) {
            console.error(`Failed to initialize widget ${editorId}:`, error);
        }
    });
    
    console.log('✅ Widget scanning complete');
}
