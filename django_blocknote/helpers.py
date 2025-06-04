"""django-blocknote helpers."""

import json
from pathlib import Path
from queue import Queue
from threading import Lock

import filetype
import structlog
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import default_storage
from django.utils import timezone
from django.utils.module_loading import (
    import_string,
)
from PIL import (
    Image,
    UnidentifiedImageError,
)

from django_blocknote.exceptions import (
    InvalidImageTypeError,
    PillowImageError,
)
from django_blocknote.image import convert_image_to_webp
from django_blocknote.models import UnusedImageURLS as img_model  # noqa: N813

logger = structlog.get_logger(__name__)


class ImageRemovalQueueProcessor:
    def __init__(self):
        self._batch_size = getattr(settings, "DJ_BN_BULK_CREATE_BATCH_SIZE", 50)
        self._image_instances = []
        self._is_processing = False
        self._media_path = Path(settings.MEDIA_ROOT)
        self._queue = Queue()
        self._queue_lock = Lock()

    @property
    def is_processing(self):
        with self._queue_lock:
            return self._is_processing

    def set_processing(self, value):
        with self._queue_lock:
            self._is_processing = value

    def enqueue_image_urls(self, image_urls_data):
        """
        Adds the raw request body data to the queue.
        """

        self._queue.put(image_urls_data)

        # Trigger processing if not already running
        if not self._is_processing:
            self._process_queue()

    def process_queue(self):
        """
        Processes the image removal queue, either deleting images or saving their paths
        to a model.
        """
        self._image_instances = []
        self._delete_images = settings.DJ_BN_IMAGE_DELETION

        if self._is_processing:
            logger.debug(
                event="process_queue_skip",
                msg="The queue is already processing images, so return",
                data={},
            )
            return

        if not self._queue.empty():
            self.set_processing(True)

        while not self._queue.empty():
            encoded_data = self._queue.get()
            try:
                decoded_data = json.loads(encoded_data.decode("utf-8"))
                image_urls_list = decoded_data["imageUrls"]

                for url in image_urls_list:
                    if not isinstance(url, str):
                        logger.error(
                            event="process_queue_invalid_url",
                            msg="Invalid URL type encountered",
                            data={
                                "url_type": str(type(url)),
                                "expected_type": "string",
                                "url_value": str(url),
                            },
                        )
                        msg = f"Invalid URL type: {type(url)}. Expected a string."
                        raise TypeError(msg)

                    file_path = url.split(settings.MEDIA_URL)[1]
                    image_path = Path(settings.MEDIA_ROOT) / file_path

                    match self._delete_images:
                        case True:
                            match default_storage.exists(image_path):
                                case True:
                                    default_storage.delete(image_path)
                                    logger.debug(
                                        event="process_queue_image_deleted",
                                        msg="Image successfully deleted",
                                        data={
                                            "image_path": str(image_path),
                                            "url": url,
                                        },
                                    )
                                case False:
                                    logger.error(
                                        event="process_queue_delete_error",
                                        msg="Image deletion error, image path not found",
                                        data={
                                            "image_path": str(image_path),
                                            "url": url,
                                        },
                                    )
                        case False:
                            # Create model instances and add them to the list
                            self._image_instances.append(
                                img_model(
                                    image_url=url,
                                    created=timezone.now(),
                                ),
                            )

                # Bulk create the model instances (only if not deleting)
                # This allows additional processing options for the dev.
                match self._delete_images:
                    case False if self._image_instances:
                        img_model.objects.bulk_create(
                            self._image_instances,
                            ignore_conflicts=True,
                        )
                        logger.debug(
                            event="process_queue_bulk_create",
                            msg="Bulk created image instances",
                            data={
                                "instance_count": len(self._image_instances),
                            },
                        )
                        self._image_instances = []  # Reset the batch

            except json.JSONDecodeError as e:
                logger.exception(
                    event="process_queue_json_decode_error",
                    msg="Error decoding JSON data",
                    data={
                        "encoded_data": encoded_data.decode("utf-8", errors="replace"),
                        "error": str(e),
                    },
                )
            finally:
                self._queue.task_done()

        self.set_processing(False)


image_removal_processor = ImageRemovalQueueProcessor()


def get_storage_class():
    """
    Determines the appropriate storage class for BlockNote based on settings.

    This function searches through a prioritized set of Django settings
    to dynamically determine the storage class to be used.

    Priority Order:
        1. DJ_BN_FILE_STORAGE setting
        2. DEFAULT_FILE_STORAGE
        3. STORAGES['default']

    Returns:
        The imported storage class

    Raises:
        ImproperlyConfigured: If no valid storage class configuration is found
    """
    # We can directly call DJ_BN_IMAGE_STORAGE because it is always available.
    dj_bn_img_storage_setting = settings.DJ_BN_IMAGE_STORAGE
    default_storage_setting = getattr(settings, "DEFAULT_FILE_STORAGE", None)
    storages_setting = getattr(settings, "STORAGES", {})
    default_storage_name = storages_setting.get("default", {}).get("BACKEND")

    # Determine storage class using priority order
    match (dj_bn_img_storage_setting, default_storage_setting, default_storage_name):
        case (storage_class, _, _) if storage_class:
            pass
        case (_, storage_class, _) if storage_class:
            pass
        case (_, _, storage_class) if storage_class:
            pass
        case _:
            storage_class = ""

    try:
        return _get_storage_object(storage_class)
    except ImproperlyConfigured as e:
        logger.exception(
            event="get_storage_class",
            msg="Failed to configure storage class",
            data={
                "storage_class": storage_class,
                "error": str(e),
            },
        )
        raise ImproperlyConfigured from e


