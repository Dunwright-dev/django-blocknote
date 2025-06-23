# views.py
import json
import mimetypes

import structlog
from django.contrib import messages
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.http import (
    Http404,
    JsonResponse,
)
from django.urls import reverse_lazy
from django.utils.translation import gettext_lazy as _
from django.utils.translation import pgettext_lazy as _
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.views.generic import CreateView, DeleteView, ListView, UpdateView

from django_blocknote.exceptions import (
    InvalidImageTypeError,
    PillowImageError,
)

# from django_blocknote.forms import (
#     DocumentTemplateForm,
#     DocumentTemplateQuickForm,
#     DocumentTemplateSearchForm,
# )
from django_blocknote.image import (
    handle_uploaded_image,
    has_permission_to_upload_images,
    image_verify,
    process_image_urls,
    trigger_cleanup_if_needed,
)
# from django_blocknote.mixins import BlockNoteUserViewMixin
# from django_blocknote.models import DocumentTemplate

logger = structlog.get_logger(__name__)


# class DocumentTemplateCreateView(
#     LoginRequiredMixin,
#     BlockNoteUserViewMixin,
#     CreateView,
# ):
#     """Create a new document template."""
#
#     model = DocumentTemplate
#     form_class = DocumentTemplateForm
#     template_name = "django_blocknote/template_create.html"
#     success_url = reverse_lazy("django_blocknote:template_list")
#
#     def form_valid(self, form):
#         # Automatically set the user to the current user
#         form.instance.user = self.request.user
#         messages.success(
#             self.request,
#             _('Template "{}" created successfully!').format(form.instance.title),
#         )
#         return super().form_valid(form)
#
#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         context["page_title"] = _("Create Document Template")
#         context["submit_text"] = _("Create Template")
#         return context
#
#
# class DocumentTemplateUpdateView(
#     LoginRequiredMixin,
#     BlockNoteUserViewMixin,
#     UpdateView,
# ):
#     """Update an existing document template."""
#
#     model = DocumentTemplate
#     form_class = DocumentTemplateForm
#     template_name = "django_blocknote/template_update.html"
#     success_url = reverse_lazy("django_blocknote:template_list")
#
#     def get_queryset(self):
#         # Users can only edit their own templates
#         return DocumentTemplate.objects.filter(user=self.request.user)
#
#     def form_valid(self, form):
#         messages.success(
#             self.request,
#             _('Template "{}" updated successfully!').format(form.instance.title),
#         )
#         return super().form_valid(form)
#
#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         context["page_title"] = _("Edit Template: {}").format(self.object.title)
#         context["submit_text"] = _("Update Template")
#         return context
#
#
# class DocumentTemplateListView(LoginRequiredMixin, ListView):
#     """List all document templates for the current user with search/filter."""
#
#     model = DocumentTemplate
#     template_name = "django_blocknote/template_list.html"
#     context_object_name = "templates"
#     paginate_by = 20
#
#     def get_queryset(self):
#         queryset = DocumentTemplate.objects.filter(user=self.request.user)
#
#         # Get search parameters
#         search = self.request.GET.get("search")
#         group = self.request.GET.get("group")
#         show_hidden = self.request.GET.get("show_hidden")
#
#         # Apply search filter
#         if search:
#             queryset = queryset.filter(
#                 Q(title__icontains=search)
#                 | Q(subtext__icontains=search)
#                 | Q(aliases__icontains=search)
#                 | Q(group__icontains=search),
#             )
#
#         # Apply group filter
#         if group:
#             queryset = queryset.filter(group=group)
#
#         # Apply visibility filter
#         if not show_hidden:
#             queryset = queryset.filter(show_in_menu=True)
#
#         return queryset.order_by("group", "title")
#
#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         context["page_title"] = _("My Document Templates")
#
#         # Add search form
#         context["search_form"] = DocumentTemplateSearchForm(
#             data=self.request.GET,
#             user=self.request.user,
#         )
#
#         # Group templates by category for better organization
#         templates_by_group = {}
#         for template in context["templates"]:
#             group = template.group or _("Uncategorized")
#             if group not in templates_by_group:
#                 templates_by_group[group] = []
#             templates_by_group[group].append(template)
#
#         context["templates_by_group"] = templates_by_group
#
#         # Add stats
#         total_templates = DocumentTemplate.objects.filter(
#             user=self.request.user,
#         ).count()
#         visible_templates = DocumentTemplate.objects.filter(
#             user=self.request.user,
#             show_in_menu=True,
#         ).count()
#
#         context["template_stats"] = {
#             "total": total_templates,
#             "visible": visible_templates,
#             "hidden": total_templates - visible_templates,
#         }
#
#         return context
#
#
# class DocumentTemplateDeleteView(LoginRequiredMixin, DeleteView):
#     """Delete a document template."""
#
#     model = DocumentTemplate
#     template_name = "django_blocknote/template_confirm_delete.html"
#     success_url = reverse_lazy("django_blocknote:template_list")
#
#     def get_queryset(self):
#         # Users can only delete their own templates
#         return DocumentTemplate.objects.filter(user=self.request.user)
#
#     def delete(self, request, *args, **kwargs):
#         template = self.get_object()
#         messages.success(
#             request,
#             _('Template "{}" deleted successfully!').format(template.title),
#         )
#         return super().delete(request, *args, **kwargs)
#
#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         context["page_title"] = _("Delete Template")
#         return context
#
#
# class DocumentTemplateQuickCreateView(
#     LoginRequiredMixin,
#     BlockNoteUserViewMixin,
#     CreateView,
# ):
#     """Quick template creation with minimal fields."""
#
#     model = DocumentTemplate
#     form_class = DocumentTemplateQuickForm
#     template_name = "django_blocknote/template_quick_create.html"
#     success_url = reverse_lazy("django_blocknote:template_list")
#
#     def form_valid(self, form):
#         form.instance.user = self.request.user
#         messages.success(
#             self.request,
#             _('Quick template "{}" created successfully!').format(form.instance.title),
#         )
#         return super().form_valid(form)
#
#     def get_context_data(self, **kwargs):
#         context = super().get_context_data(**kwargs)
#         context["page_title"] = _("Quick Create Template")
#         context["submit_text"] = _("Create Template")
#         return context


