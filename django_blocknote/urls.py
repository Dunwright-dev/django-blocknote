from django.urls import path
from . import views

app_name = "django_blocknote"

urlpatterns = [
    path("", views.document_list, name="document_list"),
    path("create/", views.document_create, name="document_create"),
    path("document/<int:doc_id>/", views.document_view, name="document_view"),
    path("document/<int:doc_id>/edit/", views.document_edit, name="document_edit"),
    path(
        "api/document/<int:doc_id>/autosave/",
        views.document_autosave,
        name="document_autosave",
    ),
]
