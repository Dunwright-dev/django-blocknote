import json
import os
from django import template
from django.utils.safestring import mark_safe
from django.conf import settings
from django.contrib.staticfiles import finders
from django.templatetags.static import static
from django_blocknote.assets import get_vite_asset

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

    html = f"""
    <!-- React {version} ({"development" if dev else "production"}) -->
    <script crossorigin src="{react_js}"></script>
    <script crossorigin src="{react_dom_js}"></script>
    """
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

    return mark_safe(react_html)


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
    Uses Vite asset resolution for proper hashed filenames
    Usage:
        {% blocknote_media %}
    """
    # Get the actual asset URLs using Vite manifest
    css_url = static(get_vite_asset("blocknote.css"))
    js_url = static(get_vite_asset("blocknote.js"))

    html = f"""
    <link rel="stylesheet" href="{css_url}">
    <script src="{js_url}"></script>
    """

    if getattr(settings, "DEBUG", False):
        html += f"""
        <!-- Debug: CSS from {get_vite_asset("blocknote.css")} -->
        <!-- Debug: JS from {get_vite_asset("blocknote.js")} -->
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
            
            // Check if assets loaded correctly
            const cssLoaded = Array.from(document.styleSheets).some(sheet => 
                sheet.href && sheet.href.includes('blocknote')
            );
            console.log('BlockNote CSS loaded:', cssLoaded);
            
            // Log current static files URLs for debugging
            console.log('Asset paths used:');
            console.log('  CSS:', document.querySelector('link[href*="blocknote"]')?.href);
            console.log('  JS:', 'Loaded via script tag');
            
            console.groupEnd();
        });
        </script>
        """

    return mark_safe(deps + media + debug)


@register.simple_tag
def blocknote_asset_debug():
    """
    Debug template tag to show asset resolution info
    Usage:
        {% blocknote_asset_debug %}
    """
    if not getattr(settings, "DEBUG", False):
        return ""

    css_asset = get_vite_asset("blocknote.css")
    js_asset = get_vite_asset("blocknote.js")
    css_url = static(css_asset)
    js_url = static(js_asset)

    # Try to find manifest
    manifest_path = finders.find("django_blocknote/.vite/manifest.json")
    manifest_exists = manifest_path is not None

    html = f"""
    <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 1rem; margin: 1rem 0; font-family: monospace; font-size: 0.875rem;">
        <h4>🔧 BlockNote Asset Debug</h4>
        <p><strong>Manifest found:</strong> {manifest_exists}</p>
        {f'<p><strong>Manifest path:</strong> {manifest_path}</p>' if manifest_exists else ''}
        <p><strong>CSS asset:</strong> {css_asset}</p>
        <p><strong>CSS URL:</strong> {css_url}</p>
        <p><strong>JS asset:</strong> {js_asset}</p>
        <p><strong>JS URL:</strong> {js_url}</p>
        <p><strong>STATIC_URL:</strong> {settings.STATIC_URL}</p>
        <p><strong>STATICFILES_DIRS:</strong> {getattr(settings, 'STATICFILES_DIRS', [])}</p>
    </div>
    """

    return mark_safe(html)


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
