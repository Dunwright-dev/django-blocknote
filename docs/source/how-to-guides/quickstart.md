# How to Set Up Django BlockNote Custom Field

```{admonition} Quickstart
We are making updates quite quickly so the quickstart
may get out of sync. Please create an issue if something
is incorrect.
```
## Overview

This guide walks you through setting up the Django BlockNote custom field in your Django project. Django BlockNote provides a rich text editor with block-based content editing capabilities, complete with customizable options for different user types and use cases.

## Prerequisites

- Django 4.2 or higher
- Python 3.8 or higher
- Basic understanding of Django models, forms, and views

## Installation

### Step 1: Install the Package

```bash
pip install django-blocknote
```

### Step 2: Add to Django Settings

Add `django_blocknote` to your `INSTALLED_APPS`:

```python
# settings.py
INSTALLED_APPS = [
    # ... your other apps
    'django_blocknote',
]
```

### Step 3: Run Migrations

```bash
python manage.py migrate
```

## Basic Field Setup

### Import the Field

```python
from django_blocknote.fields import BlockNoteField
```

### Add to Your Model

Here's a simple example for a blog post model:

```python
from django.db import models
from django_blocknote.fields import BlockNoteField

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = BlockNoteField(
        help_text="Main content of the blog post",
        blank=True,
        editor_config={
            'placeholder': 'Write your blog post content here...',
            'theme': 'light',
            'animations': True,
        },
        image_upload_config={
            'img_model': 'blog:BlogPost',  # app:model format
            'maxFileSize': 10 * 1024 * 1024,  # 10MB
            'allowedTypes': ['image/*']
        },
        image_removal_config={
            'removalUrl': '/django-blocknote/remove-image/',
            'retryAttempts': 3,
        },
        menu_type='admin',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## Configuration Options

### Editor Configuration

The `editor_config` parameter accepts the following options:

```python
editor_config = {
    'placeholder': 'Start writing...',    # Placeholder text
    'theme': 'light',                     # 'light' or 'dark'
    'animations': True,                   # Enable/disable animations
    'editable': True,                     # Make editor readonly if False
    'collaboration': False,               # Enable collaboration features
}
```

### Image Upload Configuration

Configure image handling with `image_upload_config`:

```python
image_upload_config = {
    'img_model': 'app:Model',            # Django model reference
    'maxFileSize': 10 * 1024 * 1024,     # Maximum file size (10MB)
    'allowedTypes': ['image/*'],         # Allowed MIME types
    'uploadUrl': '/custom-upload-url/',   # Custom upload endpoint
    'showProgress': True,                # Show upload progress
    'maxConcurrent': 3,                  # Max concurrent uploads
    'autoResize': True,                  # Auto-resize large images
    'maxWidth': 1920,                    # Max width for resized images
    'maxHeight': 1080,                   # Max height for resized images
    'quality': 85,                       # JPEG quality (1-100)
}
```

### Image Removal Configuration

Handle image deletion with `image_removal_config`:

```python
image_removal_config = {
    'removalUrl': '/django-blocknote/remove-image/',  # Removal endpoint
    'retryAttempts': 3,                              # Retry attempts on failure
    'timeout': 30000,                                # Timeout in milliseconds
}
```

### Menu Type Configuration

The `menu_type` parameter controls which slash menu configuration to use:

- `'default'`: Limited feature set for regular users
- `'admin'`: Full access to all features
- `'blog'`: Optimized for blog content
- `'documentation'`: Suitable for documentation
- `'template'`: Template creation mode

```python
# Example configurations
content = BlockNoteField(menu_type='default')    # Regular users
content = BlockNoteField(menu_type='admin')      # Administrators
content = BlockNoteField(menu_type='blog')       # Blog posts
```

## Setting Up Forms and Views

### Form Configuration

Use the provided mixins to handle user context and widget configuration:

```python
from django import forms
from django_blocknote.mixins import BlockNoteModelFormMixin

class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
```

### View Configuration

Use the view mixin to automatically pass user context:

```python
from django.views.generic import CreateView, UpdateView
from django_blocknote.mixins import BlockNoteUserViewMixin

class BlogPostCreateView(BlockNoteUserViewMixin, CreateView):
    model = BlogPost
    form_class = BlogPostForm
    template_name = 'blog/create_post.html'

