// frontend/src/editor.js - Fixed syntax for BlockNote 0.31.0 & React 19
import React from 'react';
import { createRoot } from 'react-dom/client';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';

console.log('Loading BlockNote 0.31.0 with React 19...');

// Error boundary for React 19
class BlockNoteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('BlockNote Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return React.createElement('div', {
                style: {
                    border: '2px solid #ff6b6b',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: '#fff5f5',
                    color: '#d63031'
                }
            }, [
                React.createElement('div', { 
                    key: 'header',
                    style: { marginBottom: '12px', fontWeight: '600' }
                }, '⚠️ Rich Text Editor Unavailable'),
                React.createElement('textarea', {
                    key: 'fallback',
                    placeholder: this.props.placeholder || 'Enter your content here...',
                    defaultValue: this.props.fallbackValue || '',
                    onChange: (e) => {
                        if (this.props.onChange) {
                            const content = e.target.value ? [{
                                id: 'fallback',
                                type: 'paragraph',
                                props: {},
                                content: [{ type: 'text', text: e.target.value }],
                                children: []
                            }] : [];
                            this.props.onChange(content);
                        }
                    },
                    style: {
                        width: '100%',
                        minHeight: '200px',
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontFamily: 'system-ui, sans-serif',
                        resize: 'vertical'
                    }
                }),
                React.createElement('details', { 
                    key: 'details',
                    style: { marginTop: '8px', fontSize: '12px' }
                }, [
                    React.createElement('summary', { key: 'summary' }, 'Error Details'),
                    React.createElement('pre', { 
                        key: 'error',
                        style: { fontSize: '11px', overflow: 'auto' }
                    }, this.state.error?.toString() || 'Unknown error')
                ])
            ]);
        }

        return this.props.children;
    }
}

// Main BlockNote Editor Component
function BlockNoteEditor({ 
    initialContent, 
    config = {}, 
    onChange = null, 
    readonly = false 
}) {
    console.log('Creating BlockNote 0.31.0 editor...');
    
    // Create editor with v0.31.0 API
    const editor = useCreateBlockNote({
        initialContent: initialContent || undefined,
        ...config
    });

    // Handle content changes - Fixed syntax
    const handleChange = React.useCallback(() => {
        if (onChange && !readonly && editor) {
            try {
                const content = editor.document;
                onChange(content);
                
                document.dispatchEvent(new CustomEvent('blocknote-change', {
                    detail: { content, editor }
                }));
            } catch (error) {
                console.warn('Error getting editor content:', error);
            }
        }
    }, [onChange, readonly, editor]);

    return React.createElement(BlockNoteView, { 
        editor,
        editable: !readonly,
        onChange: handleChange,
        theme: config.theme || 'light'
    });
}

// Safe wrapper with error boundary
function SafeBlockNoteEditor(props) {
    return React.createElement(BlockNoteErrorBoundary, {
        onChange: props.onChange,
        placeholder: props.config?.placeholder,
        fallbackValue: props.fallbackValue
    }, React.createElement(BlockNoteEditor, props));
}

// Widget initialization function
function initWidgetWithData(editorId, config = {}, initialContent = null) {
    console.log('Initializing BlockNote widget:', editorId);
    
    const container = document.getElementById(editorId + '_editor');
    const textarea = document.getElementById(editorId);
    
    if (!container || !textarea) {
        console.error('Elements not found for editor:', editorId);
        return;
    }

    // Process initial content
    let processedContent
