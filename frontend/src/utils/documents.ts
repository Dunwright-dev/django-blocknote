/**
 * Find image URLs that were removed between two BlockNote documents
 * @param previousDoc Previous document state (array of blocks)
 * @param currentDoc Current document state (array of blocks)
 * @returns Array of image URLs that were removed
 */
export function findRemovedImages(
    previousDoc: any[] | null | undefined,
    currentDoc: any[] | null | undefined
): string[] {
    console.log('🔍 Finding removed images...');
    console.log('Previous doc blocks:', previousDoc?.length || 0);
    console.log('Current doc blocks:', currentDoc?.length || 0);

    // Handle edge cases
    if (!previousDoc || !Array.isArray(previousDoc)) {
        console.log('⚠️ No previous document, no removals to track');
        return [];
    }
    if (!currentDoc || !Array.isArray(currentDoc)) {
        const allPreviousUrls = extractImageUrls(previousDoc);
        console.log('⚠️ Current document empty/invalid, all previous images considered removed:', allPreviousUrls);
        return allPreviousUrls;
    }

    // Extract all image URLs from both documents
    const previousUrls = extractImageUrls(previousDoc);
    const currentUrls = extractImageUrls(currentDoc);

    console.log('📷 Previous image URLs:', previousUrls);
    console.log('📷 Current image URLs:', currentUrls);

    // Find URLs that exist in previous but not in current
    const removedUrls = previousUrls.filter(url => !currentUrls.includes(url));

    console.log('🗑️ Removed image URLs detected:', removedUrls);
    return removedUrls;
}

/**
 * Recursively extract all image URLs from a BlockNote document
 * @param blocks Array of BlockNote blocks
 * @returns Array of image URLs found in the document
 */
function extractImageUrls(blocks: any[]): string[] {
    const imageUrls: string[] = [];
    let imageBlockCount = 0;

    function processBlocks(blockArray: any[], depth: number = 0): void {
        const indent = '  '.repeat(depth);
        console.log(`${indent}🔍 Processing ${blockArray.length} blocks at depth ${depth}`);

        for (const block of blockArray) {
            // Check if this is an image block with a URL
            if (block.type === 'image' && block.props?.url) {
                imageBlockCount++;
                console.log(`${indent}📷 Found image block #${imageBlockCount}:`, {
                    id: block.id,
                    url: block.props.url,
                    name: block.props.name || 'unnamed'
                });
                imageUrls.push(block.props.url);
            }

            // Recursively process children blocks
            if (block.children && Array.isArray(block.children) && block.children.length > 0) {
                console.log(`${indent}📁 Processing ${block.children.length} children for block ${block.id}`);
                processBlocks(block.children, depth + 1);
            }
        }
    }

    processBlocks(blocks);
    console.log(`✅ Total images extracted: ${imageUrls.length}`);
    return imageUrls;
}
