from django.contrib import admin
from django.template import Context, Template
from django.utils.html import format_html

from django_blocknote.models import UnusedImageURLS

from .fields import BlockNoteField


@admin.register(UnusedImageURLS)
class UnusedImageURLSAdmin(admin.ModelAdmin):
    list_display = [
        "user",
        "image_url",
        "created",
        "deleted",
        "processing_stats",
        "processing",
        "deletion_error",
        "retry_count",
    ]
    search_fields = [
        "user",
        "image_url",
    ]
    list_filter = [
        "user",
        "created",
        "deleted",
        "processing",
    ]


class BlockNoteAdminMixin:
    """
    Mixin to automatically handle BlockNote fields in Django admin.
    Adds read-only preview fields for all BlockNote fields.
    """

    def __init__(self, model, admin_site):
        super().__init__(model, admin_site)
        # Automatically add preview fields for BlockNote fields
        self._setup_blocknote_previews()

    def _setup_blocknote_previews(self):
        """Automatically create preview methods for BlockNote fields"""
        blocknote_fields = []

        for field in self.model._meta.get_fields():
            if isinstance(field, BlockNoteField):
                blocknote_fields.append(field.name)
                preview_method_name = f"{field.name}_preview"

                # Create dynamic preview method
                def make_preview_method(field_name):
                    def preview_method(self, obj):
                        content = getattr(obj, field_name)
                        if content:
                            template = Template(
                                "{% load blocknote_tags %}{% blocknote_viewer content %}",
                            )
                            return format_html(
                                template.render(Context({"content": content})),
                            )
                        return format_html('<em style="color: #999;">No content</em>')

                    preview_method.short_description = (
                        f"{field.verbose_name or field_name.title()} Preview"
                    )
                    preview_method.allow_tags = True
                    return preview_method

                # Add method to class
                setattr(
                    self.__class__,
                    preview_method_name,
                    make_preview_method(field.name),
                )

        # Add preview fields to readonly_fields if they exist
        if blocknote_fields:
            existing_readonly = list(getattr(self, "readonly_fields", []))
            preview_fields = [f"{field}_preview" for field in blocknote_fields]
            self.readonly_fields = existing_readonly + preview_fields


class BlockNoteModelAdmin(BlockNoteAdminMixin, admin.ModelAdmin):
    """
    ModelAdmin that automatically handles BlockNote fields.
    Drop-in replacement for admin.ModelAdmin when you have BlockNote fields.
    """
