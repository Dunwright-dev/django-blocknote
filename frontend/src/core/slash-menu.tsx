import React from 'react';
import {
	getDefaultReactSlashMenuItems,
	SuggestionMenuController,
	DefaultReactSuggestionItem
} from '@blocknote/react';
import {
	BlockNoteEditor,
	insertOrUpdateBlock,
} from '@blocknote/core';
import { getTemplateIcon } from '../utils/template-icons';
import type {
	SlashMenuConfig,
	TemplateConfig,
} from '../types';

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

interface CustomSlashMenuProps {
	editor: BlockNoteEditor;
	config?: SlashMenuConfig;
	templates?: DocumentTemplate[];
	templateConfig: TemplateConfig;
}

// Menu states with transition support
const MENU_STATES = {
	SELECTOR: 'selector',
	FUZZY: 'fuzzy',
	TRANSITIONING: 'transitioning'
} as const;

type MenuState = typeof MENU_STATES[keyof typeof MENU_STATES];

// Enhanced menu configurations with navigation hints
const MENU_OPTIONS = [
	{
		key: 'b',
		label: 'Blocks',
		description: 'Add basic content blocks',
		icon: '🧱',
		shortcut: 'b'
	},
	{
		key: 't',
		label: 'Templates',
		description: 'Insert document templates',
		icon: '📋',
		shortcut: 't'
	},
	// {
	// 	key: 'a',
	// 	label: 'Actions',
	// 	description: 'AI and custom actions',
	// 	icon: '⚡',
	// 	shortcut: 'a'
	// },
	// {
	// 	key: 'm',
	// 	label: 'Media',
	// 	description: 'Images, videos, embeds',
	// 	icon: '🎨',
	// 	shortcut: 'm'
	// }
];

// Navigation helpers
const NAVIGATION_HINTS = {
	BACK: '← Back to menu',
	CONTINUE: 'Continue typing to search...',
	SELECT: 'Press Enter to select'
};

// Transition dummy item generator
const getTransitionDummyItem = (targetMenu: string | null): DefaultReactSuggestionItem => {
	const menuOption = MENU_OPTIONS.find(opt => opt.key === targetMenu);

	return {
		title: targetMenu && menuOption ? `Loading ${menuOption.label}...` : 'Loading...',
		onItemClick: () => { }, // No-op during transition
		aliases: [],
		group: 'System',
		icon: '⏳', // You can change this to '🔄' for spinner effect
		subtext: 'Please wait...',
		content: 'transition-dummy'
	};
};

// Enhanced fuzzy search that filters on group, name/title, and aliases
const advancedFuzzySearch = (items: DefaultReactSuggestionItem[], query: string): DefaultReactSuggestionItem[] => {
	if (!query.trim()) {
		return items;
	}

	const searchQuery = query.toLowerCase().trim();
	const scoredItems = items.map(item => {
		let score = 0;
		const title = item.title.toLowerCase();
		const group = item.group?.toLowerCase() || '';
		const subtext = item.subtext?.toLowerCase() || '';
		const aliases = item.aliases?.map(a => a.toLowerCase()) || [];

		// Exact matches get highest score
		if (title === searchQuery) score += 100;
		if (aliases.includes(searchQuery)) score += 90;
		if (group === searchQuery) score += 80;

		// Prefix matches get high score
		if (title.startsWith(searchQuery)) score += 70;
		if (aliases.some(alias => alias.startsWith(searchQuery))) score += 60;
		if (group.startsWith(searchQuery)) score += 50;

		// Contains matches get medium score
		if (title.includes(searchQuery)) score += 40;
		if (aliases.some(alias => alias.includes(searchQuery))) score += 30;
		if (group.includes(searchQuery)) score += 25;
		if (subtext.includes(searchQuery)) score += 20;

		// Fuzzy character matching (for typos)
		const fuzzyScore = calculateFuzzyScore(title, searchQuery);
		score += fuzzyScore;

		return { item, score };
	})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);

	return scoredItems;
};

