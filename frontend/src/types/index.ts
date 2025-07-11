import { type } from 'os';

// Re-export all types from individual files
export type {
    BaseUploadConfig,
    DocumentUploadConfig, // Future use, not implemented yet
    ImageUploadConfig,
    UploadConfig, // Union type
    UploadError,
    UploadQueueItem,
    UploadState,
    UseBlockNoteUploadReturn,
    VideoUploadConfig,  // Future use, not implemented yet
} from './upload';

export type {
    BaseRemovalConfig,
    DocumentRemovalConfig,  // Future use, not implemented yet
    ImageRemovalConfig,
    RemovalConfig, // Union type
    RemovalError,
    RemovalQueueItem,
    UseBlockNoteRemovalReturn,
    VideoRemovalConfig,  // Future use, not implemented yet,
} from './removal';

export type {
    BlockNoteDictionary,
    DjangoEditorConfig,
    EditorConfig,
} from './editorConfig';

export type {
    DjangoUploadResponse,
    DjangoUploadError,
    CsrfTokenSource,
    DjangoRemovalError,
    DjangoRemovalResponse,

} from './django';

export type {
    SlashMenuConfig,
} from './slash-menu';

export type {
    DocumentTemplate,
} from './document_template';

export type {
    TemplateConfig,
} from './templateConfig';

export {
    DEFAULT_TEMPLATE_CONFIG,
} from './templateConfig';



