import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import './styles/blocknote.css';

// Import with proper TypeScript paths
import { scanForWidgets } from './core/dom-scanner';
import {
    initWidgetWithData,
    blockNoteRoots,
} from './core/widget-manager';
import { checkReady } from './utils/helpers';
import type {
    EditorConfig,
    UploadConfig,
    RemovalConfig,
    SlashMenuConfig,
} from './types';

console.log('Loading BlockNote 0.31.0 with React 19 (HTMX compatible)...');
console.log('🚀 BlockNote script started loading');
console.log('React available at start:', typeof React !== 'undefined');
console.log('ReactDOM available at start:', typeof ReactDOM !== 'undefined');

// TypeScript interfaces
interface WidgetData {
    editorId: string;
    editorConfig: EditorConfig;
    uploadConfig: UploadConfig;
    removalConfig: RemovalConfig;
    slashMenuConfig: SlashMenuConfig;
    initialContent: unknown;
    readonly: boolean;
}

// HTMX interfaces
interface HTMXEvent extends Event {
    detail: {
        target?: Element;
        elt?: Element;
    };
}

interface DjangoBlockNoteAPI {
    scanForWidgets: (rootElement?: Document | Element) => void;
    initWidget: (
        editorId: string,
        editorConfig: EditorConfig,
        uploadConfig: UploadConfig,
        removalConfig: RemovalConfig,
        slashMenuConfig: SlashMenuConfig,
        initialContent: unknown,
        readonly: boolean
    ) => void;
    blockNoteRoots: Map<string, unknown>;
}

// Extend Window interface
declare global {
    interface Window {
        DjangoBlockNote: DjangoBlockNoteAPI;
    }
}

// Simple state management with types
let isReady: boolean = false;
let pendingWidgets: WidgetData[] = [];

// Initialize a widget immediately or queue it
function initWidget(
    editorId: string,
    editorConfig: EditorConfig,
    uploadConfig: UploadConfig,
    removalConfig: RemovalConfig,
    slashMenuConfig: SlashMenuConfig,  // Add slash menu config parameter
    initialContent: unknown,
    readonly: boolean
): void {
    if (checkReady()) {
        console.log('✅ Initializing BlockNote widget immediately:', editorId);
        initWidgetWithData(editorId, editorConfig, uploadConfig, removalConfig, slashMenuConfig, initialContent, readonly);
    } else {
        console.log('⏳ Queueing BlockNote widget:', editorId);
        pendingWidgets.push({ editorId, editorConfig, uploadConfig, removalConfig, slashMenuConfig, initialContent, readonly });
    }
}

// Process all pending widgets
function processPending(): void {
    if (checkReady() && pendingWidgets.length > 0) {
        console.log('🚀 Processing', pendingWidgets.length, 'pending widgets');
        pendingWidgets.forEach((widget: WidgetData) => {
            initWidgetWithData(
                widget.editorId,
                widget.editorConfig,
                widget.uploadConfig,
                widget.removalConfig,
                widget.slashMenuConfig,  // Add slash menu config to processing
                widget.initialContent,
                widget.readonly,
            );
        });
        pendingWidgets = [];
        isReady = true;
    }
}

// Wrapper function that passes initWidget callback to scanForWidgets
function scanForWidgetsWithInit(rootElement: Document | Element = document): void {
    scanForWidgets(rootElement, initWidget);
}

// Initialize when dependencies are loaded
function initBlockNote(): void {
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
document.addEventListener('htmx:afterSwap', function(event: HTMXEvent): void {
    console.log('🔄 HTMX content swapped, scanning for new BlockNote widgets');
    if (event.detail.target) {
        scanForWidgetsWithInit(event.detail.target);
    }
});

// Also handle htmx:load for broader compatibility
document.addEventListener('htmx:load', function(event: HTMXEvent): void {
    console.log('📥 HTMX content loaded, scanning for BlockNote widgets');
    if (event.detail.elt) {
        scanForWidgetsWithInit(event.detail.elt);
    }
});

// PUBLIC API
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
import React from 'react';
import ReactDOM from 'react-dom/client';

// Expose React and ReactDOM globally if not already available
if (typeof window !== 'undefined') {
    if (!window.React) {
        (window as any).React = React;
        console.log('✅ React exposed globally from DjangoBlockNote bundle');
    }
    if (!window.ReactDOM) {
        (window as any).ReactDOM = ReactDOM;
        console.log('✅ ReactDOM exposed globally from DjangoBlockNote bundle');
    }
}
