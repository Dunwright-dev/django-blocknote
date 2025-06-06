export interface SlashMenuConfig {
    enabled?: boolean;
    mode?: 'default' | 'filtered' | 'custom';
    disabled_items?: string[];
    custom_items?: any[]; // For future use
}

