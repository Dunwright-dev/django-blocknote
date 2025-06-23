import React from 'react';
import {
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    DefaultReactSuggestionItem
} from '@blocknote/react';
import { BlockNoteEditor, filterSuggestionItems, insertOrUpdateBlock } from '@blocknote/core';
import { getTemplateIcon } from '../utils/template-icons';
import type { SlashMenuConfig } from '../types';

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
    templates?: DocumentTemplate[]; // Add templates prop
}

// Function to insert template content
const insertTemplate = (editor: BlockNoteEditor, templateContent: any[]) => {
    templateContent.forEach((block, index) => {
        if (index === 0) {
            // Replace current block with first template block
            insertOrUpdateBlock(editor, block);
        } else {
            // Insert subsequent blocks after the current position
            editor.insertBlocks([block], editor.getTextCursorPosition().block, "after");
        }
    });
};

// Create template slash menu items
const createTemplateItems = (editor: BlockNoteEditor, templates: DocumentTemplate[]): DefaultReactSuggestionItem[] =>
    templates.map(template => ({
        title: template.title,
        onItemClick: () => insertTemplate(editor, template.content),
        aliases: template.aliases,
        group: template.group,
        icon: getTemplateIcon(template.icon),
        subtext: template.subtext,
    }));

export function CustomSlashMenu({ editor, config, templates = [] }: CustomSlashMenuProps) {
    // Get default slash menu items
    const defaultItems = getDefaultReactSlashMenuItems(editor);

    // Create template items - memoized to prevent recreation
    const templateItems = React.useMemo(() =>
        createTemplateItems(editor, templates), // Use passed templates instead of hardcoded
        [editor, templates]
    );

    // Filter items based on config
    const filteredItems = React.useMemo(function() {
        if (!config?.enabled || config.mode === 'default') {
            return defaultItems;
        }

        if (config.mode === 'filtered' && config.disabled_items) {
            return defaultItems.filter(function(item) {
                const shouldDisable = config.disabled_items!.some(function(disabledKey) {
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

        return defaultItems;
    }, [defaultItems, config]);

    // Debug logging in development
    React.useEffect(function() {
        if (process.env.NODE_ENV === 'development') {
            console.log('Custom Slash Menu Debug:', {
                total_default_items: defaultItems.length,
                template_items: templateItems.length,
                filtered_items: filteredItems.length,
                disabled_items: config?.disabled_items || [],
                config: config,
                templates: templates.map(t => ({ title: t.title, group: t.group }))
            });
        }
    }, [defaultItems, templateItems, filteredItems, config, templates]);

    // Combined menu with smart filtering for /t pattern
    return React.createElement(SuggestionMenuController, {
        triggerCharacter: "/",
        getItems: async function(query) {
            // Check if query starts with 't' (for /t functionality)
            if (query.toLowerCase().startsWith('t')) {
                // Remove the 't' and any following space, use the rest as template search query
                const templateQuery = query.slice(1).replace(/^\s+/, '');

                if (process.env.NODE_ENV === 'development') {
                    console.log('Template mode activated with query:', templateQuery);
                }

                return filterSuggestionItems(templateItems, templateQuery);
            }

            // Otherwise, use regular filtered items
            return filterSuggestionItems(filteredItems, query);
        },
        onItemClick: function(item) {
            item.onItemClick(editor);
        }
    });
}