// Simple fuzzy scoring for typo tolerance
const calculateFuzzyScore = (text: string, query: string): number => {
	if (text.includes(query)) return 0; // Already handled above

	let score = 0;
	let queryIndex = 0;

	for (let i = 0; i < text.length && queryIndex < query.length; i++) {
		if (text[i] === query[queryIndex]) {
			score += 1;
			queryIndex++;
		}
	}

	// Return score only if we matched most of the query
	return queryIndex >= query.length * 0.7 ? score : 0;
};

const insertTemplate = (editor: BlockNoteEditor, templateContent: any[], options: TemplateConfig) => {
	if (templateContent.length === 0) return;

	console.debug('MAX BLOCK OPTION', options.maxBlocks)
	console.debug('CHUNK SIZE', options.chunkSize)

	const MAX_BLOCKS = options.maxBlocks;
	const CHUNK_SIZE = options.chunkSize;

	// Hard limit check - insert error message
	if (templateContent.length > MAX_BLOCKS) {
		console.warn(`Template exceeds maximum size of ${MAX_BLOCKS} blocks (${templateContent.length} blocks)`);

		const errorBlocks = [
			{
				id: `error-header-${Date.now()}`,
				type: 'heading',
				props: {
					textColor: 'red',
					backgroundColor: 'default',
					textAlignment: 'left',
					level: 2
				},
				content: [
					{
						type: 'text',
						text: '⚠️ Template Too Large',
						styles: {}
					}
				],
				children: []
			},
			{
				id: `error-desc-${Date.now()}`,
				type: 'paragraph',
				props: {
					textColor: 'default',
					backgroundColor: 'default',
					textAlignment: 'left'
				},
				content: [
					{
						type: 'text',
						text: `This template contains ${templateContent.length} blocks, which exceeds the maximum limit of ${MAX_BLOCKS} blocks.`,
						styles: {}
					}
				],
				children: []
			},
			{
				id: `error-solutions-header-${Date.now()}`,
				type: 'heading',
				props: {
					textColor: 'default',
					backgroundColor: 'default',
					textAlignment: 'left',
					level: 3
				},
				content: [
					{
						type: 'text',
						text: 'Suggested Solutions:',
						styles: {}
					}
				],
				children: []
			},
			{
				id: `error-solution-1-${Date.now()}`,
				type: 'bulletListItem',
				props: {
					textColor: 'default',
					backgroundColor: 'default',
					textAlignment: 'left'
				},
				content: [
					{
						type: 'text',
						text: 'Break this template into smaller, more focused templates',
						styles: {}
					}
				],
				children: []
			},
			{
				id: `error-solution-2-${Date.now()}`,
				type: 'bulletListItem',
				props: {
					textColor: 'default',
					backgroundColor: 'default',
					textAlignment: 'left'
				},
				content: [
					{
						type: 'text',
						text: 'Remove unnecessary formatting or empty blocks',
						styles: {}
					}
				],
				children: []
			},
			{
				id: `error-solution-3-${Date.now()}`,
				type: 'bulletListItem',
				props: {
					textColor: 'default',
					backgroundColor: 'default',
					textAlignment: 'left'
				},
				content: [
					{
						type: 'text',
						text: 'Contact your administrator to increase the template size limit',
						styles: {}
					}
				],
				children: []
			}
		];

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
		setTimeout(moveCursorToFirstEditablePosition, 50);
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
				setTimeout(insertNextChunk, 10);
			} else {
				// All chunks inserted - move cursor to first editable position
				setTimeout(moveCursorToFirstEditablePosition, 50);
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
		icon: option.icon,
		subtext: `${option.description} • Type "${option.shortcut}" to navigate`,
		content: option.key,
	}));

// Navigation helpers - keeping for potential future use
const KEYBOARD_HINTS = {
	NAVIGATION: 'Use Backspace or Esc to go back',
	SEARCH: 'Continue typing to search...',
	SELECT: 'Press Enter to select'
};

