from django.urls import path

from . import views

app_name = "django_blocknote"

urlpatterns = [
    path("upload-image/", views.upload_image, name="upload_image"),
    path("upload-file/", views.upload_file, name="upload_file"),
]
