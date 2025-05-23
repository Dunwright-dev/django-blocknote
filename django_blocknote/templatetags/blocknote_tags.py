from django import template
from django.utils.safestring import mark_safe
from django.conf import settings

register = template.Library()


@register.simple_tag
def load_react(version="18", dev=None):
    """
    Load React and ReactDOM from CDN

    Usage:
        {% load_react %}  # Production version 18
        {% load_react version="17" %}  # Specific version
        {% load_react dev=True %}  # Development version (auto-detected if DEBUG=True)
    """
    # Auto-detect development mode if not specified
    if dev is None:
        dev = getattr(settings, "DEBUG", False)

    # Choose development or production build
    if dev:
        react_js = f"https://unpkg.com/react@{version}/umd/react.development.js"
        react_dom_js = (
            f"https://unpkg.com/react-dom@{version}/umd/react-dom.development.js"
        )
    else:
        react_js = f"https://unpkg.com/react@{version}/umd/react.production.min.js"
        react_dom_js = (
            f"https://unpkg.com/react-dom@{version}/umd/react-dom.production.min.js"
        )

    html = f'''
    <!-- React {version} ({"development" if dev else "production"}) -->
    <script crossorigin src="{react_js}"></script>
    <script crossorigin src="{react_dom_js}"></script>
    '''

    return mark_safe(html)


@register.simple_tag
def load_blocknote_deps():
    """
    Load all BlockNote dependencies including React

    Usage:
        {% load_blocknote_deps %}
    """
    # Auto-detect development mode
    dev = getattr(settings, "DEBUG", False)

    # Load React first
    react_html = load_react(dev=dev)

    # Add BlockNote readiness check and initialization manager
    check_script = """
    <script>
    // Global BlockNote initialization manager
    window.BlockNoteManager = {
        isReady: false,
        pendingWidgets: [],
        
        // Check if dependencies are loaded
        checkReady: function() {
            return typeof React !== 'undefined' && 
                   typeof ReactDOM !== 'undefined' && 
                   typeof DjangoBlockNote !== 'undefined';
        },
        
        // Initialize a widget immediately or queue it
        initWidget: function(editorId, config, initialContent) {
            if (this.checkReady()) {
                console.log('✅ Initializing BlockNote widget immediately:', editorId);
                DjangoBlockNote.initWidgetWithData(editorId, config, initialContent);
            } else {
                console.log('⏳ Queueing BlockNote widget:', editorId);
                this.pendingWidgets.push({ editorId, config, initialContent });
            }
        },
        
        // Process all pending widgets
        processPending: function() {
            if (this.checkReady() && this.pendingWidgets.length > 0) {
                console.log('🚀 Processing', this.pendingWidgets.length, 'pending widgets');
                this.pendingWidgets.forEach(widget => {
                    DjangoBlockNote.initWidgetWithData(widget.editorId, widget.config, widget.initialContent);
                });
                this.pendingWidgets = [];
                this.isReady = true;
            }
        },
        
        // Auto-initialize widgets when content is added via HTMX
        scanForWidgets: function(rootElement = document) {
            const containers = rootElement.querySelectorAll('[data-editor-id]:not([data-blocknote-initialized])');
            containers.forEach(container => {
                const editorId = container.dataset.editorId;
                const textarea = document.getElementById(editorId);
                
                if (textarea && !container.dataset.blocknoteInitialized) {
                    container.dataset.blocknoteInitialized = 'true';
                    
                    // Get config and content from script tags (safer than data attributes)
                    let config = {};
                    let initialContent = null;
                    
                    try {
                        const configScript = document.getElementById(editorId + '_config');
                        if (configScript && configScript.textContent.trim()) {
                            config = JSON.parse(configScript.textContent);
                        }
                    } catch (e) {
                        console.warn('Error parsing widget config for', editorId, e);
                    }
                    
                    try {
                        const contentScript = document.getElementById(editorId + '_content');
                        if (contentScript && contentScript.textContent.trim()) {
                            const parsed = JSON.parse(contentScript.textContent);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                initialContent = parsed;
                            }
                        }
                    } catch (e) {
                        console.warn('Error parsing widget content for', editorId, e);
                    }
                    
                    this.initWidget(editorId, config, initialContent);
                }
            });
        }
    };
    
    // Initialize when dependencies are loaded
    function initBlockNote() {
        if (window.BlockNoteManager.checkReady()) {
            window.BlockNoteManager.processPending();
            window.BlockNoteManager.scanForWidgets();
        } else {
            setTimeout(initBlockNote, 100);
        }
    }
    
    // Start initialization process
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlockNote);
    } else {
        initBlockNote();
    }
    
    // HTMX integration - scan for new widgets after HTMX swaps content
    document.addEventListener('htmx:afterSwap', function(event) {
        console.log('🔄 HTMX content swapped, scanning for new BlockNote widgets');
        window.BlockNoteManager.scanForWidgets(event.detail.target);
    });
    
    // Also handle htmx:load for broader compatibility
    document.addEventListener('htmx:load', function(event) {
        console.log('📥 HTMX content loaded, scanning for BlockNote widgets');
        window.BlockNoteManager.scanForWidgets(event.detail.elt);
    });
    </script>
    """

    return mark_safe(react_html + check_script)


