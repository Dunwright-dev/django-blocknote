// File: src/utils/editorConfig.ts (NEW FILE)
import React from 'react';
import { en } from '@blocknote/core/locales';
import {
    DjangoEditorConfig, EditorConfig
} from '../types/editorConfig';
/**
 * Type-safe deep merge utility
 * Handles all edge cases and provides fallbacks
 */
function deepMergeConfig(target: Record<string, any>, override: Record<string, any>): Record<string, any> {
    // Guard against null/undefined
    if (!target) target = {};
    if (!override) return target;

    const result = { ...target };

    for (const [key, value] of Object.entries(override)) {
        // Skip undefined/null values to preserve defaults
        if (value === undefined || value === null) {
            continue;
        }

        // Handle nested objects
        if (
            typeof value === 'object' &&
            !Array.isArray(value) &&
            value.constructor === Object &&  // Plain object check
            result[key] &&
            typeof result[key] === 'object'
        ) {
            result[key] = deepMergeConfig(result[key], value);
        } else {
            // Direct assignment for primitives, arrays, etc.
            result[key] = value;
        }
    }

    return result;
}

/**
 * Process Django editor config with robust error handling
 * @param rawConfig - Raw config from Django (could be malformed)
 * @returns Safe, processed config ready for BlockNote
 */
export function processDjangoEditorConfig(rawConfig: DjangoEditorConfig): EditorConfig {
    try {
        // Safety: Ensure we have a valid config object
        const config = rawConfig && typeof rawConfig === 'object' ? { ...rawConfig } : {};

        // Check for Django dictionary overrides
        const djangoOverrides = config._django_dictionary_override;

        if (djangoOverrides && typeof djangoOverrides === 'object') {
            // Safety: Ensure 'en' locale exists (fallback if BlockNote changes)
            const baseLocale = en && typeof en === 'object' ? en : {};

            // Merge Django overrides with BlockNote defaults
            config.dictionary = deepMergeConfig(baseLocale, djangoOverrides);

            // Clean up Django-specific properties
            delete config._django_dictionary_override;

            // Debug info in development
            if (process.env.NODE_ENV === 'development') {
                console.log('🔧 Merged Django config with BlockNote defaults', {
                    djangoOverrides,
                    finalDictionary: config.dictionary
                });
            }
        }

        return config;

    } catch (error) {
        // Graceful fallback: If anything goes wrong, return safe defaults
        console.warn('⚠️ Error processing Django editor config, using defaults:', error);
        return rawConfig || {};
    }
}

/**
 * React hook for processing Django config (optional - provides caching)
 * @param rawConfig - Raw config from Django
 * @returns Processed, memoized config
 */
export function useDjangoEditorConfig(rawConfig: DjangoEditorConfig): EditorConfig {
    return React.useMemo(() => {
        return processDjangoEditorConfig(rawConfig);
    }, [rawConfig]);
}
