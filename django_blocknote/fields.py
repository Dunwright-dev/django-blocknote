from django.conf import settings
import json
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models

from .widgets import BlockNoteWidget


class BlockNoteField(models.JSONField):
    """A field for storing BlockNote editor content."""

    def __init__(self, config=None, *args, **kwargs):
        # Apply field defaults from settings
        self.config = config or {}

        blocknote_settings = getattr(settings, "DJANGO_BLOCKNOTE", {})
        field_config = blocknote_settings.get("FIELD_CONFIG", {})

        # Apply defaults that aren't already specified
        for key, default_value in field_config.items():
            kwargs.setdefault(key, default_value)

        kwargs.setdefault("encoder", DjangoJSONEncoder)
        super().__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        kwargs["widget"] = BlockNoteWidget(config=self.config)
        return super().formfield(**kwargs)

    # INFO: Ready for apps settings when done
    # def formfield(self, **kwargs):
    #     # Get widget config from settings
    #     widget_config = kwargs.pop("widget_config", None)
    #
    #     if widget_config:
    #         kwargs.setdefault("widget", BlockNoteWidget(config=self.config))
    #     else:
    #         kwargs.setdefault("widget", BlockNoteWidget())
    #
    #     return super().formfield(**kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return value
        return value


# class BlockNoteField(models.JSONField):
#     """Model field for storing BlockNote content"""
#
#     def __init__(self, config=None, *args, **kwargs):
#         self.config = config or {}
#         super().__init__(*args, **kwargs)
#
#     def formfield(self, **kwargs):
#         kwargs["widget"] = BlockNoteWidget(config=self.config)
#         return super().formfield(**kwargs)
#
#     def from_db_value(self, value, expression, connection):
#         if value is None:
#             return value
#         if isinstance(value, str):
#             try:
#                 return json.loads(value)
#             except (TypeError, ValueError):
#                 return value
#         return value
