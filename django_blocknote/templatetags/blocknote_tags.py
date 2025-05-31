import json

from django import template
from django.conf import settings
from django.contrib.staticfiles import finders
from django.templatetags.static import static
from django.utils.safestring import mark_safe

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
    js_url = static(get_vite_asset("src/blocknote.ts"))

    html = f"""
    <link rel="stylesheet" href="{css_url}">
    <script src="{js_url}"></script>
    """

    if getattr(settings, "DEBUG", False):
        html += f"""
        <!-- Debug: CSS from {get_vite_asset("blocknote.css")} -->
        <!-- Debug: JS from {get_vite_asset("src/blocknote.ts")} -->
        """

    return mark_safe(html)


@register.simple_tag
def blocknote_form_validation():
    """
    Include BlockNote form validation script
    Usage:
        {% blocknote_form_validation %}
    """
    script = """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔧 BlockNote form validation initialized');

        // Find all forms that contain BlockNote textareas
        const formsWithBlockNote = document.querySelectorAll('form');

        formsWithBlockNote.forEach(form => {
            // Look for BlockNote textareas using multiple selectors
            const blockNoteTextareas = form.querySelectorAll(
                'textarea[id*="blocknote"], textarea[data-blocknote], textarea[id$="_editor"], .django-blocknote-wrapper textarea'
            );

            if (blockNoteTextareas.length > 0) {
                console.log(`📝 Found form with ${blockNoteTextareas.length} BlockNote field(s)`);

                form.addEventListener('submit', function(e) {
                    console.log('🔍 Validating BlockNote fields before form submission...');

                    let hasErrors = false;

                    blockNoteTextareas.forEach((textarea, index) => {
                        const value = textarea.value.trim();
                        const fieldName = textarea.name || textarea.id || `field_${index}`;

                        // If empty, set to valid empty array
                        if (!value) {
                            textarea.value = '[]';
                            console.log(`✅ Fixed empty textarea: ${fieldName}`);
                            return;
                        }

                        // Validate JSON
                        try {
                            const parsed = JSON.parse(value);
                            // Ensure it's an array
                            if (!Array.isArray(parsed)) {
                                throw new Error('Content must be an array');
                            }
                            console.log(`✅ Valid JSON for ${fieldName}`);
                        } catch (error) {
                            console.error(`❌ Invalid JSON in ${fieldName}:`, error);

                            // Try to fix common issues
                            try {
                                // If it's just text, wrap it in a paragraph block
                                const fixedContent = [{
                                    id: `fix-${Date.now()}-${index}`,
                                    type: 'paragraph',
                                    props: {},
                                    content: [{ type: 'text', text: value }],
                                    children: []
                                }];
                                textarea.value = JSON.stringify(fixedContent);
                                console.log(`🔧 Auto-fixed content for ${fieldName}`);
                            } catch (fixError) {
                                // Ultimate fallback
                                textarea.value = '[]';
                                console.log(`🔧 Reset to empty array: ${fieldName}`);
                            }
                        }
                    });

                    if (hasErrors) {
                        e.preventDefault();
                        alert('Please fix the errors in the form before submitting.');
                        return false;
                    }

                    console.log('✅ All BlockNote fields validated successfully');
                });
            }
        });

        // Also handle HTMX form submissions if present
        if (typeof htmx !== 'undefined') {
            document.addEventListener('htmx:beforeRequest', function(evt) {
                // Similar validation for HTMX requests
                const form = evt.target.closest('form');
                if (form) {
                    const blockNoteTextareas = form.querySelectorAll(
                        'textarea[id*="blocknote"], textarea[data-blocknote], textarea[id$="_editor"], .django-blocknote-wrapper textarea'
                    );

                    blockNoteTextareas.forEach(textarea => {
                        if (!textarea.value.trim()) {
                            textarea.value = '[]';
                        }
                    });
                }
            });
        }
    });
    </script>
    """

    return mark_safe(script)


