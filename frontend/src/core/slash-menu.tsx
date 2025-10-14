import {
	useState,
	useEffect,
	useMemo,
	useCallback,
	useRef,
	createElement
} from 'react';

import {
	getDefaultReactSlashMenuItems,
	SuggestionMenuController,
	DefaultReactSuggestionItem
} from '@blocknote/react';

import {
	BlockNoteEditor,
} from '@blocknote/core';

import { getTemplateIcon } from '../utils/template-icons';
import { advancedFuzzySearch } from '../utils/fuzzy-search';
import { createTemplateSizeErrorBlocks } from '../utils/template-errors';
import { MENU_KEYS, MENU_OPTIONS, findMenuOption } from '../config/menu-config';
import type {
	SlashMenuConfig,
	TemplateConfig,
	DocumentTemplate,
} from '../types';

interface CustomSlashMenuProps {
	editor: BlockNoteEditor;
	config?: SlashMenuConfig;
	templates?: DocumentTemplate[];
	templateConfig: TemplateConfig;
}

// Timing constants
const DEBOUNCE_FAST = 100;
const DEBOUNCE_NORMAL = 200;
const CURSOR_POSITIONING_DELAY = 50;
const CHUNK_INSERTION_DELAY = 10;

// Menu states with transition support
const MENU_STATES = {
	SELECTOR: 'selector',
	FUZZY: 'fuzzy',
	TRANSITIONING: 'transitioning'
} as const;

type MenuState = typeof MENU_STATES[keyof typeof MENU_STATES];

// Transition dummy item generator
const getTransitionDummyItem = (targetMenu: string | null): DefaultReactSuggestionItem => {
	const menuOption = findMenuOption(targetMenu || '');
	return {
		title: targetMenu && menuOption ? `Loading ${menuOption.label}...` : 'Loading...',
		onItemClick: () => { }, // No-op during transition
		aliases: [],
		group: 'System',
		icon: '⏳', // Optional '🔄' spinner effect
		subtext: 'Please wait...',
		content: 'transition-dummy'
	};
};

const insertTemplate = (editor: BlockNoteEditor, templateContent: any[], options: TemplateConfig) => {
	console.debug('🔧 Template insertion started:', { blocks: templateContent.length });
	if (templateContent.length === 0) return;

	console.debug('MAX BLOCK OPTION', options.maxBlocks)
	console.debug('CHUNK SIZE', options.chunkSize)

	const MAX_BLOCKS = options.maxBlocks;
	const CHUNK_SIZE = options.chunkSize;

	// Hard limit check - insert error message
	if (templateContent.length > MAX_BLOCKS) {
		console.warn(`Template exceeds maximum size of ${MAX_BLOCKS} blocks (${templateContent.length} blocks)`);
		const errorBlocks = createTemplateSizeErrorBlocks(templateContent.length, MAX_BLOCKS);
		editor.insertBlocks(errorBlocks, editor.getTextCursorPosition().block, "replace");
		return;
	}

	// Function to move cursor to first editable position
	const moveCursorToFirstEditablePosition = () => {
		try {
			const document = editor.document;
			// Find the first block where user can type
			for (let i = 0; i < document.length; i++) {
				const block = document[i];
				// Look for blocks that are typically editable and empty or have placeholder content
				if (block.type === 'paragraph' ||
					block.type === 'heading' ||
					block.type === 'bulletListItem' ||
					block.type === 'checkListItem') {
					// Check if block is empty or has placeholder-like content
					const isEmpty = !block.content || block.content.length === 0;
					const hasPlaceholderText = block.content && block.content.some(item =>
						item.text && (item.text.includes(':') || item.text.includes('Date') || item.text === '')
					);

					if (isEmpty || hasPlaceholderText) {
						console.debug(`🎯 Moving cursor to block ${i} (${block.type})`);
						editor.setTextCursorPosition(block, "end");
						return;
					}
				}
			}

			// Fallback: move to the end of the first block
			if (document.length > 0) {
				editor.setTextCursorPosition(document[0], "end");
			}
		} catch (error) {
			console.warn('Error positioning cursor:', error);
		}
	};

	if (templateContent.length <= CHUNK_SIZE) {
		// Small template - insert all at once
		editor.insertBlocks(templateContent, editor.getTextCursorPosition().block, "replace");
		// Move cursor to first editable position
		setTimeout(moveCursorToFirstEditablePosition, CURSOR_POSITIONING_DELAY);
	} else {
		// Large template - chunked insertion
		let currentBlock = editor.getTextCursorPosition().block;
		let insertedCount = 0;

		const insertNextChunk = () => {
			const chunk = templateContent.slice(insertedCount, insertedCount + CHUNK_SIZE);
			if (insertedCount === 0) {
				editor.insertBlocks(chunk, currentBlock, "replace");
			} else {
				currentBlock = editor.getTextCursorPosition().block;
				editor.insertBlocks(chunk, currentBlock, "after");
			}

			insertedCount += CHUNK_SIZE;
			if (insertedCount < templateContent.length) {
				setTimeout(insertNextChunk, CHUNK_INSERTION_DELAY);
			} else {
				// All chunks inserted - move cursor to first editable position
				setTimeout(moveCursorToFirstEditablePosition, CURSOR_POSITIONING_DELAY);
			}
		};

		insertNextChunk();
	}
};

