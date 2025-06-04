/**
 * Configuration for BlockNote editor behavior and appearance
 */
export interface EditorConfig {
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
}
