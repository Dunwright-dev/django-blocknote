import { BlockNoteEditor } from '@blocknote/core';
import { createTemplateSizeErrorBlocks } from './template-errors';
import type { TemplateConfig } from '../types';

// Timing constants
const CURSOR_POSITIONING_DELAY = 50;
const CHUNK_INSERTION_DELAY = 10;

export const insertTemplate = (editor: BlockNoteEditor, templateContent: any[], options: TemplateConfig) => {
	console.debug('🔧 Template insertion started:', { blocks: templateContent.length });
	if (templateContent.length === 0) return;

	const MAX_BLOCKS = options.maxBlocks;
	const CHUNK_SIZE = options.chunkSize;

	// Hard limit check - insert error message
	if (templateContent.length > MAX_BLOCKS) {
		console.warn(`Template exceeds maximum size of ${MAX_BLOCKS} blocks (${templateContent.length} blocks)`);
		const errorBlocks = createTemplateSizeErrorBlocks(templateContent.length, MAX_BLOCKS);
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
		setTimeout(moveCursorToFirstEditablePosition, CURSOR_POSITIONING_DELAY);
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
				setTimeout(insertNextChunk, CHUNK_INSERTION_DELAY);
			} else {
				// All chunks inserted - move cursor to first editable position
				setTimeout(moveCursorToFirstEditablePosition, CURSOR_POSITIONING_DELAY);
			}
		};

		insertNextChunk();
	}
};