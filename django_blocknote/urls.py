from django.urls import path

from django_blocknote.views import (
    # DocumentTemplateCreateView,
    # DocumentTemplateDeleteView,
    # DocumentTemplateListView,
    # DocumentTemplateQuickCreateView,
    # DocumentTemplateUpdateView,
    remove_image,
    upload_file,
    upload_image,
)

app_name = "django_blocknote"
app_label = "django_blocknote"

urlpatterns = [
    path(
        "upload-image/",
        upload_image,
        name="upload_image",
    ),
    path(
        "remove-image/",
        remove_image,
        name="remove_image",
    ),
    path(
        "upload-file/",
        upload_file,
        name="upload_file",
    ),
    # path(
    #     "templates/",
    #     DocumentTemplateListView.as_view(),
    #     name="template_list",
    # ),
    # path(
    #     "templates/create/",
    #     DocumentTemplateCreateView.as_view(),
    #     name="template_create",
    # ),
    # path(
    #     "templates/quick-create/",
    #     DocumentTemplateQuickCreateView.as_view(),
    #     name="template_quick_create",
    # ),
    # path(
    #     "templates/<int:pk>/edit/",
    #     DocumentTemplateUpdateView.as_view(),
    #     name="template_update",
    # ),
    # path(
    #     "templates/<int:pk>/delete/",
    #     DocumentTemplateDeleteView.as_view(),
    #     name="template_delete",
    # ),
]