@register.inclusion_tag("django_blocknote/tags/react_debug.html")
def react_debug():
    """
    Show React debugging information (only in DEBUG mode)

    Usage:
        {% react_debug %}
    """
    return {"debug": getattr(settings, "DEBUG", False)}


@register.simple_tag
def blocknote_media():
    """
    Include BlockNote CSS and JS (without React dependencies)

    Usage:
        {% blocknote_media %}
    """
    from django.templatetags.static import static

    html = f"""
    <link rel="stylesheet" href="{static("django_blocknote/css/blocknote.css")}">
    <script src="{static("django_blocknote/js/blocknote.js")}"></script>
    """

    return mark_safe(html)


@register.simple_tag
def blocknote_full():
    """
    Load complete BlockNote setup (all dependencies + assets)

    Usage:
        {% blocknote_full %}
    """
    deps = load_blocknote_deps()
    media = blocknote_media()
    debug = ""

    if getattr(settings, "DEBUG", False):
        debug = """
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.group('🔧 BlockNote Full Setup Debug');
            console.log('React available:', typeof React !== 'undefined');
            console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');
            console.log('DjangoBlockNote available:', typeof DjangoBlockNote !== 'undefined');
            console.log('BlockNoteManager available:', typeof window.BlockNoteManager !== 'undefined');
            console.groupEnd();
        });
        </script>
        """

    return mark_safe(deps + media + debug)


# Add this to django_blocknote/templatetags/blocknote_tags.py


@register.inclusion_tag("django_blocknote/tags/blocknote_viewer.html")
def blocknote_viewer(content, container_id=None, css_class="blocknote-viewer"):
    """
    Render BlockNote content in read-only mode

    Usage:
        {% blocknote_viewer document.content %}
        {% blocknote_viewer document.content container_id="my-viewer" %}
        {% blocknote_viewer document.content css_class="custom-viewer" %}
    """
    import uuid
    import json
    from django.core.serializers.json import DjangoJSONEncoder

    # Generate unique container ID if not provided
    if not container_id:
        container_id = f"blocknote_viewer_{uuid.uuid4().hex[:8]}"

    # Serialize content safely
    content_json = "[]"
    if content:
        try:
            if isinstance(content, str):
                # Try to parse if it's a JSON string
                try:
                    parsed = json.loads(content)
                    content_json = json.dumps(
                        parsed, cls=DjangoJSONEncoder, ensure_ascii=False
                    )
                except json.JSONDecodeError:
                    # If parsing fails, treat as plain text and create a simple block
                    content_json = json.dumps(
                        [
                            {
                                "id": f"text_{uuid.uuid4().hex[:8]}",
                                "type": "paragraph",
                                "props": {},
                                "content": [{"type": "text", "text": content}],
                                "children": [],
                            }
                        ],
                        cls=DjangoJSONEncoder,
                    )
            elif isinstance(content, (list, dict)):
                content_json = json.dumps(
                    content, cls=DjangoJSONEncoder, ensure_ascii=False
                )
        except (TypeError, ValueError) as e:
            print(f"Error serializing BlockNote content: {e}")
            # Create a fallback block with error message
            content_json = json.dumps(
                [
                    {
                        "id": f"error_{uuid.uuid4().hex[:8]}",
                        "type": "paragraph",
                        "props": {},
                        "content": [
                            {"type": "text", "text": "Error displaying content"}
                        ],
                        "children": [],
                    }
                ],
                cls=DjangoJSONEncoder,
            )

    return {
        "container_id": container_id,
        "css_class": css_class,
        "content_json": content_json,
        "has_content": content is not None and content != "" and content != [],
    }


