import React, {
	useState,
	useCallback,
	useEffect,
	useRef,
	useMemo
} from 'react';
import {
	useCreateBlockNote
} from '@blocknote/react';
import {
	BlockNoteView
} from '@blocknote/mantine';
import {
	DragHandleButton,
	SideMenu,
	SideMenuController,
	type SideMenuProps
} from "@blocknote/react";
import { findRemovedImages } from '../utils/documents';
import { CustomSlashMenu } from './slash-menu';
import {
	useBlockNoteImageUpload,
	useBlockNoteImageRemoval,
} from '../hooks';
import type {
	DocumentTemplate,
	EditorConfig,
	UploadConfig,
	ImageUploadConfig,
	RemovalConfig,
	ImageRemovalConfig,
	SlashMenuConfig,
	TemplateConfig,
} from '../types';
import { DEFAULT_TEMPLATE_CONFIG } from '../types';
import {
	processDjangoEditorConfig
} from '../utils/editorConfig';


// Debounce hook
function useDebounce<T extends (...args: any[]) => any>(
	callback: T,
	delay: number
): T {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	return useCallback(((...args: Parameters<T>) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}
		timeoutRef.current = setTimeout(() => {
			callback(...args);
		}, delay);
	}) as T, [callback, delay]);
}

// Main BlockNote Editor Component
export function BlockNoteEditor({
	editorId,
	initialContent,
	editorConfig = {},
	onChange = null,
	readonly = false,
	uploadConfig = {},
	removalConfig = {},
	slashMenuConfig,
	templates = [],
	templateConfig,
	debounceDelay = 300,
}: {
	editorId: string;
	initialContent?: any;
	editorConfig?: EditorConfig;
	onChange?: ((content: any) => void) | null;
	readonly?: boolean;
	uploadConfig?: UploadConfig;
	removalConfig?: RemovalConfig;
	slashMenuConfig?: SlashMenuConfig;
	templates?: DocumentTemplate[];
	templateConfig: TemplateConfig;
	debounceDelay?: number;
}) {
	console.debug('Creating BlockNote 0.41.1 editor...');

	// Use upload hook - cast to ImageUploadConfig since we know it's images for now
	const { uploadFile } = useBlockNoteImageUpload(uploadConfig as ImageUploadConfig);
	const { removeImages } = useBlockNoteImageRemoval(removalConfig as ImageRemovalConfig);

	// State to track readonly status
	const [isReadonly, setIsReadonly] = useState(readonly);

	// Track previous document state
	const [previousDocument, setPreviousDocument] = useState(initialContent);

	// Separate state for the most recent content (for immediate UI updates)
	const [currentContent, setCurrentContent] = useState(initialContent);

	//  Process Django config WITHOUT readonly dependency to prevent editor recreation
	const processedEditorConfig = useMemo(() => {
		console.debug('🔍 Processing config for editor creation:', {
			editorId,
			originalConfig: editorConfig
		});

		const config = processDjangoEditorConfig(editorConfig);
		console.debug('🔍 After processDjangoEditorConfig:', config);

		// IMPORTANT: Don't handle readonly here - let it be handled separately
		// This ensures the editor instance stays stable

		// Clean up Django readonly flag but don't use it for editor creation
		delete config._django_readonly;

		return config;
	}, [editorConfig]); //  Removed readonly from dependencies

	console.debug('🔍 Final config being passed to useCreateBlockNote:', processedEditorConfig);

	// Create editor instance (stable - won't recreate on readonly changes)
	const editor = useCreateBlockNote({
		initialContent: initialContent || undefined,
		...processedEditorConfig,
		uploadFile: processedEditorConfig.uploadFile || uploadFile,
	});

	//  Handle readonly changes separately without recreating the editor
	useEffect(() => {
		if (editor) {
			const shouldBeReadonly = readonly || isReadonly || editorConfig._django_readonly;
			console.debug('🔍 READONLY CHANGE - Updating editor readonly state:', {
				readonly,
				isReadonly,
				djangoReadonly: editorConfig._django_readonly,
				finalReadonly: shouldBeReadonly
			});

			// Update the editor's editable state without recreating it
			editor.isEditable = !shouldBeReadonly;
		}
	}, [editor, readonly, isReadonly, editorConfig._django_readonly]);

	// Effect to watch for data-readonly changes
	useEffect(() => {
		if (!editorId) return;

		const container = document.querySelector(`[data-editor-id="${editorId}"]`);
		if (!container) return;

		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-readonly') {
					const newReadonlyValue = container.getAttribute('data-readonly') === "true";
					console.debug(`Readonly state changed for ${editorId}:`, newReadonlyValue);
					setIsReadonly(newReadonlyValue);
				}
			});
		});

		observer.observe(container, {
			attributes: true,
			attributeFilter: ['data-readonly']
		});

		return () => {
			observer.disconnect();
		};
	}, [editorId]); //  Removed editor dependency to prevent unnecessary re-runs

	// Debounced function for expensive operations (image cleanup + external onChange)
	const debouncedProcessChange = useDebounce((content: any) => {
		try {
			// Check for removed images (expensive operation)
			if (previousDocument) {
				const removedUrls = findRemovedImages(previousDocument, content);
				if (removedUrls.length > 0) {
					console.debug('🗑️ Detected removed images, sending for cleanup:', removedUrls);
					removeImages(removedUrls).catch((error) => {
						console.error('❌ Failed to remove images:', error);
					});
				}
			}

			// Update previous document for next comparison
			setPreviousDocument(content);

			// Call external onChange (potentially expensive, like API calls)
			if (onChange) {
				onChange(content);
				document.dispatchEvent(new CustomEvent('blocknote-change', {
					detail: { content: content, editor }
				}));
			}
		} catch (error) {
			console.warn('Error during debounced change processing:', error);
		}
	}, debounceDelay);

	// Immediate change handler (for UI responsiveness)
	const handleImmediateChange = useCallback(() => {
		const shouldBeEditable = !(readonly || isReadonly || editorConfig._django_readonly);
		if (editor && shouldBeEditable) {
			try {
				const content = editor.document;
				// Update current content immediately (for UI state)
				setCurrentContent(content);
				// Process expensive operations with debounce
				debouncedProcessChange(content);
			} catch (error) {
				console.warn('Error during immediate change handling:', error);
			}
		}
	}, [editor, readonly, isReadonly, editorConfig._django_readonly, debouncedProcessChange]);

	// Cleanup debounced function on unmount
	useEffect(() => {
		return () => {
			// Force final execution of debounced function on unmount
			if (currentContent && onChange) {
				try {
					onChange(currentContent);
				} catch (error) {
					console.warn('Error during final change execution:', error);
				}
			}
		};
	}, [currentContent, onChange]);

	//  Calculate editable state for BlockNoteView
	const isEditable = !(readonly || isReadonly || editorConfig._django_readonly);

	// Ensure theme is properly typed
	const theme = (editorConfig.theme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';

	// If custom slash menu is enabled, add it as a child
	if (slashMenuConfig?.enabled) {
		return (
			<BlockNoteView
				editor={editor}
				sideMenu={false}
				editable={isEditable}
				onChange={handleImmediateChange}
				theme={theme}
				slashMenu={false}
			>
				<SideMenuController
					sideMenu={(props: SideMenuProps) => (
						<SideMenu {...props}>
							<DragHandleButton {...props} />
						</SideMenu>
					)}
				/>
				<CustomSlashMenu
					editor={editor}
					config={slashMenuConfig}
					templates={templates}
					templateConfig={templateConfig || DEFAULT_TEMPLATE_CONFIG}
				/>
			</BlockNoteView>
		);
	}

	// Default return without custom slash menu but with side menu
	return (
		<BlockNoteView
			editor={editor}
			sideMenu={false}
			editable={isEditable}
			onChange={handleImmediateChange}
			theme={theme}
			slashMenu={true}
		>
			<SideMenuController
				sideMenu={(props: SideMenuProps) => (
					<SideMenu {...props}>
						<DragHandleButton {...props} />
					</SideMenu>
				)}
			/>
		</BlockNoteView>
	);
}
