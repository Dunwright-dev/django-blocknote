import { RiFunctionLine, RiFileAddLine } from 'react-icons/ri';

/**
 * Menu key constants for slash menu navigation
 */
export const MENU_KEYS = {
	BLOCKS: 'b',
	TEMPLATES: 't'
} as const;

export type MenuKey = typeof MENU_KEYS[keyof typeof MENU_KEYS];

/**
 * Interface for menu option configuration
 */
export interface MenuOption {
	key: MenuKey;
	label: string;
	description: string;
	icon: () => JSX.Element;
	shortcut: string;
	badge?: string;
}

/**
 * Enhanced menu configurations with navigation hints
 * 
 * Each menu option defines:
 * - key: The internal identifier and keyboard shortcut
 * - label: Display name shown to users
 * - description: Brief explanation of what the menu contains
 * - icon: Function that returns a React icon component
 * - shortcut: Keyboard shortcut (usually same as key)
 * - badge: Keyboard shortcut badge to display
 */
export const MENU_OPTIONS: MenuOption[] = [
	{
		key: MENU_KEYS.BLOCKS,
		label: 'Blocks',
		description: 'Add basic content blocks',
		icon: () => <RiFunctionLine size={18} />,
		shortcut: MENU_KEYS.BLOCKS,
		badge: '/b'
	},
	{
		key: MENU_KEYS.TEMPLATES,
		label: 'Templates',
		description: 'Insert document templates',
		icon: () => <RiFileAddLine size={18} />,
		shortcut: MENU_KEYS.TEMPLATES,
		badge: '/t'
	}
];

/**
 * Helper function to find a menu option by key
 */
export const findMenuOption = (key: string): MenuOption | undefined => {
	return MENU_OPTIONS.find(option => option.key === key);
};

/**
 * Helper function to get all available menu keys
 */
export const getAllMenuKeys = (): MenuKey[] => {
	return MENU_OPTIONS.map(option => option.key);
};
