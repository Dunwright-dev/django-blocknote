import json
import uuid

import structlog
from django import forms
from django.conf import settings
from django.core.serializers.json import DjangoJSONEncoder
from django.urls import NoReverseMatch, reverse

from django_blocknote.assets import get_vite_asset

logger = structlog.get_logger(__name__)


class BlockNoteWidget(forms.Textarea):
    template_name = "django_blocknote/widgets/blocknote.html"

    def __init__(
        self,
        editor_config=None,
        image_upload_config=None,
        attrs=None,
    ):
        self.editor_config = editor_config or {}
        self.image_upload_config = image_upload_config or {}

        logger.debug(
            event="widget_init",
            msg="Show values from field",
            data={
                "image_upload_config": self.image_upload_config,
                "editor_config": self.editor_config,
            },
        )

        default_attrs = {"class": "django-blocknote-editor"}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    # TODO: This needs to align with the settings
    def get_image_upload_config(self):
        """\
        Get upload configuration with sensible defaults.
        """
        image_upload_config = self.image_upload_config.copy()

        # Set default upload URL if not provided
        if "uploadUrl" not in image_upload_config:
            try:
                image_upload_config["uploadUrl"] = reverse(
                    "django_blocknote:upload_image",
                )
            except NoReverseMatch:
                # Fallback if URL pattern not configured
                image_upload_config["uploadUrl"] = "/django-blocknote/upload-image/"

        # Set other defaults only if not already provided
        if "maxFileSize" not in image_upload_config:
            image_upload_config["maxFileSize"] = 10 * 1024 * 1024  # 10MB

        if "allowedTypes" not in image_upload_config:
            image_upload_config["allowedTypes"] = ["image/*"]

        if "showProgress" not in image_upload_config:
            image_upload_config["showProgress"] = False

        if "maxConcurrent" not in image_upload_config:
            image_upload_config["maxConcurrent"] = 3

            # img_model will be passed through if provided, no default needed
            logger.debug(
                event="get_image_upload_config",
                msg="Show values from field",
                data={
                    "image_upload_config": image_upload_config,
                    "editor_config": self.editor_config,
                },
            )

        return image_upload_config

    def format_value(self, value):
        """'\
        Ensure we always return a valid BlockNote document structure.
        """
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
        editor_config = self.editor_config.copy() if self.editor_config else {}
        image_upload_config = self.get_image_upload_config()
        initial_content = self.format_value(value)

        # Serialize data for JavaScript consumption with proper escaping
        try:
            editor_config_json = json.dumps(
                editor_config,
                cls=DjangoJSONEncoder,
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            editor_config_json = "{}"

        try:
            image_upload_config_json = json.dumps(
                image_upload_config,
                cls=DjangoJSONEncoder,
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            image_upload_config_json = "{}"

        try:
            initial_content_json = json.dumps(
                initial_content,
                cls=DjangoJSONEncoder,
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            initial_content_json = "[]"

        # TODO: Simplify, check for potential duplicates
        # Add data to context for template
        context["widget"]["editor_config"] = editor_config
        context["widget"]["editor_config_json"] = editor_config_json
        context["widget"]["image_upload_config"] = image_upload_config
        context["widget"]["image_upload_config_json"] = image_upload_config_json
        context["widget"]["initial_content"] = initial_content
        context["widget"]["initial_content_json"] = initial_content_json
        context["widget"]["editor_id"] = widget_id

        # Add hashed asset URLs to context for template use
        context["widget"]["js_url"] = get_vite_asset("src/blocknote.ts")
        context["widget"]["css_url"] = get_vite_asset("blocknote.css")

        # Debug output in development
        if getattr(settings, "DEBUG", False):
            print(f"BlockNote Widget Context: id={widget_id}")  # noqa: T201
            print(f"  Config: {editor_config_json}")  # noqa: T201
            print(f"  Upload Config: {image_upload_config_json}")  # noqa: T201
            print(f"  Content: {initial_content_json[:100]}...")  # noqa: T201
            print(f"  JS URL: {context['widget']['js_url']}")  # noqa: T201
            print(f"  CSS URL: {context['widget']['css_url']}")  # noqa: T201

        return context