@csrf_exempt
@require_http_methods(["POST"])
def upload_image(request):
    """
    Handle image uploads for BlockNote editor
    Returns JSON with the uploaded file URL
    """
    logger.debug(
        event="view_for_upload_image",
        msg="Checking image info from request",
        data={
            "files_object": request.FILES,
            "file": request.FILES["file"],
        },
    )
    try:
        if not has_permission_to_upload_images(request):
            raise Http404(_("Page not found."))

        # Check if file was provided
        if "file" not in request.FILES:
            return JsonResponse(
                {"error": "No file provided", "code": "NO_FILE"},
                status=400,
            )

        uploaded_file = request.FILES.get("file", None)
        upload_config_json = request.POST.get("image_upload_config", "{}")
        upload_config = json.loads(upload_config_json)

        # Access img_model from the configuration
        img_model = upload_config.get("img_model", "")
        logger.debug(
            event="view_for_upload_image",
            msg="Checking image config from request",
            data={
                "img_model": img_model,
            },
        )

        try:
            image_verify(uploaded_file)
            logger.debug(
                event="view_for_upload_image",
                msg="Image verified",
                data={
                    "files_object": request.FILES,
                    "file": request.FILES["file"],
                },
            )

            content_type = (
                uploaded_file.content_type
                or mimetypes.guess_type(uploaded_file.name)[0]
            )

        except PillowImageError as e:
            msg = str(e)
            logger.exception(
                event="upload_image",
                msg=msg,
                data={},
            )
            return JsonResponse(
                {
                    "error": msg,
                    "code": "VERIFICATION",
                },
                status=400,
            )

        except InvalidImageTypeError as e:
            msg = str(e)
            logger.exception(
                event="upload_image",
                msg=msg,
                data={},
            )
            return JsonResponse(
                {"error": msg, "code": "VALIDATION"},
                status=400,
            )

        url = handle_uploaded_image(request)
        return JsonResponse(
            {
                "url": url,
                "filename": uploaded_file.name,
                "size": uploaded_file.size,
                "content_type": content_type,
            },
            status=200,
        )

    except Exception:
        msg = ("Upload failed",)
        logger.exception(
            event="upload_image",
            msg=msg,
            data={},
        )
        return JsonResponse(
            {
                "error": msg,
                "code": "SERVER_ERROR",
            },
            status=500,
        )


