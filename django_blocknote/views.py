import structlog  # noqa: I001
import mimetypes
import json

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.translation import pgettext_lazy as _
from django_blocknote.exceptions import (
    InvalidImageTypeError,
    PillowImageError,
)
from django.http import Http404
from django_blocknote.helpers import (
    handle_uploaded_image,
    has_permission_to_upload_images,
    # image_removal_processor,
    image_verify,
)

logger = structlog.get_logger(__name__)


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

        # else:
        #     logger.debug(
        #         event="view_for_upload_image",
        #         msg="Form Invalid",
        #         data={
        #             "errors": form.errors,
        #             "files_object": request.FILES,
        #             "file": request.FILES["file"],
        #         },
        #     )
        #
        #     return JsonResponse(
        #         {
        #             "error": form.errors,
        #             "code": "VALIDATION",
        #         },
        #         status=400,
        #     )

        # # Validate file size (default 10MB, configurable)
        # max_size = getattr(settings, "DJ_BN_MAX_FILE_SIZE", 10 * 1024 * 1024)
        # if uploaded_file.size > max_size:
        #     return JsonResponse(
        #         {
        #             "error": f"File size {uploaded_file.size} bytes exceeds maximum allowed size of {max_size} bytes",
        #             "code": "FILE_TOO_LARGE",
        #         },
        #         status=400,
        #     )

        # # Validate file type
        # allowed_types = getattr(
        #     settings,
        #     "DJ_BN_ALLOWED_FILE_TYPES",
        #     ["image/jpeg", "image/png", "image/gif", "image/webp"],
        # )
        # content_type = (
        #     uploaded_file.content_type or mimetypes.guess_type(uploaded_file.name)[0]
        # )

        # if content_type not in allowed_types:
        #     return JsonResponse(
        #         {
        #             "error": f'File type "{content_type}" is not allowed. Allowed types: {", ".join(allowed_types)}',
        #             "code": "INVALID_TYPE",
        #         },
        #         status=400,
        #     )

        # Generate unique filename
        # file_extension = os.path.splitext(uploaded_file.name)[1].lower()
        # if not file_extension:
        #     # Try to guess extension from content type
        #     extension_map = {
        #         "image/jpeg": ".jpg",
        #         "image/png": ".png",
        #         "image/gif": ".gif",
        #         "image/webp": ".webp",
        #     }
        #     file_extension = extension_map.get(content_type, ".jpg")
        #
        # # Create unique filename with directory structure
        # upload_dir = getattr(settings, "DJ_BN_UPLOAD_PATH", "blocknote_uploads")
        # unique_filename = f"{upload_dir}/{uuid.uuid4()}{file_extension}"
        #
        # # Save the file
        # file_path = default_storage.save(unique_filename, uploaded_file)
        # file_url = default_storage.url(file_path)
        #
        # # Build absolute URL
        # if hasattr(request, "build_absolute_uri"):
        #     absolute_url = request.build_absolute_uri(file_url)
        # else:
        #     absolute_url = file_url
        #
        # # Log successful upload
        # logger.info(
        #     f"BlockNote file uploaded: {file_path} ({uploaded_file.size} bytes)",
        # )
        #
        # return JsonResponse(
        #     {
        #         "url": absolute_url,
        #         "filename": uploaded_file.name,
        #         "size": uploaded_file.size,
        #         "content_type": content_type,
        #     },
        # )

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
    #         {"error": f"Upload failed: {e!s}", "code": "SERVER_ERROR"},
    #         status=500,
    #     )
