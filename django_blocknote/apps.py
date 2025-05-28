from django.apps import AppConfig
from django.conf import settings


class DjangoBlockNoteConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "django_blocknote"
    verbose_name = "Django BlockNote"

    def ready(self):
        """Configure BlockNote settings with intelligent defaults."""
        self._configure_blocknote_settings()

    def _configure_blocknote_settings(self):
        """Set up BlockNote-specific settings with defaults."""
        default_blocknote_config = {
            "DEFAULT_CONFIG": {
                "placeholder": "Start writing...",
                "editable": True,
                "theme": "light",
                "animations": True,
                "collaboration": False,
            },
            "WIDGET_CONFIG": {
                "include_css": True,
                "include_js": True,
                "css_class": "django-blocknote-widget",
            },
            "FIELD_CONFIG": {
                "null": True,
                "blank": True,
                "default": dict,
            },
            "STATIC_URL": "/static/django_blocknote/",
            "DEBUG": getattr(settings, "DEBUG", False),
        }

        # Merge with user settings if they exist
        user_config = getattr(settings, "DJANGO_BLOCKNOTE", {})

        # Deep merge the configurations
        merged_config = self._deep_merge_dict(default_blocknote_config, user_config)

        # Set the final configuration
        settings.DJANGO_BLOCKNOTE = merged_config

    def _deep_merge_dict(self, default_dict, user_dict):
        """Recursively merge user configuration with defaults."""
        result = default_dict.copy()

        for key, value in user_dict.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = self._deep_merge_dict(result[key], value)
            else:
                result[key] = value

        return result
