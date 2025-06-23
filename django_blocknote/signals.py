# Signal handlers for bulk operations
import structlog
from django.db.models.signals import post_delete
from django.dispatch import receiver

from django_blocknote.models import DocumentTemplate

logger = structlog.get_logger(__name__)


@receiver(post_delete, sender=DocumentTemplate)
def template_post_delete(sender, instance, **kwargs):
    """Handle cache refresh when template is deleted via admin or bulk operations"""
    try:
        # Refresh cache for the user
        DocumentTemplate.refresh_user_cache(instance.user)
    except Exception as e:
        logger.exception(f"Error refreshing cache after template deletion: {e}")
