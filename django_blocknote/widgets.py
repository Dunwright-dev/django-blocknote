from django import forms
from django.utils.safestring import mark_safe
from django.core.serializers.json import DjangoJSONEncoder
import json
import uuid


class BlockNoteWidget(forms.Textarea):
    template_name = "django_blocknote/widgets/blocknote.html"

    # Remove Media class - assets will be loaded via template tags
    # class Media:
    #     css = {"all": ("django_blocknote/css/blocknote.css",)}
    #     js = ("django_blocknote/js/blocknote.js",)

    def __init__(self, config=None, attrs=None):
        self.config = config or {}
        default_attrs = {"class": "django-blocknote-editor"}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def format_value(self, value):
        """Ensure we always return a valid BlockNote document structure"""
        if value is None or value == "":
            return []
        if isinstance(value, str):
            try:
                parsed = json.loads(value)
                return parsed if isinstance(parsed, list) else []
            except (json.JSONDecodeError, TypeError):
                return []
        if isinstance(value, list):
            return value
        return []

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        widget_id = attrs.get("id", f"blocknote_{uuid.uuid4().hex[:8]}")

        # Ensure we have valid data structures
        config = self.config.copy() if self.config else {}
        initial_content = self.format_value(value)

        # Serialize data for JavaScript consumption with proper escaping
        try:
            config_json = json.dumps(config, cls=DjangoJSONEncoder, ensure_ascii=False)
        except (TypeError, ValueError):
            config_json = "{}"

        try:
            initial_content_json = json.dumps(
                initial_content, cls=DjangoJSONEncoder, ensure_ascii=False
            )
        except (TypeError, ValueError):
            initial_content_json = "[]"

        # Add data to context for template
        context["widget"]["config"] = config
        context["widget"]["config_json"] = (
            config_json  # Don't use mark_safe here, let template handle escaping
        )
        context["widget"]["initial_content"] = initial_content
        context["widget"]["initial_content_json"] = (
            initial_content_json  # Don't use mark_safe here
        )
        context["widget"]["editor_id"] = widget_id

        # Debug output in development
        from django.conf import settings

        if getattr(settings, "DEBUG", False):
            print(f"BlockNote Widget Context: id={widget_id}")
            print(f"  Config: {config_json}")
            print(f"  Content: {initial_content_json[:100]}...")

        return context
