from django.db import models
from django import forms
from .widgets import BlockNoteWidget
import json


class BlockNoteField(models.JSONField):
    """Model field for storing BlockNote content"""

    def __init__(self, config=None, *args, **kwargs):
        self.config = config or {}
        super().__init__(*args, **kwargs)

    def formfield(self, **kwargs):
        kwargs["widget"] = BlockNoteWidget(config=self.config)
        return super().formfield(**kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (TypeError, ValueError):
                return value
        return value
