"""django-blocknote models"""

import structlog
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import models
from django.utils.translation import pgettext_lazy as _

from django_blocknote.fields import BlockNoteField

User = get_user_model()


logger = structlog.get_logger(__name__)


class UnusedImageURLS(models.Model):
    """Image urls that are no longer referenced in BlockNote"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        verbose_name=_(
            "Verbose name",
            "User",
        ),
        help_text=_(
            "Help text",
            "The user deleting the image",
        ),
    )
    image_url = models.URLField(
        max_length=500,
        blank=True,
        default="",
        verbose_name=_(
            "Verbose name",
            "Image URL",
        ),
        help_text=_(
            "Help text",
            "The images url.",
        ),
    )

    created = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_(
            "Verbose name",
            "Created",
        ),
        help_text=_(
            "Help text",
            "The date and time when this record was created.",
        ),
    )

    deleted = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_(
            "Verbose name",
            "Deleted",
        ),
        help_text=_(
            "Help text",
            "The date and time when this record was deleted (if applicable).",
        ),
    )
    processing = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_(
            "Verbose name",
            "Processing",
        ),
        help_text=_(
            "Help text",
            "The date and time when this record was claimed for processing.",
        ),
    )
    deletion_error = models.TextField(
        blank=True,
        default="",
        verbose_name=_(
            "Verbose name",
            "Deletion Error",
        ),
        help_text=_(
            "Help text",
            "Error message if deletion failed (used for troubleshooting).",
        ),
    )
    processing_stats = models.JSONField(
        null=True,
        blank=True,
        verbose_name=_(
            "Verbose name",
            "Processing Stats",
        ),
        help_text=_(
            "Help text",
            "Processing Stats",
        ),
    )
    retry_count = models.PositiveIntegerField(
        default=0,
        verbose_name=_(
            "Verbose name",
            "Retry Count",
        ),
        help_text=_(
            "Help text",
            "Number of times deletion has been attempted.",
        ),
    )

    class Meta:
        verbose_name = _(
            "Verbose name",
            "Django BlockNote Unused Images",
        )
        verbose_name_plural = _(
            "Verbose name",
            "Django BlockNote Unused Images",
        )
        app_label = "django_blocknote"

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "image_url",
                ],
                name="djbn_image_url_no_duplicates",
                violation_error_message="Django CKeditor removed image url may not be duplicated.",
            ),
        ]

    def __str__(self):
        return str(self.image_url)


# class DocumentTemplate(models.Model):
#     ICON_CHOICES = [
#         # General Document Types
#         ("document", _("Choice", "Document")),
#         ("template", _("Choice", "Template")),
#         ("report", _("Choice", "Report")),
#         ("letter", _("Choice", "Letter")),
#         ("meeting", _("Choice", "Meeting")),
#         ("checklist", _("Choice", "Checklist")),
#         ("calendar", _("Choice", "Calendar")),
#         ("book", _("Choice", "Book/Journal")),
#         # Financial & Business
#         ("chart", _("Choice", "Chart/Graph")),
#         ("calculator", _("Choice", "Calculator")),
#         ("currency", _("Choice", "Currency/Money")),
#         ("bank", _("Choice", "Bank/Account")),
#         ("receipt", _("Choice", "Receipt/Invoice")),
#         ("trend", _("Choice", "Trend/Analytics")),
#         ("briefcase", _("Choice", "Business/Portfolio")),
#         ("scale", _("Choice", "Balance/Journal")),
#         ("eye", _("Choice", "Watchlist/Monitor")),
#         ("presentation", _("Choice", "Presentation")),
#         ("spreadsheet", _("Choice", "Spreadsheet")),
#         ("contract", _("Choice", "Contract/Agreement")),
#         ("clock", _("Choice", "Time/Schedule")),
#         ("bookmark", _("Choice", "Bookmark/Saved")),
#     ]
#
#     # BlockNote slash menu fields - these map directly to the slash menu item structure
#     title = models.CharField(
#         max_length=200,
#         verbose_name=_(
#             "Verbose name",
#             "Title",
#         ),
#         help_text=_(
#             "Help text",
#             "The title displayed in the slash menu",
#         ),
#     )
#
#     subtext = models.CharField(
#         max_length=20,
#         blank=True,
#         verbose_name=_(
#             "Verbose name",
#             "Subtext",
#         ),
#         help_text=_(
#             "Help text",
#             "Brief description shown under title in slash menu (max 20 characters)",
#         ),
#     )
#
#     aliases = models.CharField(
#         max_length=500,
#         blank=True,
#         verbose_name=_(
#             "Verbose name",
#             "Aliases",
#         ),
#         help_text=_(
#             "Help text",
#             "Comma-separated search aliases for slash menu filtering",
#         ),
#     )
#
#     group = models.CharField(
#         max_length=100,
#         blank=True,
#         verbose_name=_(
#             "Verbose name",
#             "Group",
#         ),
#         help_text=_(
#             "Help text",
#             "Group name for organizing templates in slash menu (e.g., app name)",
#         ),
#     )
#
#     icon = models.CharField(
#         max_length=50,
#         choices=ICON_CHOICES,
#         default="template",
#         verbose_name=_(
#             "Verbose name",
#             "Icon",
#         ),
#         help_text=_(
#             "Help text",
#             "Icon displayed in the slash menu",
#         ),
#     )
#
#     # Template content and metadata
#     content = models.JSONField(
#         verbose_name=_(
#             "Verbose name",
#             "Template Content",
#         ),
#         help_text=_(
#             "Help text",
#             "BlockNote blocks structure stored as JSON",
#         ),
#     )
#
#     user = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         verbose_name=_(
#             "Verbose name",
#             "Owner",
#         ),
#         help_text=_(
#             "Help text",
#             "The user who created this template",
#         ),
#     )
#
#     show_in_menu = models.BooleanField(
#         default=True,
#         verbose_name=_(
#             "Verbose name",
#             "Show in Menu",
#         ),
#         help_text=_(
#             "Help text",
#             "Whether this template appears in the slash menu",
#         ),
#     )
#
#     created_at = models.DateTimeField(
#         auto_now_add=True,
#         verbose_name=_(
#             "Verbose name",
#             "Created At",
#         ),
#         help_text=_(
#             "Help text",
#             "When this template was created",
#         ),
#     )
#
#     class Meta:
#         verbose_name = _(
#             "Verbose name",
#             "Document Template",
#         )
#         verbose_name_plural = _(
#             "Verbose name",
#             "Document Templates",
#         )
#         ordering = ["group", "title"]
#         indexes = [
#             models.Index(fields=["user", "show_in_menu"]),
#             models.Index(fields=["group"]),
#             models.Index(fields=["created_at"]),
#         ]
#
#     def __str__(self):
#         return self.title
#
#     def save(self, *args, **kwargs):
#         """Override save to refresh cache after any template change"""
#         # Get the user before save (in case of updates)
#         old_user_id = None
#         if self.pk:
#             try:
#                 old_instance = self.__class__.objects.get(pk=self.pk)
#                 old_user_id = old_instance.user_id
#             except self.__class__.DoesNotExist:
#                 pass
#
#         # Save the instance
#         super().save(*args, **kwargs)
#
#         # Refresh cache for current user
#         self.refresh_user_cache(self.user)
#
#         # If user changed, also refresh cache for old user
#         if old_user_id and old_user_id != self.user_id:
#             try:
#                 old_user = User.objects.get(id=old_user_id)
#                 self.refresh_user_cache(old_user)
#             except User.DoesNotExist:
#                 pass
#
#         logger.debug(
#             f"Template '{self.title}' saved, cache refreshed for user {self.user.id}"
#         )
#
#     def delete(self, *args, **kwargs):
#         """Override delete to refresh cache after template removal"""
#         user = self.user
#         super().delete(*args, **kwargs)
#
#         # Refresh cache after deletion
#         self.refresh_user_cache(user)
#         logger.debug(
#             f"Template '{self.title}' deleted, cache refreshed for user {user.id}"
#         )
#
#     @staticmethod
#     def get_cache_key(user_id):
#         """Generate cache key for user templates"""
#         return f"djbn_templates_user_{user_id}"
#
#     @classmethod
#     def get_cached_templates(cls, user):
#         """Get user templates from cache, fallback to DB"""
#         cache_key = cls.get_cache_key(user.id)
#         templates = cache.get(cache_key)
#
#         if templates is None:
#             logger.debug(f"Cache miss for user {user.id} templates, fetching from DB")
#             templates = cls.refresh_user_cache(user)
#         else:
#             logger.debug(
#                 f"Cache hit for user {user.id} templates ({len(templates)} templates)",
#             )
#
#         return templates
#
#     @classmethod
#     def refresh_user_cache(cls, user):
#         """Refresh cache for a specific user's templates"""
#         cache_key = cls.get_cache_key(user.id)
#
#         # Get active templates for user
#         templates_qs = cls.objects.filter(user=user, show_in_menu=True).order_by(
#             "group",
#             "title",
#         )
#
#         # Convert to JSON format for frontend (matching your JSON structure)
#         templates = []
#         for template in templates_qs:
#             # Convert comma-separated aliases to list
#             aliases_list = []
#             if template.aliases:
#                 aliases_list = [
#                     alias.strip()
#                     for alias in template.aliases.split(",")
#                     if alias.strip()
#                 ]
#
#             templates.append(
#                 {
#                     "id": str(template.pk),  # Ensure string for consistency
#                     "title": template.title,
#                     "subtext": template.subtext,
#                     "aliases": aliases_list,
#                     "group": template.group,
#                     "icon": template.icon,
#                     "content": template.content,
#                 },
#             )
#
#         # Cache for 1 hour (3600 seconds)
#         cache.set(cache_key, templates, 3600)
#
#         logger.info(f"Refreshed cache for user {user.id}: {len(templates)} templates")
#         return templates
#
#     @classmethod
#     def invalidate_user_cache(cls, user):
#         """Invalidate cache for a specific user"""
#         cache_key = cls.get_cache_key(user.id)
#         cache.delete(cache_key)
#         logger.info(f"Invalidated template cache for user {user.id}")
