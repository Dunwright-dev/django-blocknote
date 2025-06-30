// types/editorConfig.ts - Complete Unified Configuration Types

import { SlashMenuConfig } from '../types';

/**
 * BlockNote's complete dictionary structure
 * Based on the 'en' locale from BlockNote source
 */
export interface BlockNoteDictionary {
    placeholders: {
        default: string;
        heading: string;
        bulletListItem: string;
        numberedListItem: string;
        checkListItem: string;
        emptyDocument: string | null;
        new_comment: string;
        edit_comment: string;
        comment_reply: string;
    };
    slash_menu: {
        [key: string]: {
            title: string;
            subtext: string;
            aliases: string[];
            group: string;
        };
    };
    side_menu: {
        add_block_label: string;
        drag_handle_label: string;
    };
    file_blocks: Record<string, any>;
    drag_handle: Record<string, any>;
    table_handle: Record<string, any>;
    suggestion_menu: Record<string, any>;
    color_picker: Record<string, any>;
    formatting_toolbar: Record<string, any>;
    file_panel: Record<string, any>;
    link_toolbar: Record<string, any>;
    comments: Record<string, any>;
    generic: Record<string, any>;
}

/**
 * Complete BlockNote editor configuration
 * Extends your existing EditorConfig with Django-specific properties
 */
export interface EditorConfig {
    // Your existing properties
    /** Editor theme */
    theme?: 'light' | 'dark' | string;
    /** Available toolbar items */
    toolbar?: string[];
    /** Enable/disable spellcheck */
    spellCheck?: boolean;
    /** Placeholder text when editor is empty */
    placeholder?: string;
    /** Enable/disable animations */
    animations?: boolean;
    /** Default text alignment */
    defaultTextAlignment?: 'left' | 'center' | 'right' | 'justify';
    /** Enable/disable slash commands */
    slashCommands?: boolean;
    /** Custom block types */
    customBlocks?: Record<string, unknown>;
    /** Editor locale/language */
    locale?: string;
    /** Enable/disable collaborative editing */
    collaboration?: boolean;
    /** Font family */
    fontFamily?: string;
    /** Font size */
    fontSize?: number;
    /** Line height */
    lineHeight?: number;
    /** Slash menu configuration */
    slashMenuConfig?: SlashMenuConfig;

    // Django-specific extensions
    /** Placeholder specifically for headings */
    heading_placeholder?: string;
    /** Show image captions */
    showImageCaptions?: boolean;
    /** Allow image zoom */
    allowImageZoom?: boolean;
    /** Editor editability */
    isEditable?: boolean;
    /** Initial content for the editor */
    initialContent?: any[];
    /** File upload function */
    uploadFile?: (file: File) => Promise<string>;
    /** Complete BlockNote dictionary */
    dictionary?: BlockNoteDictionary;

    // Django internal properties (for processing)
    /** Django internal: readonly flag */
    _django_readonly?: boolean;
    /** Django internal: dictionary overrides for React processing */
    _django_dictionary_override?: Partial<BlockNoteDictionary>;
}

/**
 * Django-specific subset of EditorConfig
 * This is what Django developers actually use in their models
 */
export interface DjangoEditorConfig extends Pick<EditorConfig,
    | 'theme'
    | 'placeholder'
    | 'heading_placeholder'
    | 'animations'
    | 'showImageCaptions'
    | 'allowImageZoom'
    | 'isEditable'
    | 'dictionary'
    | '_django_readonly'
    | '_django_dictionary_override'
> { }

/**
 * Type alias for backward compatibility
 */
export type BlockNoteEditorConfig = EditorConfig;

/**
 * Default BlockNote dictionary values
 * This matches the 'en' locale structure from BlockNote source
 */
