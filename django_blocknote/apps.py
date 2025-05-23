# django_blocknote/apps.py
from django.apps import AppConfig


class DjangoBlocknoteConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "django_blocknote"
    verbose_name = "Django BlockNote"
