import type {
	DefaultReactSuggestionItem
} from '@blocknote/react';

/**
 * Simple fuzzy scoring algorithm for typo tolerance
 * Matches characters in sequence and returns a score based on how many characters matched
 */
const calculateFuzzyScore = (text: string, query: string): number => {
	if (text.includes(query)) return 0; // Already handled by exact/contains matching

	let score = 0;
	let queryIndex = 0;

	for (let i = 0; i < text.length && queryIndex < query.length; i++) {
		if (text[i] === query[queryIndex]) {
			score += 1;
			queryIndex++;
		}
	}

	// Return score only if we matched most of the query (70% threshold)
	return queryIndex >= query.length * 0.7 ? score : 0;
};

/**
 * Advanced fuzzy search that scores items based on multiple criteria:
 * - Exact matches (highest priority)
 * - Prefix matches 
 * - Contains matches
 * - Fuzzy character matching for typo tolerance
 * 
 * Searches across title, group, subtext, and aliases
 */
export const advancedFuzzySearch = (
	items: DefaultReactSuggestionItem[],
	query: string
): DefaultReactSuggestionItem[] => {
	if (!query.trim()) {
		return items;
	}

	const searchQuery = query.toLowerCase().trim();

	const scoredItems = items.map(item => {
		let score = 0;
		const title = item.title.toLowerCase();
		const group = item.group?.toLowerCase() || '';
		const subtext = item.subtext?.toLowerCase() || '';
		const aliases = item.aliases?.map(a => a.toLowerCase()) || [];

		// Exact matches get highest score
		if (title === searchQuery) score += 100;
		if (aliases.includes(searchQuery)) score += 90;
		if (group === searchQuery) score += 80;

		// Prefix matches get high score
		if (title.startsWith(searchQuery)) score += 70;
		if (aliases.some(alias => alias.startsWith(searchQuery))) score += 60;
		if (group.startsWith(searchQuery)) score += 50;

		// Contains matches get medium score
		if (title.includes(searchQuery)) score += 40;
		if (aliases.some(alias => alias.includes(searchQuery))) score += 30;
		if (group.includes(searchQuery)) score += 25;
		if (subtext.includes(searchQuery)) score += 20;

		// Fuzzy character matching (for typos)
		const fuzzyScore = calculateFuzzyScore(title, searchQuery);
		score += fuzzyScore;

		return { item, score };
	})
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.map(({ item }) => item);

	return scoredItems;
};