export const DEFAULT_BLOCKNOTE_DICTIONARY: BlockNoteDictionary = {
    placeholders: {
        default: "Enter text or type '/' for commands",
        heading: "Heading",
        bulletListItem: "List",
        numberedListItem: "List",
        checkListItem: "List",
        emptyDocument: null,
        new_comment: "Write a comment...",
        edit_comment: "Edit comment...",
        comment_reply: "Add comment..."
    },
    slash_menu: {
        heading: {
            title: "Heading 1",
            subtext: "Top-level heading",
            aliases: ["h", "heading1", "h1"],
            group: "Headings"
        },
        heading_2: {
            title: "Heading 2",
            subtext: "Key section heading",
            aliases: ["h2", "heading2", "subheading"],
            group: "Headings"
        },
        heading_3: {
            title: "Heading 3",
            subtext: "Subsection and group heading",
            aliases: ["h3", "heading3", "subheading"],
            group: "Headings"
        },
        quote: {
            title: "Quote",
            subtext: "Quote or excerpt",
            aliases: ["quotation", "blockquote", "bq"],
            group: "Basic blocks"
        },
        numbered_list: {
            title: "Numbered List",
            subtext: "List with ordered items",
            aliases: ["ol", "li", "list", "numberedlist", "numbered list"],
            group: "Basic blocks"
        },
        bullet_list: {
            title: "Bullet List",
            subtext: "List with unordered items",
            aliases: ["ul", "li", "list", "bulletlist", "bullet list"],
            group: "Basic blocks"
        },
        check_list: {
            title: "Check List",
            subtext: "List with checkboxes",
            aliases: ["ul", "li", "list", "checklist", "check list", "checked list", "checkbox"],
            group: "Basic blocks"
        },
        paragraph: {
            title: "Paragraph",
            subtext: "The body of your document",
            aliases: ["p", "paragraph"],
            group: "Basic blocks"
        },
        code_block: {
            title: "Code Block",
            subtext: "Code block with syntax highlighting",
            aliases: ["code", "pre"],
            group: "Basic blocks"
        },
        page_break: {
            title: "Page Break",
            subtext: "Page separator",
            aliases: ["page", "break", "separator"],
            group: "Basic blocks"
        },
        table: {
            title: "Table",
            subtext: "Table with editable cells",
            aliases: ["table"],
            group: "Advanced"
        },
        image: {
            title: "Image",
            subtext: "Resizable image with caption",
            aliases: ["image", "imageUpload", "upload", "img", "picture", "media", "url"],
            group: "Media"
        },
        video: {
            title: "Video",
            subtext: "Resizable video with caption",
            aliases: ["video", "videoUpload", "upload", "mp4", "film", "media", "url"],
            group: "Media"
        },
        audio: {
            title: "Audio",
            subtext: "Embedded audio with caption",
            aliases: ["audio", "audioUpload", "upload", "mp3", "sound", "media", "url"],
            group: "Media"
        },
        file: {
            title: "File",
            subtext: "Embedded file",
            aliases: ["file", "upload", "embed", "media", "url"],
            group: "Media"
        },
        emoji: {
            title: "Emoji",
            subtext: "Search for and insert an emoji",
            aliases: ["emoji", "emote", "emotion", "face"],
            group: "Others"
        }
    },
    side_menu: {
        add_block_label: "Add block",
        drag_handle_label: "Open block menu"
    },
    file_blocks: {},
    drag_handle: {},
    table_handle: {},
    suggestion_menu: {},
    color_picker: {},
    formatting_toolbar: {},
    file_panel: {},
    link_toolbar: {},
    comments: {},
    generic: {}
};

/**
 * Utility to validate Django config at runtime
 * @param config - Config to validate
 * @returns Validation result with type guards
 */
export function validateDjangoConfig(config: any): config is DjangoEditorConfig {
    if (!config || typeof config !== 'object') {
        return false;
    }

    // Check optional string properties
    const stringProps = ['placeholder', 'heading_placeholder', 'theme'] as const;
    for (const prop of stringProps) {
        if (config[prop] !== undefined && typeof config[prop] !== 'string') {
            console.warn(`Invalid ${prop}: expected string, got ${typeof config[prop]}`);
            return false;
        }
    }

    // Check boolean properties
    const boolProps = ['animations', 'showImageCaptions', 'allowImageZoom', 'isEditable'] as const;
    for (const prop of boolProps) {
        if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
            console.warn(`Invalid ${prop}: expected boolean, got ${typeof config[prop]}`);
            return false;
        }
    }

    return true;
}

/**
 * Type guard to check if config has Django-specific properties
 */
export function isDjangoConfig(config: EditorConfig): config is DjangoEditorConfig {
    return '_django_readonly' in config || '_django_dictionary_override' in config;
}

/**
 * Extract Django-compatible config from full EditorConfig
 */
export function extractDjangoConfig(config: EditorConfig): DjangoEditorConfig {
    const {
        theme,
        placeholder,
        heading_placeholder,
        animations,
        showImageCaptions,
        allowImageZoom,
        isEditable,
        dictionary,
        _django_readonly,
        _django_dictionary_override,
    } = config;

    return {
        theme,
        placeholder,
        heading_placeholder,
        animations,
        showImageCaptions,
        allowImageZoom,
        isEditable,
        dictionary,
        _django_readonly,
        _django_dictionary_override,
    };
}