export function CustomSlashMenu({ editor, config, templates = [], templateConfig }: CustomSlashMenuProps) {
	// Enhanced state management with transition support
	const [menuState, setMenuState] = React.useState<MenuState>(MENU_STATES.SELECTOR);
	const [selectedMenu, setSelectedMenu] = React.useState<string | null>(null);
	const [previousQuery, setPreviousQuery] = React.useState<string>('');
	const [isTransitioning, setIsTransitioning] = React.useState<boolean>(false);

	// Debounced query state
	const [debouncedQuery, setDebouncedQuery] = React.useState<string>('');
	const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

	// Get default slash menu items
	const defaultItems = getDefaultReactSlashMenuItems(editor);

	// Create template items - memoized to prevent recreation
	const templateItems = React.useMemo(() =>
		createTemplateItems(editor, templates, templateConfig),
		[editor, templates, templateConfig]
	);

	// Smooth transition handlers
	const handleMenuSelect = React.useCallback((menuKey: string) => {
		setIsTransitioning(true);
		setMenuState(MENU_STATES.TRANSITIONING);

		// Smooth transition with timeout
		setTimeout(() => {
			setSelectedMenu(menuKey);
			setMenuState(MENU_STATES.FUZZY);
			setIsTransitioning(false);
		}, 150); // Quick transition
	}, []);

	const handleBackNavigation = React.useCallback(() => {
		setIsTransitioning(true);
		setMenuState(MENU_STATES.TRANSITIONING);

		// Smooth transition back
		setTimeout(() => {
			setSelectedMenu(null);
			setMenuState(MENU_STATES.SELECTOR);
			setIsTransitioning(false);
		}, 150);
	}, []);

	// Create menu selector items with callback
	const menuSelectorItems = React.useMemo(() =>
		createMenuSelectorItems(handleMenuSelect),
		[handleMenuSelect]
	);

	// Filter default items based on config
	const filteredDefaultItems = React.useMemo(() => {
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

	// Enhanced debounce with transition awareness
	const updateDebouncedQuery = React.useCallback((query: string) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Faster debounce during transitions for better UX
		const debounceTime = isTransitioning ? 100 : 200;

		timeoutRef.current = setTimeout(() => {
			setDebouncedQuery(query);
		}, debounceTime);
	}, [isTransitioning]);

	// Cleanup timeout on unmount
	React.useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	// Enhanced query parsing with transition support
	const parseQuery = React.useCallback((query: string) => {
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
	React.useEffect(() => {
		console.debug('Custom Slash Menu Debug:', {
			menuState,
			selectedMenu,
			isTransitioning,
			total_default_items: defaultItems.length,
			template_items: templateItems.length,
			filtered_items: filteredDefaultItems.length,
			menu_selector_items: menuSelectorItems.length,
			config: config,
		});
	}, [menuState, selectedMenu, isTransitioning, defaultItems, templateItems, filteredDefaultItems, menuSelectorItems, config]);

	return React.createElement(SuggestionMenuController, {
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

			console.debug('Enhanced Menu Query:', {
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
					case 't':
						items = searchQuery ?
							advancedFuzzySearch(templateItems, searchQuery) :
							templateItems;
						break;
					case 'b':
						items = searchQuery ?
							advancedFuzzySearch(filteredDefaultItems, searchQuery) :
							filteredDefaultItems;
						break;
					case 'a':
					case 'm':
						const comingSoonItems = [{
							title: `${MENU_OPTIONS.find(opt => opt.key === menuKey)?.label} Menu`,
							onItemClick: () => console.log(`${menuKey} menu coming soon...`),
							aliases: [],
							group: 'Coming Soon',
							icon: MENU_OPTIONS.find(opt => opt.key === menuKey)?.icon || '🔧',
							subtext: 'This menu is under development',
						}];
						items = searchQuery ?
							advancedFuzzySearch(comingSoonItems, searchQuery) :
							comingSoonItems;
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
