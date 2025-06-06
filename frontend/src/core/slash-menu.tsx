import React from 'react';
import {
    getDefaultReactSlashMenuItems,
    SuggestionMenuController
} from '@blocknote/react';
import { BlockNoteEditor, filterSuggestionItems } from '@blocknote/core';
import type { SlashMenuConfig } from '../types';

interface CustomSlashMenuProps {
    editor: BlockNoteEditor;
    config?: SlashMenuConfig;
}

export function CustomSlashMenu({ editor, config }: CustomSlashMenuProps) {
    // Get default slash menu items
    const defaultItems = getDefaultReactSlashMenuItems(editor);

    // Filter items based on config
    const filteredItems = React.useMemo(function() {
        if (!config?.enabled || config.mode === 'default') {
            return defaultItems;
        }

        if (config.mode === 'filtered' && config.disabled_items) {
            return defaultItems.filter(function(item) {
                // Check if this item should be disabled
                const shouldDisable = config.disabled_items!.some(function(disabledKey) {
                    // Match against item key, title, name, or aliases
                    return (
                        (item.key && item.key.includes(disabledKey)) ||
                        (item.title && item.title.toLowerCase().includes(disabledKey.toLowerCase())) ||
                        (item.name && item.name.toLowerCase().includes(disabledKey.toLowerCase())) ||
                        (item.aliases && item.aliases.some(function(alias) {
                            return alias.toLowerCase().includes(disabledKey.toLowerCase());
                        }))
                    );
                });
                return !shouldDisable;
            });
        }

        // Future: handle 'custom' mode here
        return defaultItems;
    }, [defaultItems, config]);

    // Debug logging in development
    React.useEffect(function() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Custom Slash Menu Debug:', {
                total_items: defaultItems.length,
                filtered_items: filteredItems.length,
                disabled_items: config?.disabled_items || [],
                config: config,
                available_items: defaultItems.map(function(item) {
                    return {
                        key: item.key,
                        title: item.title,
                        name: item.name,
                        aliases: item.aliases
                    };
                })
            });
        }
    }, [defaultItems, filteredItems, config]);

    return React.createElement(SuggestionMenuController, {
        triggerCharacter: "/",
        getItems: async function(query) {
            // Start with our filtered items (based on config)
            const baseItems = filteredItems;

            // Use BlockNote's built-in filtering function
            // This handles the search query filtering properly
            return filterSuggestionItems(baseItems, query);
        },
        onItemClick: function(item) {
            item.onItemClick(editor);
        }
    });
}
