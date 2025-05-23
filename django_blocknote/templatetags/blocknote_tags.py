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

    # Add BlockNote readiness check
    check_script = """
    <script>
    // Ensure React is loaded before BlockNote initializes
    window.blockNoteReady = function(callback) {
        if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
            callback();
        } else {
            setTimeout(function() { window.blockNoteReady(callback); }, 50);
        }
    };
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
    html = """
    <link rel="stylesheet" href="{% load static %}{% static 'django_blocknote/css/blocknote.css' %}">
    <script src="{% load static %}{% static 'django_blocknote/js/blocknote.js' %}"></script>
    """

    return mark_safe(html)
