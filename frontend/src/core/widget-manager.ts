import React from 'react';
import { createRoot } from 'react-dom/client';
import { BlockNoteEditor } from './editor';
import type {
	DocumentTemplate,
	EditorConfig,
	UploadConfig,
	RemovalConfig,
	SlashMenuConfig,
	TemplateConfig,
} from '../types';

// Widget initialization with cleanup tracking
export const blockNoteRoots = new Map(); // Track React roots for cleanup

// Memory leak fix - cleanup function to properly unmount React roots
export function cleanupWidget(editorId: string): void {
	console.debug('🧹 Cleaning up widget:', editorId);
	const root = blockNoteRoots.get(editorId);
	if (root) {
		try {
			// Signal to any React components that they're being properly cleaned up
			// This prevents stale onChange calls during unmount
			const cleanupEvent = new CustomEvent('blocknote-cleanup', { 
				detail: { editorId } 
			});
			document.dispatchEvent(cleanupEvent);
			
			root.unmount();
			blockNoteRoots.delete(editorId);
			

			
			console.debug('✅ Successfully cleaned up React root for:', editorId);
		} catch (error) {
			console.error('❌ Error during widget cleanup for', editorId, ':', error);
			// Still remove from map even if unmount failed
			blockNoteRoots.delete(editorId);
			

		}
	} else {
		console.debug('ℹ️ No React root found to cleanup for:', editorId);
	}
}

// Cleanup all widgets (useful for page unload or global cleanup)
export function cleanupAllWidgets(): void {
	console.debug('🧹 Cleaning up all widgets, count:', blockNoteRoots.size);
	const editorIds = Array.from(blockNoteRoots.keys());
	editorIds.forEach(editorId => cleanupWidget(editorId));
	console.debug('✅ All widgets cleaned up');
}

// Cleanup widgets by editor IDs (useful for form submissions)
export function cleanupWidgetsByIds(editorIds: string[]): void {
	console.debug('🧹 Cleaning up specific widgets:', editorIds);
	editorIds.forEach(editorId => cleanupWidget(editorId));
	console.debug('✅ Specific widgets cleaned up');
}

// Check if a widget exists in the tracking map
export function hasWidget(editorId: string): boolean {
	return blockNoteRoots.has(editorId);
}

// Get the count of active widgets
export function getActiveWidgetCount(): number {
	return blockNoteRoots.size;
}

// Clean up orphaned widgets (widgets whose DOM elements no longer exist)
export function cleanupOrphanedWidgets(): void {
	console.debug('🔍 Checking for orphaned widgets...');
	const orphanedIds: string[] = [];
	
	blockNoteRoots.forEach((root, editorId) => {
		// Check if the DOM elements still exist
		const editorContainer = document.getElementById(editorId + '_editor');
		const textarea = document.getElementById(editorId);
		
		if (!editorContainer && !textarea) {
			console.debug('🗑️ Found orphaned widget:', editorId);
			orphanedIds.push(editorId);
			cleanupWidget(editorId);
		}
	});
	
	if (orphanedIds.length > 0) {
		console.log('🧹 Cleaned up orphaned widgets:', orphanedIds);
	} else {
		console.debug('✅ No orphaned widgets found');
	}
}

export function initWidgetWithData(
	editorId: string,
	editorConfig: EditorConfig,
	uploadConfig: UploadConfig,
	removalConfig: RemovalConfig,
	slashMenuConfig: SlashMenuConfig,
	docTemplates: DocumentTemplate[], // Add templates parameter
	initialContent: unknown = null,
	readonly: boolean = false,
	templateConfig: TemplateConfig,
): void {
	console.debug('Initializing BlockNote widget:', editorId);

	console.debug('🎯 Slash menu config for', editorId, ':', slashMenuConfig);
	console.debug('📄 Templates for', editorId, ':', docTemplates?.length || 0);
	console.debug(`🔧 Widget Manager - received templateConfig for ${editorId}:`, templateConfig);

	const container = document.getElementById(editorId + '_editor');
	const textarea = document.getElementById(editorId);

	if (!container || !textarea) {
		console.error('Elements not found for editor:', editorId);
		return;
	}



	// Process initial content FIRST - before we use it anywhere
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
		console.debug(`🔧 Initialized textarea for ${editorId} with valid JSON:`, textareaInitialValue);
		

	} catch (error) {
		console.error(`❌ Failed to initialize textarea JSON for ${editorId}:`, error);
		textareaElement.value = '[]';
		textareaElement.defaultValue = '[]';
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
			console.debug('Could not extract fallback text');
		}
	}


	
	// Change handler with error handling
	const handleChange = (content: unknown) => {
		try {
			const jsonContent = JSON.stringify(content || []);
			textareaElement.value = jsonContent;
			textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
			textareaElement.dispatchEvent(new Event('input', { bubbles: true }));
			console.debug(`📝 Updated textarea for ${editorId} with content length: ${Array.isArray(content) ? content.length : 'non-array'}`);
		} catch (error) {
			console.error(`❌ Error updating textarea for ${editorId}:`, error);
			textareaElement.value = '[]';
			textareaElement.dispatchEvent(new Event('change', { bubbles: true }));
		}
	};

	// RESTORED: Check if we have an existing root and update it (prevents flicker)
	if (blockNoteRoots.has(editorId)) {
		console.debug('Updating existing React root for:', editorId);
		

		
		// Get the existing root and re-render with new props
		const existingRoot = blockNoteRoots.get(editorId);
		const element = React.createElement(BlockNoteEditor, {
			editorId: editorId,
			initialContent: processedContent,
			editorConfig: editorConfig,
			uploadConfig: uploadConfig,
			removalConfig: removalConfig,
			slashMenuConfig: slashMenuConfig,
			templates: docTemplates,
			onChange: handleChange,
			readonly: readonly,
			templateConfig,
			debounceDelay: 300
		});
		existingRoot.render(element);
		console.debug('✅ BlockNote widget updated successfully:', editorId);
		console.debug(`   📊 Total active widgets: ${blockNoteRoots.size}`);
		return;
	}

	// Only create new root if one doesn't exist
	console.debug('Creating new React root for:', editorId);
	// Clear loading placeholder
	const loadingDiv = container.querySelector('.blocknote-loading');
	if (loadingDiv) {
		(loadingDiv as HTMLElement).style.display = 'none';
	}

	console.debug(`🔧 Widget Manager - passing templateConfig to editor:`, templateConfig);

	try {
		const element = React.createElement(BlockNoteEditor, {
			editorId: editorId,
			initialContent: processedContent,
			editorConfig: editorConfig,
			uploadConfig: uploadConfig,
			removalConfig: removalConfig,
			slashMenuConfig: slashMenuConfig,
			templates: docTemplates, // Pass templates to BlockNoteEditor
			onChange: handleChange,
			readonly: readonly,
			templateConfig,
			debounceDelay: 300
		});

		const root = createRoot(container);
		root.render(element);
		blockNoteRoots.set(editorId, root);

		console.debug('✅ BlockNote widget rendered successfully:', editorId);
		console.debug(`   ⚡ Custom slash menu: ${slashMenuConfig?.enabled ? 'ENABLED' : 'DISABLED'}`);
		console.debug(`   📄 Templates loaded: ${docTemplates?.length || 0}`);
		console.debug(`   📊 Total active widgets: ${blockNoteRoots.size}`);

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

// Auto-cleanup on page unload to prevent memory leaks in single-page apps
if (typeof window !== 'undefined') {
	window.addEventListener('beforeunload', cleanupAllWidgets);
}