def _get_storage_object(storage_class: str = ""):
    try:
        storage = import_string(storage_class)
        return storage()
    except ImportError as e:
        error_msg = (
            "Either DJ_BN_IMAGE_STORAGE, DEFAULT_FILE_STORAGE, "
            "or STORAGES['default'] setting is required."
        )
        raise ImproperlyConfigured(error_msg) from e


def image_verify(image):
    """Verifies whether an image file is valid and has a supported type.

    Validates an image file and ensures it falls within the permitted image
    types. The function checks for potential corruption, decompression bombs,
    and unsupported file formats.

    Args:
        image: The image file to verify. An image file-like object or a filename.

    Raises:
        PillowImageError: If the image is corrupt, too large, or cannot be verified.
        InvalidImageTypeError: If the image has an unsupported file type.
    """
    logger.debug(
        event="verify_image_file",
        msg="Checking Image passed to function",
        data={
            "image": image,
        },
    )
    # Fallback to `BlockNote` default image types if not set.
    permitted_image_types = settings.DJ_BN_PERMITTED_IMAGE_TYPES

    # filetype checks the file, not just the extension.
    kind = filetype.guess(image)

    match kind:
        case None:
            extension = "unknown"
        case _:
            extension = kind.extension.lower()

    if kind is None or extension not in permitted_image_types:
        error_msg = (
            f"Invalid image type, valid types {permitted_image_types}\n"
            f"It seems you have uploaded a '{extension}' filetype!"
        )
        logger.error(error_msg)
        raise InvalidImageTypeError(error_msg)

    try:
        logger.debug(
            event="verify_image_file",
            msg="Checking Image opens correctly",
            data={
                "image": image,
                "kind": kind,
            },
        )

        Image.open(image).verify()

        logger.debug(
            event="verify_image_file",
            msg="Checking Image has opened and closed correctly",
            data={
                "image": image,
                "kind": kind,
            },
        )

    except (
        FileNotFoundError,
        UnidentifiedImageError,
        Image.DecompressionBombError,
    ) as e:
        error_messages = {
            FileNotFoundError: "This image file is not valid or corrupted.",
            UnidentifiedImageError: "This image file is corrupted.",
            Image.DecompressionBombError: "This image file is corrupted or too large to use.",
        }
        error_msg = error_messages[type(e)]
        logger.exception(
            event="verify_image_file",
            msg=error_msg,
        )
        raise PillowImageError(error_msg, e) from e


def handle_uploaded_image(request):
    """Handles an uploaded image, saving it to storage and returning its URL.

    Leverages a custom URL handler if specified in Django settings.

    Args:
        request: The Django request object containing the uploaded file.
                Available in `request.FILES["file"]`

    Returns:
        str: The URL where the uploaded image is stored
    """
    image = request.FILES.get("file", None)

    try:
        storage = get_storage_class()
    except ImproperlyConfigured as e:
        logger.exception(
            event="handle_uploaded_image_storage_error",
            msg="A valid storage system has not been configured",
            data={
                "error": str(e),
            },
        )
        return "A valid storage system has not been configured"

    # Get image formatter
    match getattr(settings, "DJ_BN_IMAGE_FORMATTER", ""):
        case "":
            convert_image = convert_image_to_webp
        case formatter_path:
            convert_image = import_string(formatter_path)

    # Get URL handler
    match getattr(settings, "DJ_BN_IMAGE_URL_HANDLER", ""):
        case "":
            get_image_url_and_optionally_save = None
        case handler_path:
            get_image_url_and_optionally_save = import_string(handler_path)

    # Process image formatting
    match (settings.DJ_BN_FORMAT_IMAGE, convert_image):
        case (True, formatter) if formatter:
            file_name, image = formatter(image)
            logger.debug(
                event="handle_uploaded_image_formatted",
                msg="Image converted using custom formatter",
                data={
                    "original_name": request.FILES.get("file").name,
                    "new_name": file_name,
                },
            )
        case _:
            file_name = image.name

    # Handle URL generation and optional saving
    match get_image_url_and_optionally_save:
        case None:
            img_saved = False
            image_url = file_name
        case handler:
            image_url, img_saved = handler(request, file_name, image)
            logger.debug(
                event="handle_uploaded_image_custom_handler",
                msg="Used custom URL handler",
                data={
                    "image_url": image_url,
                    "img_saved": img_saved,
                },
            )

    # Save to storage if not already saved
    match img_saved:
        case False:
            filename = storage.save(name=image_url, content=image)
            image_url = storage.url(filename)
            logger.debug(
                event="handle_uploaded_image_saved",
                msg="Image saved to storage",
                data={
                    "filename": filename,
                    "image_url": image_url,
                },
            )
        case True:
            logger.debug(
                event="handle_uploaded_image_already_saved",
                msg="Image already saved by custom handler",
                data={
                    "image_url": image_url,
                },
            )

    return image_url


def has_permission_to_upload_images(request) -> bool:
    """
    Checks if the user  has permission to upload images.

    Args:
        request (django.http.HttpRequest): The HTTP request object representing
        the user's interaction.

    Returns:
        bool: True if the user has permission to upload images, False otherwise.

    Behavior:
        - By default, all users have permission to upload images.
        - If the Django setting `DJ_BN_STAFF_ONLY_IMAGE_UPLOADS` is set to True,
          only staff users will have permission.
    """
    has_perms = True
    if (
        hasattr(settings, "DJ_BN_STAFF_ONLY_IMAGE_UPLOADS")
        and (settings.DJ_BN_STAFF_ONLY_IMAGE_UPLOADS)
        and not request.user.is_staff
    ):
        has_perms = False

    return has_perms
