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
        image_removal_config=None,
        menu_type="default",
        attrs=None,
    ):
        self.editor_config = editor_config or {}
        self.image_upload_config = image_upload_config or {}
        self.image_removal_config = image_removal_config or {}
        self.menu_type = menu_type

        logger.debug(
            event="widget_init",
            msg="BlockNote widget initialized",
            data={
                "image_upload_config": self.image_upload_config,
                "image_removal_config": self.image_removal_config,
                "editor_config": self.editor_config,
                "menu_type": self.menu_type,  # Log the menu type being used
            },
        )

        default_attrs = {"class": "django-blocknote-editor"}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def get_image_removal_config(self):
        """
        Get removal configuration with proper precedence:
        1. Widget config (from __init__) - highest priority
        2. Settings config - fallback
        3. Django URL resolution - only if no explicit URL provided
        """
        # Start with global settings
        base_config = getattr(settings, "DJ_BN_IMAGE_REMOVAL_CONFIG", {}).copy()

        # Apply widget-specific overrides (highest priority)
        base_config.update(self.image_removal_config)

        # Only try URL resolution if no explicit URL was provided
        if "removalURL" not in base_config:
            try:
                base_config["removalURL"] = reverse("django_blocknote:remove_image")
            except NoReverseMatch:
                logger.exception(
                    event="url_resolution_failed",
                    msg="No removal URL configured and django_blocknote URLs not included",  # noqa: E501
                    data={"url_name": "django_blocknote:remove_image"},
                )

        logger.debug(
            event="get_image_removal_config",
            msg="Using removal config with widget overrides",
            data={"config": base_config},
        )
        return base_config

    def get_image_upload_config(self):
        """
        Get upload configuration with proper precedence:
        1. Widget config (from __init__) - highest priority
        2. Settings config - fallback
        3. Django URL resolution - only if no explicit URL provided
        """
        # Start with global settings
        base_config = getattr(settings, "DJ_BN_IMAGE_UPLOAD_CONFIG", {}).copy()

        # Apply widget-specific overrides (highest priority)
        base_config.update(self.image_upload_config)

        # Only try URL resolution if no explicit URL was provided
        if "uploadUrl" not in base_config:
            try:
                base_config["uploadUrl"] = reverse("django_blocknote:upload_image")
            except NoReverseMatch:
                logger.exception(
                    event="url_resolution_failed",
                    msg="No upload URL configured and django_blocknote URLs not included",
                    data={"url_name": "django_blocknote:upload_image"},
                )

        logger.debug(
            event="get_image_upload_config",
            msg="Using upload config with widget overrides",
            data={"config": base_config},
        )
        return base_config

    def get_slash_menu_config(self):
        """
        Get slash menu configuration based on menu_type from global settings.
        Widget-specific config acts as override only.
        """
        # Get all configurations from settings
        all_configs = getattr(settings, "DJ_BN_SLASH_MENU_CONFIGS", {})

        # Get the specific config for this menu type
        if self.menu_type in all_configs:
            config = all_configs[self.menu_type].copy()
            msg = f"Found menu configuration for type: {self.menu_type}"
            logger.debug(
                event="get_slash_menu_config",
                msg=msg,
                data={"menu_type": self.menu_type, "config": config},
            )
        else:
            # Fallback to _default if menu_type not found
            config = all_configs.get("_default", {}).copy()
            msg = f"Menu type '{self.menu_type}' not found, using _default"
            logger.warning(
                event="get_slash_menu_config",
                msg=msg,
                data={
                    "requested_type": self.menu_type,
                    "available_types": list(all_configs.keys()),
                },
            )

        return config

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

        def safe_json_dump(data, fallback="{}"):
            """Convert data to JSON with error handling."""
            try:
                return json.dumps(data, cls=DjangoJSONEncoder, ensure_ascii=False)
            except (TypeError, ValueError):
                return fallback

        # Collect and serialize all config data
        configs = {
            "editor_config": self.editor_config.copy() if self.editor_config else {},
            "image_upload_config": self.get_image_upload_config(),
            "image_removal_config": self.get_image_removal_config(),
            "slash_menu_config": self.get_slash_menu_config(),
            "initial_content": self.format_value(value),
        }

        # Add all configs to context as JSON
        for key, config_data in configs.items():
            fallback = "[]" if key == "initial_content" else "{}"
            context["widget"][key] = safe_json_dump(config_data, fallback)

        # Add additional widget data
        context["widget"].update(
            {
                "editor_id": widget_id,
                "js_url": get_vite_asset("src/blocknote.ts"),
                "css_url": get_vite_asset("blocknote.css"),
            },
        )

        # Debug output in development
        if getattr(settings, "DEBUG", False):
            print(f"\n{'=' * 50}")  # noqa: T201
            print(f"🧩 BlockNote Widget Context: {widget_id}")  # noqa: T201
            print(f"{'=' * 50}")  # noqa: T201

            for key in configs:
                json_value = context["widget"][key]
                display_key = key.replace("_", " ").title()

                if key == "initial_content":
                    content_preview = (
                        json_value[:150] + "..."
                        if len(json_value) > 100
                        else json_value
                    )
                    print(f"📝 {display_key:.<20} {content_preview}")  # noqa: T201
                else:
                    print(f"⚙️  {display_key:.<20} {json_value}")  # noqa: T201

            print(f"📁 JS URL:............... {context['widget']['js_url']}")  # noqa: T201
            print(f"🎨 CSS URL:.............. {context['widget']['css_url']}")  # noqa: T201
            print(f"{'=' * 50}\n")  # noqa: T201

        return context
