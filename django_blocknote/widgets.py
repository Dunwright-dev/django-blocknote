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
        Get removal configuration with sensible defaults.
        """
        image_removal_config = self.image_removal_config.copy()

        # Set default removal URL if not provided
        if "removalUrl" not in image_removal_config:
            try:
                image_removal_config["removalUrl"] = reverse(
                    "django_blocknote:remove_image",
                )
            except NoReverseMatch:
                # Fallback if URL pattern not configured
                image_removal_config["removalUrl"] = "/django-blocknote/remove-image/"

        # Set other defaults only if not already provided
        if "retryAttempts" not in image_removal_config:
            image_removal_config["retryAttempts"] = 3
        if "retryDelay" not in image_removal_config:
            image_removal_config["retryDelay"] = 1000
        if "timeout" not in image_removal_config:
            image_removal_config["timeout"] = 30000
        if "maxConcurrent" not in image_removal_config:
            image_removal_config["maxConcurrent"] = 1

        logger.debug(
            event="get_image_removal_config",
            msg="Show removal config values",
            data={
                "image_removal_config": image_removal_config,
            },
        )
        return image_removal_config

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

    def get_slash_menu_config(self):
        """
        Get slash menu configuration based on menu_type from global settings.
        No need for widget-specific config anymore - everything is in settings.
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

        # Ensure we have valid data structures
        editor_config = self.editor_config.copy() if self.editor_config else {}
        image_upload_config = self.get_image_upload_config()
        image_removal_config = self.get_image_removal_config()
        initial_content = self.format_value(value)
        slash_menu_config = self.get_slash_menu_config()

        try:
            image_removal_config_json = json.dumps(
                image_removal_config,
                cls=DjangoJSONEncoder,
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            image_removal_config_json = "{}"
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

        try:
            slash_menu_config_json = json.dumps(
                slash_menu_config,
                cls=DjangoJSONEncoder,
                ensure_ascii=False,
            )
        except (TypeError, ValueError):
            slash_menu_config_json = "{}"

        # TODO: Simplify, check for potential duplicates
        # Add data to context for template
        context["widget"]["editor_config"] = editor_config
        context["widget"]["editor_config_json"] = editor_config_json
        context["widget"]["image_upload_config"] = image_upload_config
        context["widget"]["image_upload_config_json"] = image_upload_config_json
        context["widget"]["image_removal_config"] = image_removal_config
        context["widget"]["image_removal_config_json"] = image_removal_config_json
        context["widget"]["slash_menu_config"] = slash_menu_config
        context["widget"]["slash_menu_config_json"] = slash_menu_config_json
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
            print(f"  Removal Config: {image_removal_config_json}")  # noqa: T201
            print(f"  Slash Menu Config: {slash_menu_config_json}")  # noqa: T201
            print(f"  Content: {initial_content_json[:100]}...")  # noqa: T201
            print(f"  JS URL: {context['widget']['js_url']}")  # noqa: T201
            print(f"  CSS URL: {context['widget']['css_url']}")  # noqa: T201

        return context
