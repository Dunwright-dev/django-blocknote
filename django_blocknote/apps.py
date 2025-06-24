import logging

from django.apps import AppConfig
from django.conf import settings

logger = logging.getLogger(__name__)


class DjangoBlockNoteConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "django_blocknote"
    verbose_name = "Django BlockNote"

    def ready(self):
        """Configure BlockNote settings with intelligent defaults."""

        import django_blocknote.signals  # noqa: F401

        if not hasattr(settings, "DJ_BN_VIEWER_CONFIG"):
            # Minimal config
            settings.DJ_BN_VIEWER_CONFIG = {
                "theme": "light",  # or "dark"
                "animations": True,
                "showImageCaptions": True,
                "allowImageZoom": True,
            }

            # NOTE: Future use

        # Allowed document types (for file uploads)
        # if not hasattr(settings, "DJ_BN_ALLOWED_DOCUMENT_TYPES"):
        #     settings.DJ_BN_ALLOWED_DOCUMENT_TYPES = [
        #         "application/pdf",
        #         "application/msword",
        #         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        #         "text/plain",
        #     ]

        self._configure_blocknote_settings()
        self._configure_image_removal()
        self._configure_image_upload()
        self._configure_slash_menu()

    def _configure_slash_menu(self):
        """
        Configure multiple slash menu configurations for different user types/contexts.

        This allows you to have different slash menu setups for different use cases,
        such as 'default' for regular users and 'admin' for administrators.
        """
        # TODO: _default and default need some thought
        if not hasattr(settings, "DJ_BN_SLASH_MENU_CONFIGS"):
            settings.DJ_BN_SLASH_MENU_CONFIGS = {
                # Global default configuration (fallback)
                "_default": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        # Media blocks (except image) Not implemented
                        "video",
                        "audio",
                        "file",
                        # Advanced features not for general users
                        "code",  # Code blocks
                        "equation",  # Math equations
                        "table",  # Tables (can be complex)
                        "embed",  # External embeds
                        "column",  # Layout columns
                        "pageBreak",  # Page breaks
                        "template",  # Template blocks
                        "variable",  # Variable blocks
                        "form",  # Form blocks
                        "button",  # Interactive buttons
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 10,
                        "show_descriptions": True,
                        "show_icons": True,
                    },
                },
                # Default user configuration - limited feature set
                "default": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        # Media blocks (except image) Not implemented
                        "video",
                        "audio",
                        "file",
                        # Advanced features not for general users
                        "code",  # Code blocks
                        "equation",  # Math equations
                        "table",  # Tables (can be complex)
                        "embed",  # External embeds
                        "column",  # Layout columns
                        "pageBreak",  # Page breaks
                        "template",  # Template blocks
                        "variable",  # Variable blocks
                        "form",  # Form blocks
                        "button",  # Interactive buttons
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 8,  # Fewer items to avoid overwhelming
                        "show_descriptions": True,  # Help users understand options
                        "show_icons": True,
                        "show_keyboard_shortcuts": True,
                    },
                },
                # Admin configuration - full access to all features
                "admin": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        # Only disable truly problematic items for admins
                        # Maybe keep some media if upload handling is robust
                        "video",  # Disabled video handling isn't implemented
                        "audio",  # Disabled audio handling isn't implemented
                        # Admins get access to everything else including:
                        "file",  # Disabled file handling isn't implemented
                        # - code blocks (they might need them)
                        # - tables (they can handle the complexity)
                        # - advanced layout options
                        # - forms and interactive elements
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 15,  # More items for power users
                        "show_descriptions": True,
                        "show_icons": True,
                        "show_keyboard_shortcuts": True,  # Power users want shortcuts
                        "group_items": True,  # Better organization for many items
                        "show_group_headers": True,
                    },
                },
                # Examples: Additional configurations for specific contexts
                "blog": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        "video",
                        "audio",
                        "file",
                        "code",
                        "equation",
                        "table",
                        "form",
                        "button",
                        "variable",
                        "template",
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 10,
                        "show_descriptions": True,
                        "show_icons": True,
                    },
                },
                "documentation": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        "video",
                        "audio",
                        "file",
                        "embed",
                        "form",
                        "button",
                        "variable",
                        "template",
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 12,
                        "show_descriptions": True,
                        "show_icons": True,
                        "show_keyboard_shortcuts": True,
                    },
                },
                # Default user configuration - limited feature set
                "template": {
                    "enabled": True,
                    "mode": "filtered",
                    "disabled_items": [
                        # Media blocks(except image) Not implemented
                        "video",
                        "audio",
                        "file",
                        "image",
                        # Advanced features not for general users
                        "code",  # Code blocks
                        "equation",  # Math equations
                        # "table",  # Tables (can be complex)
                        "embed",  # External embeds
                        "column",  # Layout columns
                        # "pageBreak",  # Page breaks
                        "template",  # Template blocks
                        "variable",  # Variable blocks
                        "form",  # Form blocks
                        "button",  # Interactive buttons
                    ],
                    "advanced_options": {
                        "enable_search": True,
                        "max_items_shown": 8,  # Fewer items to avoid overwhelming
                        "show_descriptions": True,  # Help users understand options
                        "show_icons": True,
                        "show_keyboard_shortcuts": True,
                    },
                },
            }

    def _configure_image_removal(self):
        # If saving images rather than delete, this is the bulk update size
        if not hasattr(settings, "DJ_BN_BULK_CREATE_BATCH_SIZE"):
            settings.DJ_BN_BULK_CREATE_BATCH_SIZE: int = 50  # type: ignore[attr-defined]

        # If True, images are deleted, otherwise the url is saved to a model for later processing
        if not hasattr(settings, "DJ_BN_IMAGE_DELETION"):
            settings.DJ_BN_IMAGE_DELETION: bool = True  # type: ignore[attr-defined]

        # Config required for image deletion handling, passed through the frontend.
        if not hasattr(settings, "DJ_BN_IMAGE_REMOVAL_CONFIG"):
            settings.DJ_BN_IMAGE_REMOVAL_CONFIG = {
                # Core Upload Settings
                "removalUrl": "/django-blocknote/remove-image/",
            }

        # The number that will trigger the image deletion form DB
        if not hasattr(settings, "DJ_BN_BULK_DELETE_BATCH_SIZE"):
            settings.DJ_BN_BULK_DELETE_BATCH_SIZE = 20

    def _configure_image_upload(self):
        if not hasattr(
            settings,
            "DJ_BN_PERMITTED_IMAGE_TYPES",
        ):  # For backend checks with filetype
            settings.DJ_BN_PERMITTED_IMAGE_TYPES: list[str] = [  # type: ignore[attr-defined]
                "jpg",
                "jpeg",
                "png",
                "gif",
                "bmp",
                "webp",
                "tiff",
            ]

        if not hasattr(settings, "DJ_BN_IMAGE_FORMATTER"):
            settings.DJ_BN_IMAGE_FORMATTER = (
                "django_blocknote.image.convert_image_to_webp"
            )
        if not hasattr(settings, "DJ_BN_IMAGE_STORAGE"):
            settings.DJ_BN_IMAGE_STORAGE = ""

        if not hasattr(settings, "DJ_BN_IMAGE_URL_HANDLER"):
            settings.DJ_BN_IMAGE_URL_HANDLER: str = ""  # type: ignore[attr-defined]

        if not hasattr(settings, "DJ_BN_FORMAT_IMAGE"):
            settings.DJ_BN_FORMAT_IMAGE = True  # False: keep original formt and name.

        if not hasattr(settings, "DJ_BN_STAFF_ONLY_IMAGE_UPLOADS"):
            settings.DJ_BN_STAFF_ONLY_IMAGE_UPLOADS: bool = False  # type: ignore[attr-defined]

        if not hasattr(settings, "DJ_BN_MAX_FILE_SIZE"):
            settings.DJ_BN_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

        # TODO: Probably delete and use uploadUrl
        if not hasattr(settings, "DJ_BN_UPLOAD_PATH"):
            settings.DJ_BN_UPLOAD_PATH = (
                "blocknote_uploads"  # Directory within MEDIA_ROOT
            )
        # Used by the frontend
        if not hasattr(settings, "DJ_BN_IMAGE_UPLOAD_CONFIG"):
            settings.DJ_BN_IMAGE_UPLOAD_CONFIG = {
                # Core Upload Settings
                "uploadUrl": "/django-blocknote/upload-image/",
                "maxFileSize": 10 * 1024 * 1024,  # 10MB
                "allowedTypes": ["image/*"],
                "showProgress": False,
                "maxConcurrent": 3,
                "img_model": "",  # Optional: Django model for custom image handling
                # Upload Behavior
                "timeout": 30000,  # Upload timeout in milliseconds
                "chunkSize": 1024 * 1024,  # Upload chunk size for large files
                "retryAttempts": 3,  # Number of retry attempts on failure
                "retryDelay": 1000,  # Delay between retries in milliseconds
                # Image Processing
                "autoResize": True,  # Auto-resize large images
                "maxWidth": 1920,  # Max width for resized images
                "maxHeight": 1080,  # Max height for resized images
                "quality": 85,  # JPEG compression quality (1-100)
                "format": "auto",  # Output format: "auto", "jpeg", "png", "webp"
                #
                # NOTE:Not implemented, for future consideration.
                #
                # Storage & Naming
                # "uploadPath": "blocknote/images/",  # Storage path within MEDIA_ROOT  # noqa:  E501,ERA001
                # "generateThumbnails": False,  # Generate thumbnail versions  # noqa:  E501,ERA001
                # "thumbnailSizes": [150, 300],  # Thumbnail widths if enabled  # noqa:  E501,ERA001
                # "filenamePrefix": "",  # Prefix for uploaded filenames  # noqa: ERA001
                # "preserveFilename": False,  # Keep original filename vs generated  # noqa:  E501,ERA001
                # Security & Validation
                # "validateDimensions": False,  # Validate image dimensions # noqa: E501, ERA001
                # "minWidth": 0,  # Minimum image width  # noqa: ERA001
                # "minHeight": 0,  # Minimum image height  # noqa:  ERA001
                # "maxDimensions": 4096,  # Maximum width or height  # noqa: E501, ERA001
                # "allowSvg": False,  # Allow SVG uploads (security consideration)  # noqa: E501, ERA001
                # "scanForMalware": False,  # Enable malware scanning if available  # noqa: E501, ERA001
                # UI/UX
                # "showPreview": True,  # Show image preview during upload  # noqa:  E501,ERA001
                # "dragDropEnabled": True,  # Enable drag & drop uploads  # noqa: ERA001
                # "pasteEnabled": True,  # Enable paste from clipboard  # noqa: ERA001
                # "cropEnabled": False,  # Enable image cropping UI  # noqa: ERA001
                # "rotateEnabled": False,  # Enable image rotation  # noqa: ERA001
                # Integration
                # "csrfTokenSource": "form",  # "form", "meta", "cookie"  # noqa: ERA001
                # "customHeaders": {},  # Additional HTTP headers  # noqa: ERA001
                # "transformResponse": None,  # Custom response transformation  # noqa: E501, ERA001
            }

    # TODO: Update with DJ_BN and tie in with ones above
    def _configure_blocknote_settings(self):
        """Set up BlockNote-specific settings with defaults."""
        default_blocknote_config = {
            "DEFAULT_CONFIG": {
                "placeholder": "Start writing...",
                "editable": True,
                "theme": "light",
                "animations": True,
                "collaboration": False,
            },
            "WIDGET_CONFIG": {
                "include_css": True,
                "include_js": True,
                "css_class": "django-blocknote-widget",
            },
            "FIELD_CONFIG": {
                "null": True,
                "blank": True,
                "default": dict,
            },
            # "STATIC_URL": "/static/django_blocknote/",
            "DEBUG": getattr(settings, "DEBUG", False),
        }

        # Merge with user settings if they exist
        user_config = getattr(settings, "DJANGO_BLOCKNOTE", {})

        # Deep merge the configurations
        merged_config = self._deep_merge_dict(default_blocknote_config, user_config)

        # Set the final configuration
        settings.DJANGO_BLOCKNOTE = merged_config

    def _deep_merge_dict(self, default_dict, user_dict):
        """Recursively merge user configuration with defaults."""
        result = default_dict.copy()

        for key, value in user_dict.items():
            if (
                key in result
                and isinstance(result[key], dict)
                and isinstance(value, dict)
            ):
                result[key] = self._deep_merge_dict(result[key], value)
            else:
                result[key] = value

        return result

    #     try:
    #         self._enhance_admin_classes()
    #     except Exception as e:
    #         logger.warning(f"Failed to enhance admin classes: {e}")
    #
    # def _enhance_admin_classes(self):
    #     try:
    #         from django.contrib import admin
    #         from django.apps import apps
    #         from django.utils.html import format_html
    #         from django.template import Context, Template
    #         from .fields import BlockNoteField
    #
    #         # Find all models with BlockNote fields
    #         for model in apps.get_models():
    #             blocknote_fields = [
    #                 field.name
    #                 for field in model._meta.get_fields()
    #                 if isinstance(field, BlockNoteField)
    #             ]
    #
    #             if blocknote_fields and model in admin.site._registry:
    #                 logger.info(
    #                     f"Enhancing admin for {model.__name__} with BlockNote fields: {blocknote_fields}"
    #                 )
    #
    #                 # Get current admin class
    #                 current_admin = admin.site._registry[model]
    #                 admin_class = current_admin.__class__
    #
    #                 # Create enhanced admin class
    #                 class EnhancedBlockNoteAdmin(admin_class):
    #                     def __init__(self, model, admin_site):
    #                         super().__init__(model, admin_site)
    #                         self._setup_blocknote_previews()
    #
    #                     class Media:
    #                         # Merge with existing media if it exists
    #                         existing_media = getattr(admin_class, "Media", None)
    #                         if existing_media:
    #                             css = getattr(existing_media, "css", {})
    #                             js = list(getattr(existing_media, "js", []))
    #                             # Add BlockNote assets
    #                             css.setdefault("all", []).append(
    #                                 "django_blocknote/css/blocknote.css"
    #                             )
    #                             js.append("django_blocknote/js/blocknote.js")
    #                         else:
    #                             css = {"all": ("django_blocknote/css/blocknote.css",)}
    #                             js = ("django_blocknote/js/blocknote.js",)
    #
    #                     def _setup_blocknote_previews(self):
    #                         """Add preview fields for BlockNote fields"""
    #                         preview_fields = []
    #
    #                         for field_name in blocknote_fields:
    #                             preview_method_name = f"{field_name}_preview"
    #                             preview_fields.append(preview_method_name)
    #
    #                             # Create the preview method
    #                             def make_preview_method(fname):
    #                                 def preview_method(admin_self, obj):
    #                                     try:
    #                                         content = getattr(obj, fname, None)
    #                                         if content:
    #                                             # Include BlockNote assets and render
    #                                             template_str = """
    #                                             {% load blocknote_tags %}
    #                                             {% blocknote_full %}
    #                                             {% blocknote_viewer content %}
    #                                             """
    #                                             template = Template(template_str)
    #                                             context = Context({"content": content})
    #                                             rendered = template.render(context)
    #                                             return format_html(rendered)
    #                                         else:
    #                                             return format_html(
    #                                                 '<em style="color: #999;">No content</em>'
    #                                             )
    #                                     except Exception as e:
    #                                         logger.error(
    #                                             f"Error rendering BlockNote preview for {fname}: {e}"
    #                                         )
    #                                         return format_html(
    #                                             '<em style="color: #d32f2f;">Error rendering preview</em>'
    #                                         )
    #
    #                                 preview_method.short_description = (
    #                                     f"{fname.replace('_', ' ').title()} Preview"
    #                                 )
    #                                 return preview_method
    #
    #                             # Add the method to the class
    #                             setattr(
    #                                 EnhancedBlockNoteAdmin,
    #                                 preview_method_name,
    #                                 make_preview_method(field_name),
    #                             )
    #
    #                         # Add preview fields to readonly_fields
    #                         existing_readonly = list(
    #                             getattr(self, "readonly_fields", [])
    #                         )
    #                         self.readonly_fields = tuple(
    #                             existing_readonly + preview_fields
    #                         )
    #
    #                 # Re-register with enhanced admin
    #                 admin.site.unregister(model)
    #                 admin.site.register(model, EnhancedBlockNoteAdmin)
    #     except ImportError:
    #         logger.info("Django admin not available, skipping admin enhancement")
    #     except Exception as e:
    #         logger.error(f"Error in admin enhancement: {e}")
    #         # Don't break the app if admin enhancement fails
