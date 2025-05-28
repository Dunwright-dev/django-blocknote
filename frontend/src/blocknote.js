import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import './styles/blocknote.css'; // Import your CSS file directly

// Import the functionality we want to expose
import { scanForWidgets } from './core/dom-scanner.js';
import { initWidgetWithData, blockNoteRoots } from './core/widget-manager.js';
import { checkReady } from './utils/helpers.js';

console.log('Loading BlockNote 0.31.0 with React 19 (HTMX compatible)...');
console.log('🚀 BlockNote script started loading');
console.log('React available at start:', typeof React !== 'undefined');
console.log('ReactDOM available at start:', typeof ReactDOM !== 'undefined');

// Simple state management
let isReady = false;
let pendingWidgets = [];

// Initialize a widget immediately or queue it
function initWidget(editorId, config, initialContent, readonly) {
    if (checkReady()) {
        console.log('✅ Initializing BlockNote widget immediately:', editorId);
        initWidgetWithData(editorId, config, initialContent, readonly);
    } else {
        console.log('⏳ Queueing BlockNote widget:', editorId);
        pendingWidgets.push({ editorId, config, initialContent, readonly });
    }
}

// Process all pending widgets
function processPending() {
    if (checkReady() && pendingWidgets.length > 0) {
        console.log('🚀 Processing', pendingWidgets.length, 'pending widgets');
        pendingWidgets.forEach(widget => {
            initWidgetWithData(widget.editorId, widget.config, widget.initialContent, widget.readonly);
        });
        pendingWidgets = [];
        isReady = true;
    }
}

// Wrapper function that passes initWidget callback to scanForWidgets
function scanForWidgetsWithInit(rootElement = document) {
    scanForWidgets(rootElement, initWidget);
}

// Initialize when dependencies are loaded
function initBlockNote() {
    if (checkReady()) {
        processPending();
        scanForWidgetsWithInit();
    } else {
        setTimeout(initBlockNote, 100);
    }
}

// Start initialization process
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlockNote);
} else {
    initBlockNote();
}

// HTMX integration - scan for new widgets after HTMX swaps content
document.addEventListener('htmx:afterSwap', function(event) {
    console.log('🔄 HTMX content swapped, scanning for new BlockNote widgets');
    scanForWidgetsWithInit(event.detail.target);
});

// Also handle htmx:load for broader compatibility
document.addEventListener('htmx:load', function(event) {
    console.log('📥 HTMX content loaded, scanning for BlockNote widgets');
    scanForWidgetsWithInit(event.detail.elt);
});

// PUBLIC API - This is all that gets exposed globally
window.DjangoBlockNote = {
    scanForWidgets: scanForWidgetsWithInit,
    initWidget,
    blockNoteRoots
};

// Debug: Confirm DjangoBlockNote is available
console.log('✅ DjangoBlockNote namespace created:', typeof window.DjangoBlockNote);
console.log('Available functions:', Object.keys(window.DjangoBlockNote));

// Dispatch a custom event to signal that BlockNote is ready
document.dispatchEvent(new CustomEvent('blocknote-ready', {
    detail: { 
        timestamp: Date.now(),
        functions: Object.keys(window.DjangoBlockNote)
    }
}));

// NO EXPORTS - This file creates the global object and that's it!
