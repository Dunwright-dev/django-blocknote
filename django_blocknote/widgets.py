from django import forms
from django.utils.safestring import mark_safe
from django.core.serializers.json import DjangoJSONEncoder
import json
import uuid


class BlockNoteWidget(forms.Textarea):
    template_name = "django_blocknote/widgets/blocknote.html"

    class Media:
        css = {"all": ("django_blocknote/css/blocknote.css",)}
        js = ("django_blocknote/js/blocknote.js",)

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
        config_json = json.dumps(self.config, cls=DjangoJSONEncoder)
        initial_content = self.format_value(value)
        initial_content_json = json.dumps(initial_content, cls=DjangoJSONEncoder)

        context["widget"]["config_json"] = mark_safe(config_json)
        context["widget"]["initial_content_json"] = mark_safe(initial_content_json)
        context["widget"]["editor_id"] = widget_id

        # Debug output
        print(f"Widget context: config={config_json}, content={initial_content_json}")

        return context
