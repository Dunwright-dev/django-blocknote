from django.contrib import admin
from django.template import Context, Template
from django.utils.html import format_html

from django_blocknote.models import (
    UnusedImageURLS,
    # DocumentTemplate,
)
from .fields import BlockNoteField

try:
    from unfold.admin import ModelAdmin as UnfoldModelAdmin

    BaseModelAdmin = UnfoldModelAdmin
except ImportError:
    BaseModelAdmin = admin.ModelAdmin


@admin.register(UnusedImageURLS)
class UnusedImageURLSAdmin(BaseModelAdmin):
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


class BlockNoteModelAdmin(BlockNoteAdminMixin, BaseModelAdmin):
    """
    ModelAdmin that automatically handles BlockNote fields.
    Drop-in replacement for admin.ModelAdmin when you have BlockNote fields.
    """


# @admin.register(DocumentTemplate)
# class DocumentTemplateAdmin(BlockNoteModelAdmin):
#     list_display = [
#         "title",
#         "user",
#         "group",
#         "show_in_menu",
#         "created_at",
#         "template_preview",
#     ]
#     list_filter = ["group", "show_in_menu", "created_at", "user"]
#     search_fields = ["title", "user__username", "user__email", "subtext"]
#
#     # Base readonly fields - timestamps should always be readonly
#     base_readonly_fields = ["created_at"]
#
#     def get_readonly_fields(self, request, obj=None):
#         """Dynamic readonly fields based on user permissions"""
#         readonly_fields = list(self.base_readonly_fields)
#
#         if not request.user.is_superuser:
#             # Regular admin staff: most fields readonly except show_in_menu for support
#             readonly_fields.extend(
#                 [
#                     "title",
#                     "content",
#                     "subtext",
#                     "aliases",
#                     "group",
#                     "icon",
#                     "user",
#                 ],
#             )
#
#         # Add any preview fields from BlockNoteAdminMixin
#         existing_readonly = getattr(self, "readonly_fields", [])
#         if existing_readonly:
#             readonly_fields.extend(existing_readonly)
#
#         return readonly_fields
#
#     def has_add_permission(self, request):
#         """Only superusers can create templates"""
#         return request.user.is_superuser
#
#     def has_delete_permission(self, request, obj=None):
#         """Only superusers can delete templates"""
#         return request.user.is_superuser
#
#     def has_change_permission(self, request, obj=None):
#         """Everyone can view, superusers can edit"""
#         return True  # View permission for all admin users
#
#     def template_preview(self, obj):
#         """Custom preview showing template structure"""
#         if obj.content:
#             # Show a compact preview of the template structure
#             try:
#                 blocks = obj.content if isinstance(obj.content, list) else []
#                 preview_items = []
#
#                 for i, block in enumerate(blocks[:3]):  # Show first 3 blocks
#                     block_type = block.get("type", "unknown")
#
#                     if block_type == "heading":
#                         level = block.get("props", {}).get("level", 1)
#                         text = self._extract_text_content(block)
#                         preview_items.append(f"H{level}: {text}")
#                     elif block_type == "paragraph":
#                         text = self._extract_text_content(block)
#                         if text:
#                             preview_items.append(f"P: {text[:50]}...")
#                     else:
#                         preview_items.append(f"{block_type.title()}")
#
#                 if len(blocks) > 3:
#                     preview_items.append(f"... (+{len(blocks) - 3} more blocks)")
#
#                 preview_html = "<br>".join(preview_items)
#                 return format_html(
#                     '<div style="font-size: 12px; color: #666; max-width: 300px;">{}</div>',
#                     preview_html,
#                 )
#             except Exception:
#                 return format_html(
#                     '<em style="color: #999;">Invalid content structure</em>'
#                 )
#
#         return format_html('<em style="color: #999;">No content</em>')
#
#     template_preview.short_description = "Template Structure"
#
#     def _extract_text_content(self, block):
#         """Helper to extract text from block content"""
#         try:
#             content = block.get("content", [])
#             if isinstance(content, list):
#                 text_parts = []
#                 for item in content:
#                     if isinstance(item, dict) and item.get("type") == "text":
#                         text_parts.append(item.get("text", ""))
#                 return "".join(text_parts)[:100]  # Limit length
#         except Exception:
#             pass
#         return ""
#
#     def get_queryset(self, request):
#         """Optimize queries"""
#         return super().get_queryset(request).select_related("user")
#
#     fieldsets = (
#         ("Template Information", {"fields": ("title", "subtext", "group", "icon")}),
#         ("Search & Organization", {"fields": ("aliases", "show_in_menu")}),
#         ("Content", {"fields": ("content",), "classes": ("wide",)}),
#         (
#             "Ownership",
#             {"fields": ("user",), "classes": ("collapse",)},
#         ),
#         (
#             "Timestamps",
#             {"fields": ("created_at",), "classes": ("collapse",)},
#         ),
#     )
#
#     def save_model(self, request, obj, form, change):
#         """Add logging for admin saves"""
#         action = "updated" if change else "created"
#         super().save_model(request, obj, form, change)
#
#         # Log admin actions for audit trail
#         if hasattr(self, "log_change"):
#             self.log_change(
#                 request, obj, f"Template {action} by admin: {request.user.username}"
#             )