@csrf_exempt
@require_http_methods(["POST"])
def remove_image(request):
    """
    Process image URLs for removal.

    Handles validation, saves URLs to database, and triggers cleanup if needed.
    All business logic is delegated to helpers for maintainability.
    """
    error_response = None

    try:
        # Consolidated validation
        if not request.body:
            error_response = {"message": "Empty request body", "code": "EMPTY_BODY"}
        else:
            try:
                data = json.loads(request.body.decode("utf-8"))

                if "imageUrls" not in data:
                    error_response = {
                        "message": "Missing 'imageUrls' field",
                        "code": "MISSING_FIELD",
                    }
                elif not isinstance(data["imageUrls"], list):
                    error_response = {
                        "message": "imageUrls must be a list",
                        "code": "INVALID_TYPE",
                    }

            except (json.JSONDecodeError, UnicodeDecodeError) as e:
                logger.warning(
                    "Invalid JSON received",
                    extra={"error": str(e), "content_type": request.content_type},
                )
                error_response = {
                    "message": "Invalid JSON format",
                    "code": "INVALID_JSON",
                }

        # Return validation error if any
        if error_response:
            return JsonResponse({"error": error_response}, status=400)

        # Process the validated URLs
        result = process_image_urls(
            image_urls=data["imageUrls"],
            user=request.user if request.user.is_authenticated else None,
        )

        # Return result
        if result["success"]:
            return JsonResponse(result["data"], status=result["status_code"])
        return JsonResponse(
            {"error": result["error"]},
            status=result["status_code"],
        )

    except Exception:
        logger.exception("Unexpected error in remove_image view")
        return JsonResponse(
            {"error": {"message": "Internal server error", "code": "INTERNAL_ERROR"}},
            status=500,
        )
    finally:
        # Always check if cleanup is needed (regardless of request success/failure)
        trigger_cleanup_if_needed()


@csrf_exempt
@require_http_methods(["POST"])
def upload_file(request):
    """
    Handle general file uploads (documents, etc.)
    Similar to upload_image but with different allowed types
    """
    return JsonResponse(
        {"error": "File upload not permitted", "code": "PERMISSION"},
        status=400,
    )


# NOTE : File upload not yet permitted
# try:
#     if "file" not in request.FILES:
#         return JsonResponse(
#             {"error": "No file provided", "code": "NO_FILE"},
#             status=400,
#         )
#
#
#     uploaded_file = request.FILES["file"]
#
#     # Validate file size
#     max_size = getattr(settings, "DJ_BN_MAX_FILE_SIZE", 10 * 1024 * 1024)
#     if uploaded_file.size > max_size:
#         return JsonResponse(
#             {
#                 "error": f"File size exceeds maximum of {max_size} bytes",
#                 "code": "FILE_TOO_LARGE",
#             },
#             status=400,
#         )
#
#     # Validate file type for documents
#     allowed_types = getattr(
#         settings,
#         "DJ_BN_ALLOWED_DOCUMENT_TYPES",
#         [
#             "application/pdf",
#             "application/msword",
#             "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
#             "text/plain",
#         ],
#     )
#     content_type = (
#         uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0]
#     )
#
#     if content_type not in allowed_types:
#         return JsonResponse(
#             {
#                 "error": f'File type "{content_type}" is not allowed',
#                 "code": "INVALID_TYPE",
#             },
#             status=400,
#         )
#
#     # Generate filename
#     file_extension = os.path.splitext(uploaded_file.name)[1].lower()
#     upload_dir = getattr(settings, "DJ_BN_UPLOAD_PATH", "blocknote_uploads")
#     unique_filename = f"{upload_dir}/files/{uuid.uuid4()}{file_extension}"
#
#     # Save file
#     file_path = default_storage.save(unique_filename, uploaded_file)
#     file_url = default_storage.url(file_path)
#     absolute_url = request.build_absolute_uri(file_url)
#
#     logger.info(
#         f"BlockNote file uploaded: {file_path} ({uploaded_file.size} bytes)",
#     )
#
#     return JsonResponse(
#         {
#             "url": absolute_url,
#             "filename": uploaded_file.name,
#             "size": uploaded_file.size,
#             "content_type": content_type,
#         },
#     )
#
# except Exception as e:
#     logger.error(f"BlockNote file upload error: {e!s}", exc_info=True)
#     return JsonResponse(
#         {"error": f"Upload failed: {e!s}", "code": "SERVER_ERROR"},  # noqa: ERA001
#         status=500,
#     )
