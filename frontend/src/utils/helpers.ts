// Utility functions for BlockNote integration

/**
 * Check if React and ReactDOM are ready for use
 */
export function checkReady(): boolean {
    return typeof React !== 'undefined' && typeof ReactDOM !== 'undefined';
}

/**
 * Safely get element by ID with type assertion
 */
export function getElementById<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
}

/**
 * Safely parse JSON with fallback
 */
export function safeJsonParse<T>(text: string, fallback: T): T {
    try {
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Generate unique ID for editors
 */
export function generateEditorId(): string {
    return `blocknote_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if element is visible in viewport
 */
export function isElementVisible(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.top >= 0 && rect.left >= 0 && 
           rect.bottom <= window.innerHeight && 
           rect.right <= window.innerWidth;
}
