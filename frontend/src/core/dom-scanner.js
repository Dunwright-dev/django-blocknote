// Auto-initialize widgets when content is added via HTMX
export function scanForWidgets(rootElement = document, initWidgetCallback) {
    const containers = rootElement.querySelectorAll('[data-editor-id]:not([data-blocknote-initialized])');
    containers.forEach(container => {
        const editorId = container.dataset.editorId;
        const textarea = document.getElementById(editorId);
        
        if (textarea && !container.dataset.blocknoteInitialized) {
            console.log("USING BLOCKNOTE.JS")
            container.dataset.blocknoteInitialized = 'true';
            
            // Get config and content from script tags (safer than data attributes)
            let config = {};
            let initialContent = null;
            let readonly = container.dataset.readonly === "true";
            console.log(readonly);
            
            try {
                const configScript = document.getElementById(editorId + '_config');
                if (configScript && configScript.textContent.trim()) {
                    config = JSON.parse(configScript.textContent);
                }
            } catch (e) {
                console.warn('Error parsing widget config for', editorId, e);
            }
            
            try {
                const contentScript = document.getElementById(editorId + '_content');
                if (contentScript && contentScript.textContent.trim()) {
                    const parsed = JSON.parse(contentScript.textContent);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        initialContent = parsed;
                    }
                }
            } catch (e) {
                console.warn('Error parsing widget content for', editorId, e);
            }
            
            // Call the provided init function
            if (initWidgetCallback) {
                initWidgetCallback(editorId, config, initialContent, readonly);
            }
        }
    });
}
