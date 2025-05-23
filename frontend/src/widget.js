// Simplified widget initialization for forms
import { initWidgetWithData } from './editor.js';

// Auto-initialize widgets when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Find all BlockNote widgets and initialize them
    const containers = document.querySelectorAll('[data-editor-id]');
    containers.forEach(container => {
        const editorId = container.dataset.editorId;
        if (editorId) {
            initWidget(editorId);
        }
    });
});