@register.simple_tag
def blocknote_form_validation_debug():
    """
    Debug version that shows more information (only in DEBUG mode)
    Usage:
        {% blocknote_form_validation_debug %}
    """
    if not getattr(settings, "DEBUG", False):
        return blocknote_form_validation()  # Use regular version in production

    script = """
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        console.group('🔧 BlockNote Form Validation Debug');
        console.log('Initializing form validation...');

        const allForms = document.querySelectorAll('form');
        console.log(`Found ${allForms.length} total forms on page`);

        allForms.forEach((form, formIndex) => {
            const blockNoteTextareas = form.querySelectorAll(
                'textarea[id*="blocknote"], textarea[data-blocknote], textarea[id$="_editor"], .django-blocknote-wrapper textarea'
            );

            if (blockNoteTextareas.length > 0) {
                console.log(`📝 Form ${formIndex + 1}: Found ${blockNoteTextareas.length} BlockNote field(s)`);

                blockNoteTextareas.forEach((textarea, textareaIndex) => {
                    console.log(`  Field ${textareaIndex + 1}:`, {
                        id: textarea.id,
                        name: textarea.name,
                        value_length: textarea.value.length,
                        has_content: textarea.value.trim().length > 0
                    });
                });

                form.addEventListener('submit', function(e) {
                    console.group(`🔍 Validating Form ${formIndex + 1}`);

                    let hasErrors = false;

                    blockNoteTextareas.forEach((textarea, index) => {
                        const value = textarea.value.trim();
                        const fieldName = textarea.name || textarea.id || `field_${index}`;

                        console.log(`Checking field: ${fieldName}`);
                        console.log(`  Value length: ${value.length}`);

                        if (!value) {
                            textarea.value = '[]';
                            console.log(`  ✅ Fixed empty field`);
                            return;
                        }

                        try {
                            const parsed = JSON.parse(value);
                            if (!Array.isArray(parsed)) {
                                throw new Error('Content must be an array');
                            }
                            console.log(`  ✅ Valid JSON (${parsed.length} blocks)`);
                        } catch (error) {
                            console.error(`  ❌ Invalid JSON:`, error.message);

                            try {
                                const fixedContent = [{
                                    id: `fix-${Date.now()}-${index}`,
                                    type: 'paragraph',
                                    props: {},
                                    content: [{ type: 'text', text: value }],
                                    children: []
                                }];
                                textarea.value = JSON.stringify(fixedContent);
                                console.log(`  🔧 Auto-fixed content`);
                            } catch (fixError) {
                                textarea.value = '[]';
                                console.log(`  🔧 Reset to empty array`);
                            }
                        }
                    });

                    console.groupEnd();

                    if (hasErrors) {
                        e.preventDefault();
                        alert('Please fix the errors in the form before submitting.');
                        return false;
                    }
                });
            }
        });

        console.groupEnd();
    });
    </script>
    """

    return mark_safe(script)


@register.simple_tag
def blocknote_full(include_form_validation=True):
    """
    Load complete BlockNote setup (all dependencies + assets + form validation)
    Usage:
        {% blocknote_full %}  # Includes form validation
        {% blocknote_full include_form_validation=False %}  # Skip form validation
    """
    deps = load_blocknote_deps()
    media = blocknote_media()

    # Add form validation if requested
    form_validation = ""
    if include_form_validation:
        form_validation = blocknote_form_validation()

    debug = ""
    if getattr(settings, "DEBUG", False):
        debug = (
            """
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            console.group('🔧 BlockNote Full Setup Debug');
            console.log('React available:', typeof React !== 'undefined');
            console.log('ReactDOM available:', typeof ReactDOM !== 'undefined');
            console.log('DjangoBlockNote available:', typeof DjangoBlockNote !== 'undefined');
            console.log('BlockNoteManager available:', typeof window.BlockNoteManager !== 'undefined');
            console.log('Form validation included:', """
            + str(include_form_validation).lower()
            + """);

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
        )

    return mark_safe(deps + media + form_validation + debug)


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
    js_asset = get_vite_asset("src/blocknote.ts")
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
                        parsed,
                        cls=DjangoJSONEncoder,
                        ensure_ascii=False,
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
                            },
                        ],
                        cls=DjangoJSONEncoder,
                    )
            elif isinstance(content, (list, dict)):
                content_json = json.dumps(
                    content,
                    cls=DjangoJSONEncoder,
                    ensure_ascii=False,
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
                            {"type": "text", "text": "Error displaying content"},
                        ],
                        "children": [],
                    },
                ],
                cls=DjangoJSONEncoder,
            )

    return {
        "container_id": container_id,
        "css_class": css_class,
        "content_json": content_json,
        "has_content": content is not None and content != "" and content != [],
    }
