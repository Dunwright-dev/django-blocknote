export interface TemplateConfig {
    maxBlocks: number;
    chunkSize: number;
}
export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
    maxBlocks: 3000,
    chunkSize: 500,
};