@register.simple_tag
def blocknote_viewer_deps():
    """
    Load minimal dependencies for BlockNote viewer (lighter than blocknote_full)

    Usage:
        {% blocknote_viewer_deps %}
    """
    from django.conf import settings
    from django.templatetags.static import static

    dev = getattr(settings, "DEBUG", False)

    # Choose React version
    if dev:
        react_js = "https://unpkg.com/react@18/umd/react.development.js"
        react_dom_js = "https://unpkg.com/react-dom@18/umd/react-dom.development.js"
    else:
        react_js = "https://unpkg.com/react@18/umd/react.production.min.js"
        react_dom_js = "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"

    html = f'''
    <!-- BlockNote Viewer Dependencies -->
    <script crossorigin src="{react_js}"></script>
    <script crossorigin src="{react_dom_js}"></script>
    <link rel="stylesheet" href="{static("django_blocknote/css/blocknote.css")}">
    <script src="{static("django_blocknote/js/blocknote.js")}"></script>
    
    <script>
    // Lightweight viewer manager
    window.BlockNoteViewerManager = {{
        viewers: new Map(),
        
        renderViewer: function(containerId, content) {{
            const container = document.getElementById(containerId);
            if (!container) {{
                console.error('BlockNote viewer container not found:', containerId);
                return;
            }}
            
            if (typeof DjangoBlockNote !== 'undefined' && typeof React !== 'undefined') {{
                try {{
                    // Hide loading placeholder
                    const loading = container.querySelector('.blocknote-loading');
                    if (loading) loading.style.display = 'none';
                    
                    // Render content
                    DjangoBlockNote.renderReadOnly(container, content);
                    this.viewers.set(containerId, {{ content, rendered: true }});
                    
                    console.log('✅ BlockNote viewer rendered:', containerId);
                }} catch (error) {{
                    console.error('Error rendering BlockNote viewer:', error);
                    this.showError(container, error);
                }}
            }} else {{
                console.log('⏳ BlockNote dependencies not ready, retrying...');
                setTimeout(() => this.renderViewer(containerId, content), 200);
            }}
        }},
        
        showError: function(container, error) {{
            container.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2;">
                    <div style="font-size: 1.5em; margin-bottom: 8px;">⚠️</div>
                    <div style="font-weight: 600;">Unable to display content</div>
                    <div style="font-size: 12px; margin-top: 8px; color: #991b1b;">
                        ${{error.toString()}}
                    </div>
                </div>
            `;
        }},
        
        // Auto-initialize all viewers on page
        initAll: function() {{
            const viewers = document.querySelectorAll('[data-blocknote-viewer]');
            viewers.forEach(viewer => {{
                const containerId = viewer.id;
                const contentScript = document.getElementById(containerId + '_content');
                
                if (contentScript && contentScript.textContent.trim()) {{
                    try {{
                        const content = JSON.parse(contentScript.textContent);
                        this.renderViewer(containerId, content);
                    }} catch (e) {{
                        console.error('Error parsing content for viewer:', containerId, e);
                        this.showError(viewer, e);
                    }}
                }}
            }});
        }}
    }};
    
    // Initialize when ready
    if (document.readyState === 'loading') {{
        document.addEventListener('DOMContentLoaded', () => window.BlockNoteViewerManager.initAll());
    }} else {{
        window.BlockNoteViewerManager.initAll();
    }}
    
    // Handle HTMX swaps
    document.addEventListener('htmx:afterSwap', function(event) {{
        setTimeout(() => window.BlockNoteViewerManager.initAll(), 100);
    }});
    </script>
    '''

    return mark_safe(html)
