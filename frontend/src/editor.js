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
    let processedContent = null;
    if (initialContent && Array.isArray(initialContent) && initialContent.length > 0) {
        processedContent = initialContent;
    }
    
    // Extract fallback text
    let fallbackText = '';
    if (processedContent) {
        try {
            fallbackText = processedContent
                .map(block => {
                    if (block.content && Array.isArray(block.content)) {
                        return block.content
                            .filter(item => item.type === 'text')
                            .map(item => item.text || '')
                            .join('');
                    }
                    return '';
                })
                .join('\n');
        } catch (e) {
            console.log('Could not extract fallback text');
        }
    }

    // Change handler
    const handleChange = (content) => {
        try {
            textarea.value = JSON.stringify(content || []);
            textarea.dispatchEvent(new Event('change', { bubbles: true }));
        } catch (error) {
            console.error('Error updating textarea:', error);
        }
    };

    try {
        const element = React.createElement(SafeBlockNoteEditor, {
            initialContent: processedContent,
            config: {
                ...config,
                defaultStyles: true,
                trailingBlock: true
            },
            onChange: handleChange,
            readonly: false,
            fallbackValue: fallbackText
        });

        const root = createRoot(container);
        root.render(element);
        
        console.log('BlockNote widget rendered successfully');
        
        // Visual feedback
        setTimeout(() => {
            const hasTextarea = container.querySelector('textarea');
            if (!hasTextarea) {
                container.style.transition = 'background-color 0.3s';
                container.style.backgroundColor = '#f0f9ff';
                setTimeout(() => {
                    container.style.backgroundColor = '';
                }, 1000);
                console.log('BlockNote editor loaded successfully');
            } else {
                console.log('BlockNote fallback editor active');
            }
        }, 100);
        
    } catch (error) {
        console.error('Critical widget initialization error:', error);
        
        // Ultimate fallback
        container.innerHTML = `
            <div style="border: 2px solid #ef4444; padding: 16px; border-radius: 8px; background: #fef2f2;">
                <div style="font-weight: 600; margin-bottom: 8px; color: #dc2626;">
                    ⚠️ Editor Initialization Failed
                </div>
                <textarea 
                    placeholder="${config.placeholder || 'Enter your content here...'}"
                    style="width: 100%; min-height: 200px; padding: 12px; border: 1px solid #d1d5db; border-radius: 4px; font-family: system-ui;"
                    oninput="
                        const content = this.value ? [{
                            id: 'fallback-' + Date.now(),
                            type: 'paragraph',
                            props: {},
                            content: [{ type: 'text', text: this.value }],
                            children: []
                        }] : [];
                        document.getElementById('${editorId}').value = JSON.stringify(content);
                        document.getElementById('${editorId}').dispatchEvent(new Event('change', { bubbles: true }));
                    "
                >${fallbackText}</textarea>
            </div>
        `;
    }
}

// Legacy compatibility function
function initWidget(editorId) {
    const container = document.getElementById(editorId + '_editor');
    if (!container) {
        console.error('Container not found for legacy init:', editorId);
        return;
    }

    try {
        let config = {};
        let initialContent = null;
        
        if (container.dataset.config) {
            config = JSON.parse(container.dataset.config);
        }
        
        if (container.dataset.initialContent) {
            const parsed = JSON.parse(container.dataset.initialContent);
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
                initialContent = parsed;
            }
        }
        
        initWidgetWithData(editorId, config, initialContent);
        
    } catch (error) {
        console.error('Legacy widget initialization error:', error);
        initWidgetWithData(editorId, {}, null);
    }
}

// Read-only renderer
function renderReadOnly(container, content) {
    if (!container) return;
    
    try {
        const element = React.createElement(BlockNoteEditor, {
            initialContent: content || undefined,
            config: { theme: 'light' },
            onChange: null,
            readonly: true
        });
        
        const root = createRoot(container);
        root.render(element);
        
    } catch (error) {
        console.error('Read-only render error:', error);
        
        const textContent = content ? content
            .map(block => block.content
                ?.filter(item => item.type === 'text')
                ?.map(item => item.text)
                ?.join('') || ''
            ).join('\n') : '';
            
        container.innerHTML = `
            <div style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
                <pre style="font-family: system-ui; white-space: pre-wrap; margin: 0;">${textContent || 'No content'}</pre>
            </div>
        `;
    }
}

// Export to window
if (typeof window !== 'undefined') {
    window.DjangoBlockNote = {
        initWidget,
        initWidgetWithData,
        renderReadOnly
    };
    console.log('DjangoBlockNote 0.31.0 ready');
}

// ES6 exports
export { initWidget, initWidgetWithData, renderReadOnly };