// Create template slash menu items with enhanced UX
const createTemplateItems = (editor: BlockNoteEditor, templates: DocumentTemplate[], templateConfig: TemplateConfig): DefaultReactSuggestionItem[] =>
	templates.map(template => ({
		title: template.title,
		onItemClick: () => insertTemplate(editor, template.content, templateConfig),
		aliases: template.aliases,
		group: template.group,
		icon: getTemplateIcon(template.icon),
		subtext: template.subtext,
	}));

// Create menu selector items with enhanced navigation
const createMenuSelectorItems = (onMenuSelect: (menuKey: string) => void): DefaultReactSuggestionItem[] =>
	MENU_OPTIONS.map(option => ({
		title: option.label,
		onItemClick: () => onMenuSelect(option.key),
		aliases: [option.key, option.shortcut],
		group: 'Menus',
		icon: option.icon(),
		subtext: option.description,
		badge: option.shortcut,
	}));

export function CustomSlashMenu({ editor, config, templates = [], templateConfig }: CustomSlashMenuProps) {
	// Debug: track component instances for debugging (but don't use for blocking)
	const instanceId = useMemo(() => Math.random().toString(36).slice(2, 11), []);

	// Enhanced state management with transition support
	const [menuState, setMenuState] = useState<MenuState>(MENU_STATES.SELECTOR);
	const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
	const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

	// Debounced query state
	const [debouncedQuery, setDebouncedQuery] = useState<string>('');
	const timeoutRef = useRef<number | null>(null);

	// Get default slash menu items
	const defaultItems = getDefaultReactSlashMenuItems(editor);

	// Create template items - memoized to prevent recreation
	const templateItems = useMemo(() =>
		createTemplateItems(editor, templates, templateConfig),
		[editor, templates, templateConfig]
	);

	// Smooth transition handlers
	const handleMenuSelect = useCallback((menuKey: string) => {
		// Disable transitions temporarily to test flicker
		setSelectedMenu(menuKey);
		setMenuState(MENU_STATES.FUZZY);
		setIsTransitioning(false);
	}, []);

	// Create menu selector items with callback
	const menuSelectorItems = useMemo(() =>
		createMenuSelectorItems(handleMenuSelect),
		[handleMenuSelect]
	);

	// Filter default items based on config
	const filteredDefaultItems = useMemo(() => {
		if (!config?.enabled || config.mode === 'default') {
			return defaultItems;
		}

		if (config.mode === 'filtered' && config.disabled_items) {
			return defaultItems.filter(item => {
				const shouldDisable = config.disabled_items!.some(disabledKey => {
					return (
						(item.key && item.key.includes(disabledKey)) ||
						(item.title && item.title.toLowerCase().includes(disabledKey.toLowerCase())) ||
						(item.name && item.name.toLowerCase().includes(disabledKey.toLowerCase())) ||
						(item.aliases && item.aliases.some(alias => {
							return alias.toLowerCase().includes(disabledKey.toLowerCase());
						}))
					);
				});
				return !shouldDisable;
			});
		}

		return defaultItems;
	}, [defaultItems, config]);

	// Enhanced debounce with transition awareness and race condition protection
	const updateDebouncedQuery = useCallback((query: string) => {
		// Always clear any existing timeout first
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}

		// Faster debounce during transitions for better UX
		const debounceTime = isTransitioning ? DEBOUNCE_FAST : DEBOUNCE_NORMAL;

		timeoutRef.current = setTimeout(() => {
			// Race condition protection: only update state if component is still mounted
			if (timeoutRef.current) {
				setDebouncedQuery(query);
				timeoutRef.current = null; // Clear ref after execution
			}
		}, debounceTime);
	}, [isTransitioning]);

	// Cleanup timeout on unmount or menu state changes
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = null;
			}
		};
	}, []);

	// Clear debounced query when menu state changes to prevent stale updates
	useEffect(() => {
		setDebouncedQuery('');
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
	}, [menuState]);

	// Enhanced query parsing with transition support
	const parseQuery = useCallback((query: string) => {
		const trimmedQuery = query.trim();

		// Handle empty query
		if (!trimmedQuery) {
			return { shouldShowSelector: true, menuKey: null, searchQuery: '' };
		}

		// Check for direct menu shortcuts
		const menuOption = MENU_OPTIONS.find(option =>
			trimmedQuery.toLowerCase() === option.key.toLowerCase()
		);

		if (menuOption) {
			return { shouldShowSelector: false, menuKey: menuOption.key, searchQuery: '' };
		}

		// Check for fuzzy search within menu (e.g., "t search term")
		const firstChar = trimmedQuery[0].toLowerCase();
		const menuOptionByFirstChar = MENU_OPTIONS.find(option =>
			option.key.toLowerCase() === firstChar
		);

		if (menuOptionByFirstChar && trimmedQuery.length > 1) {
			return {
				shouldShowSelector: false,
				menuKey: menuOptionByFirstChar.key,
				searchQuery: trimmedQuery.slice(1).trim()
			};
		}

		// Default to selector filtering
		return { shouldShowSelector: true, menuKey: null, searchQuery: trimmedQuery };
	}, []);

	// Debug logging
	useEffect(() => {
		console.debug(`Custom Slash Menu Debug [${instanceId}]:`, {
			menuState,
			selectedMenu,
			isTransitioning,
			total_default_items: defaultItems.length,
			template_items: templateItems.length,
			filtered_items: filteredDefaultItems.length,
			menu_selector_items: menuSelectorItems.length,
			config: config,
		});
	}, [instanceId, menuState, selectedMenu, isTransitioning, defaultItems, templateItems, filteredDefaultItems, menuSelectorItems, config]);

	// All editors can render their slash menus simultaneously
	return createElement(SuggestionMenuController, {
		triggerCharacter: "/",
		getItems: async function(query) {
			updateDebouncedQuery(query);

			// Return dummy item during transitions to prevent "no items found" flash
			if (isTransitioning) {
				return [getTransitionDummyItem(selectedMenu)];
			}

			// Use debounced query for better performance
			const queryToUse = debouncedQuery || query;
			const { shouldShowSelector, menuKey, searchQuery } = parseQuery(queryToUse);

			console.debug(`Enhanced Menu Query [${instanceId}]:`, {
				query,
				queryToUse,
				shouldShowSelector,
				menuKey,
				searchQuery,
				menuState
			});

			// Show selector menu with fuzzy filtering
			if (shouldShowSelector) {
				if (menuState !== MENU_STATES.SELECTOR) {
					setMenuState(MENU_STATES.SELECTOR);
					setSelectedMenu(null);
				}

				// Apply fuzzy search to menu selector items
				return searchQuery ?
					advancedFuzzySearch(menuSelectorItems, searchQuery) :
					menuSelectorItems;
			}

			// Handle menu selection and transition
			if (menuKey && menuState !== MENU_STATES.FUZZY) {
				handleMenuSelect(menuKey);
				return [getTransitionDummyItem(menuKey)]; // Return dummy item during transition
			}

			// Show fuzzy search results for specific menus
			if (menuKey) {
				setMenuState(MENU_STATES.FUZZY);
				setSelectedMenu(menuKey);

				let items: DefaultReactSuggestionItem[] = [];

				// Add menu-specific items with fuzzy search
				switch (menuKey) {
					case MENU_KEYS.TEMPLATES:
						items = searchQuery ?
							advancedFuzzySearch(templateItems, searchQuery) :
							templateItems;
						break;
					case MENU_KEYS.BLOCKS:
						items = searchQuery ?
							advancedFuzzySearch(filteredDefaultItems, searchQuery) :
							filteredDefaultItems;
						break;
				}

				return items;
			}

			// Fallback with fuzzy search
			return searchQuery ?
				advancedFuzzySearch(menuSelectorItems, searchQuery) :
				menuSelectorItems;
		},
		onItemClick: function(item) {
			// Handle regular item clicks
			item.onItemClick(editor);
		}
	});
}
