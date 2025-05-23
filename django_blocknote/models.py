from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from .fields import BlockNoteField


class Document(models.Model):
    """Example document model using BlockNote"""

    title = models.CharField(max_length=200)
    content = BlockNoteField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="blocknote_documents",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title