class BlogPostUpdateView(BlockNoteUserViewMixin, UpdateView):
    model = BlogPost
    form_class = BlogPostForm
    template_name = 'blog/update_post.html'
```

## Architecture Overview

```{mermaid}
graph TD
    A[Django Model] --> B[BlockNoteField]
    B --> C[BlockNoteWidget]
    C --> D[Frontend Editor]
    
    E[User Request] --> F[View with BlockNoteUserViewMixin]
    F --> G[Form with BlockNoteModelFormMixin]
    G --> C
    
    D --> H[Image Upload Handler]
    D --> I[Content Serialization]
    H --> J[Image Storage]
    I --> K[Database Storage]
    
    L[App Configuration] --> M[Settings & Defaults]
    M --> N[Slash Menu Config]
    M --> O[Image Handling Config]
    M --> P[Editor Theme Config]
```

## Configuration Flow

```{mermaid}
sequenceDiagram
    participant App as Django App
    participant Config as AppConfig
    participant Settings as Django Settings
    participant Field as BlockNoteField
    participant Widget as BlockNoteWidget
    
    App->>Config: App startup
    Config->>Settings: Configure defaults
    Settings->>Settings: Merge user settings
    Field->>Settings: Read configuration
    Field->>Widget: Initialize with config
    Widget->>Widget: Render editor with settings
```

## Advanced Configuration Examples

### Multiple BlockNote Fields

```python
class Article(models.Model):
    title = models.CharField(max_length=200)
    
    # Introduction with limited features
    introduction = BlockNoteField(
        help_text="Article introduction",
        menu_type='default',
        editor_config={
            'placeholder': 'Write a compelling introduction...',
            'theme': 'light',
        }
    )
    
    # Main content with full features for admins
    content = BlockNoteField(
        help_text="Main article content",
        menu_type='admin',
        editor_config={
            'placeholder': 'Write the main content...',
            'theme': 'light',
            'animations': True,
        }
    )
    
    # Conclusion with template mode
    conclusion = BlockNoteField(
        help_text="Article conclusion",
        menu_type='template',
        editor_config={
            'placeholder': 'Summarize the key points...',
            'theme': 'light',
        }
    )
```

### Custom Image Model Integration

```python
# Custom image model
class BlogImage(models.Model):
    image = models.ImageField(upload_to='blog_images/')
    alt_text = models.CharField(max_length=200)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

# Field configuration with custom image model
class BlogPost(models.Model):
    content = BlockNoteField(
        image_upload_config={
            'img_model': 'blog:BlogImage',
            'maxFileSize': 5 * 1024 * 1024,  # 5MB limit
            'allowedTypes': ['image/jpeg', 'image/png', 'image/webp'],
        }
    )
```

### Function-Based View Integration

```python
from django_blocknote.mixins import BlockNoteModelFormMixin

def create_blog_post(request):
    if request.method == 'POST':
        form = BlogPostForm(request.POST, user=request.user)
        if form.is_valid():
            form.save()
            return redirect('blog:post_list')
    else:
        form = BlogPostForm(user=request.user)
    
    return render(request, 'blog/create_post.html', {'form': form})
```

## Troubleshooting

### Common Issues

1. **Widget not rendering properly**
   - Ensure you're using `BlockNoteUserViewMixin` in your views
   - Verify that `BlockNoteModelFormMixin` is used in your forms

2. **Image uploads failing**
   - Check `MEDIA_URL` and `MEDIA_ROOT` settings
   - Verify image upload permissions
   - Ensure the upload URL is properly configured

3. **User context not available**
   - Make sure to pass `user=request.user` to form initialization
   - Use the provided mixins for automatic user context handling

### Debug Mode

Enable debug output in your forms:

```python
class BlogPostForm(BlockNoteModelFormMixin):
    _debug_widget_config = True  # Enable debug output
    
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
```

## Next Steps

After setting up the basic field configuration:

1. Customize the slash menu configurations in your Django settings
2. Set up custom image storage and processing
3. Configure different editor themes for different user types
4. Implement content validation and sanitization
5. Set up content export and import functionality

## Related Configuration

For advanced customization, you'll need to configure the global Django BlockNote settings in your `settings.py`. This includes slash menu configurations, image handling settings, and theme customization options.
