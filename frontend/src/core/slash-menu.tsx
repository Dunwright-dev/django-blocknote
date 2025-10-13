import React, { useMemo } from 'react';
import {
	getDefaultReactSlashMenuItems,
	SuggestionMenuController,
	DefaultReactSuggestionItem
} from '@blocknote/react';
import { BlockNoteEditor } from '@blocknote/core';
import { getTemplateIcon } from '../utils/template-icons';
import { insertTemplate } from '../utils/template-insertion';
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

// Custom implementation with menu structure but simplified state management
export function CustomSlashMenu({ editor, config, templates = [], templateConfig }: CustomSlashMenuProps) {
	
	// Create template items
	const templateItems = useMemo(() => {
		const items = templates.map(template => ({
			title: template.title,
			onItemClick: () => insertTemplate(editor, template.content, templateConfig),
			aliases: template.aliases || [],
			group: template.group || 'Templates',
			icon: getTemplateIcon(template.icon),
			subtext: template.subtext || '',
			size: "default" as const, // Add size property like default items
		}));
		

		
		return items;
	}, [templates, templateConfig, editor]);

	// Get filtered default items
	const defaultItems = useMemo(() => {
		const items = getDefaultReactSlashMenuItems(editor);
		

		
		if (!config?.enabled || config.mode === 'default') {
			return items;
		}
		if (config.mode === 'filtered' && config.disabled_items) {
			return items.filter(item => {
				const shouldDisable = config.disabled_items!.some(disabledKey => {
					return (
						(item.key && item.key.includes(disabledKey)) ||
						(item.title && item.title.toLowerCase().includes(disabledKey.toLowerCase())) ||
						(item.aliases && item.aliases.some(alias => 
							alias.toLowerCase().includes(disabledKey.toLowerCase())
						))
					);
				});
				return !shouldDisable;
			});
		}
		return items;
	}, [editor, config]);

	// Create menu selector items
	const menuSelectorItems = useMemo(() => {
		const items = MENU_OPTIONS.map(option => ({
			title: option.label,
			onItemClick: () => {}, // Will be handled by query parsing
			aliases: [option.key, option.shortcut],
			group: 'Menus',
			icon: option.icon(),
			subtext: option.description,
			badge: option.badge,
			size: "default" as const, // Add size property like default items
		}));
		

		
		return items;
	}, []);

	return (
		<SuggestionMenuController
			triggerCharacter="/"
			getItems={async (query) => {
				const trimmedQuery = query.trim();
				
				// Handle empty query - show menu selector
				if (!trimmedQuery) {
					return menuSelectorItems;
				}

				// Check for direct menu shortcuts (e.g., "t", "b")
				const menuOption = MENU_OPTIONS.find(option =>
					trimmedQuery.toLowerCase() === option.key.toLowerCase()
				);

				if (menuOption) {
					// Show specific menu items
					switch (menuOption.key) {
						case MENU_KEYS.TEMPLATES:
							return templateItems;
						case MENU_KEYS.BLOCKS:
							return defaultItems;
						default:
							return menuSelectorItems;
					}
				}

				// Check for fuzzy search within menu (e.g., "t search term")
				const firstChar = trimmedQuery[0].toLowerCase();
				const menuOptionByFirstChar = MENU_OPTIONS.find(option =>
					option.key.toLowerCase() === firstChar
				);

				if (menuOptionByFirstChar && trimmedQuery.length > 1) {
					const searchQuery = trimmedQuery.slice(1).trim();
					
					switch (menuOptionByFirstChar.key) {
						case MENU_KEYS.TEMPLATES:
							return templateItems.filter(item =>
								item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
								item.aliases?.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase()))
							);
						case MENU_KEYS.BLOCKS:
							return defaultItems.filter(item =>
								item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
								item.aliases?.some(alias => alias.toLowerCase().includes(searchQuery.toLowerCase()))
							);
					}
				}

				// Default to menu selector filtering
				return menuSelectorItems.filter(item =>
					item.title.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
					item.aliases?.some(alias => alias.toLowerCase().includes(trimmedQuery.toLowerCase()))
				);
			}}
			onItemClick={(item) => {
				item.onItemClick(editor);
			}}
		/>
	);
}