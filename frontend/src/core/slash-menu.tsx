import React from 'react';
import {
    getDefaultReactSlashMenuItems,
    SuggestionMenuController,
    DefaultReactSuggestionItem
} from '@blocknote/react';
import {
    BlockNoteEditor,
    filterSuggestionItems,
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

const insertTemplate = (editor: BlockNoteEditor, templateContent: any[], options: TemplateConfig) => {
    if (templateContent.length === 0) return;

    console.debug('MAX BLOCK OPTION', options.maxBlocks)
    console.debug('CHUNK SIZE', options.chunkSize)
    const MAX_BLOCKS = options.maxBlocks;
    const CHUNK_SIZE = options.chunkSize;

    // Hard limit check - insert error message
    if (templateContent.length > MAX_BLOCKS) {
        console.warn(`Template exceeds maximum size of ${MAX_BLOCKS} blocks (${templateContent.length} blocks)`);

        // Your existing error blocks code...
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

// Create template slash menu items
const createTemplateItems = (editor: BlockNoteEditor, templates: DocumentTemplate[], templateConfig: TemplateConfig): DefaultReactSuggestionItem[] =>
    templates.map(template => ({
        title: template.title,
        onItemClick: () => insertTemplate(editor, template.content, templateConfig), // Pass config here
        aliases: template.aliases,
        group: template.group,
        icon: getTemplateIcon(template.icon),
        subtext: template.subtext,
    }));

export function CustomSlashMenu({ editor, config, templates = [], templateConfig }: CustomSlashMenuProps) {
    // Get default slash menu items
    const defaultItems = getDefaultReactSlashMenuItems(editor);

    // Create template items - memoized to prevent recreation
    const templateItems = React.useMemo(() =>
        createTemplateItems(editor, templates, templateConfig),
        [editor, templates, templateConfig]
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
            console.debug('Custom Slash Menu Debug:', {
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
                    console.debug('Template mode activated with query:', templateQuery);
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
