"""django-blocknote models"""

from django.contrib.auth import get_user_model
from django.db import models
from django.utils.translation import pgettext_lazy as _

User = get_user_model()


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
        help_text=_("Help text", "The date and time when this record was created."),
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
