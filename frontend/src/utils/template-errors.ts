/**
 * Creates error blocks to display when a template exceeds the maximum size limit
 * 
 * @param templateLength - The actual number of blocks in the template
 * @param maxBlocks - The maximum allowed number of blocks
 * @returns Array of BlockNote blocks representing the error message
 */
export const createTemplateSizeErrorBlocks = (templateLength: number, maxBlocks: number) => {
	const timestamp = Date.now();
	return [
		{
			id: `error-header-${timestamp}`,
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
			id: `error-desc-${timestamp}`,
			type: 'paragraph',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: `This template contains ${templateLength} blocks, which exceeds the maximum limit of ${maxBlocks} blocks.`,
					styles: {}
				}
			],
			children: []
		},
		{
			id: `error-solutions-header-${timestamp}`,
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
			id: `error-solution-1-${timestamp}`,
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
			id: `error-solution-2-${timestamp}`,
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
			id: `error-solution-3-${timestamp}`,
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
};

/**
 * Creates error blocks to display when template insertion fails
 * 
 * @param templateTitle - The title of the template that failed
 * @param insertedBlocks - Number of blocks successfully inserted before failure
 * @param totalBlocks - Total number of blocks in the template
 * @param errorMessage - The error message from the insertion failure
 * @returns Array of BlockNote blocks representing the error message
 */
export const createTemplateInsertionErrorBlocks = (
	templateTitle: string,
	insertedBlocks: number,
	totalBlocks: number,
	errorMessage: string
) => {
	const timestamp = Date.now();
	return [
		{
			id: `insertion-error-header-${timestamp}`,
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
					text: '⚠️ Template Insertion Failed',
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-desc-${timestamp}`,
			type: 'paragraph',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: `Failed to insert template "${templateTitle}". Successfully inserted ${insertedBlocks} of ${totalBlocks} blocks before encountering an error.`,
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-technical-${timestamp}`,
			type: 'paragraph',
			props: {
				textColor: 'gray',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: `Technical details: ${errorMessage}`,
					styles: { italic: true }
				}
			],
			children: []
		},
		{
			id: `insertion-error-solutions-header-${timestamp}`,
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
					text: 'What you can do:',
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-solution-1-${timestamp}`,
			type: 'bulletListItem',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: 'Try inserting the template again',
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-solution-2-${timestamp}`,
			type: 'bulletListItem',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: 'Refresh the page and try again',
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-solution-3-${timestamp}`,
			type: 'bulletListItem',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: 'Check if the template data is properly formatted',
					styles: {}
				}
			],
			children: []
		},
		{
			id: `insertion-error-solution-4-${timestamp}`,
			type: 'bulletListItem',
			props: {
				textColor: 'default',
				backgroundColor: 'default',
				textAlignment: 'left'
			},
			content: [
				{
					type: 'text',
					text: 'Contact support if the problem persists',
					styles: {}
				}
			],
			children: []
		}
	];
};
