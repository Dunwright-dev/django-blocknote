# Quickstart

```{admonition} Quickstart
We are making updates quite quickly so the quickstart
may get out of sync. Please [create an issue](https://github.com/Dunwright-dev/django-blocknote/issues)
if something is incorrect.
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

### Step 4: Include URLs

Add the django_blocknote URLs to your project's URL configuration:

```python
# urls.py
from django.urls import include, path

urlpatterns = [
    # ... your other URLs
    path('django-blocknote/', include('django_blocknote.urls')),
]
```

This provides the default image upload and removal endpoints. If you configure
custom `uploadUrl` or `removalUrl` values in your field config, you can skip
this step for those specific endpoints.

## Data Format

BlockNote stores content as a JSON array of block objects. A simple document
looks like this:

```json
[
    {
        "id": "abc123",
        "type": "heading",
        "props": {"level": 1},
        "content": [{"type": "text", "text": "Hello World"}],
        "children": []
    },
    {
        "id": "def456",
        "type": "paragraph",
        "props": {},
        "content": [{"type": "text", "text": "This is a paragraph."}],
        "children": []
    }
]
```

This is what gets saved to your database field and what you'll see if you
inspect the field value in the Django shell or admin.

## Basic Field Setup

### Import the Field

```python
from django_blocknote.models.fields import BlockNoteField
```

### Add to Your Model

Here's a simple example for a blog post model:

```python
from django.db import models
from django_blocknote.models.fields import BlockNoteField

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
            'img_model': 'blog:BlogPost',  # app_label:ModelName format
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

The `img_model` value uses `app_label:ModelName` format, matching your Django
app's label (from `AppConfig.label` or the last segment of the dotted app path)
and the model class name.

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

The `menu_type` parameter controls which slash menu configuration to use. Menu
types are defined in your Django settings via `DJ_BN_SLASH_MENU_CONFIGS`. The
widget looks up the specified `menu_type` key in this dictionary:

```python
# settings.py
DJ_BN_SLASH_MENU_CONFIGS = {
    '_default': {
        'enabled': False,
    },
    'admin': {
        'enabled': True,
        'mode': 'default',
    },
    'blog': {
        'enabled': True,
        'mode': 'filtered',
        'disabled_items': ['video', 'audio', 'file'],
    },
    'documentation': {
        'enabled': True,
        'mode': 'filtered',
        'disabled_items': ['image', 'video', 'audio'],
    },
}
```

If the specified `menu_type` is not found in `DJ_BN_SLASH_MENU_CONFIGS`, the
`_default` configuration is used as a fallback. A warning will appear in the
server logs when this happens.

Use the `menu_type` in your field definition:

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
from django_blocknote.views.mixins import BlockNoteViewMixin

class BlogPostCreateView(BlockNoteViewMixin, CreateView):
    model = BlogPost
    form_class = BlogPostForm
    template_name = 'blog/create_post.html'

class BlogPostUpdateView(BlockNoteViewMixin, UpdateView):
    model = BlogPost
    form_class = BlogPostForm
    template_name = 'blog/update_post.html'
```

### Template Setup

Include the form's media files in your template. This loads the BlockNote
editor JavaScript and CSS:

```html
{% block extra_head %}
  {{ form.media }}
{% endblock %}

<form method="post">
  {% csrf_token %}
  {{ form.as_div }}
  <button type="submit">Save</button>
</form>
```

Without `{{ form.media }}`, the editor will not render and you'll see the raw
textarea fallback instead.

### Displaying Content (Readonly Mode)

To render saved BlockNote content in a read-only view, use the widget's
readonly mode in your form:

```python
from django_blocknote.widgets import BlockNoteWidget

class BlogPostDisplayForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['content']
        widgets = {
            'content': BlockNoteWidget(mode='readonly'),
        }
```

This renders the editor without editing controls, toolbars, or the slash
menu — suitable for public-facing pages.

## Architecture Overview

```{mermaid}
graph TD
    A[Django Model] --> B[BlockNoteField]
    B --> C[BlockNoteWidget]
    C --> D[Frontend Editor]
    
    E[User Request] --> F[View with BlockNoteViewMixin]
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

## External Content Updates

BlockNote editors sync content to a hidden `<textarea>` element. When content
changes inside the editor, the textarea's value is updated automatically and
standard `change` and `input` events are dispatched — so any form-level
listener (autosave, validation, dirty tracking) can detect changes without
knowing about BlockNote.

The reverse direction — setting editor content from an external system —
requires an extra step. Setting the textarea's `.value` alone does not update
the visual editor, because BlockNote manages its own internal document state.

### Updating editor content from JavaScript

After setting the textarea's value, dispatch the `form-field:external-update`
event. BlockNote will parse the JSON and replace the editor content:

```javascript
const textarea = document.getElementById('id_content')  // your field's id
const blocks = [
    {
        "type": "paragraph",
        "content": [{"type": "text", "text": "Restored content"}]
    }
]

textarea.value = JSON.stringify(blocks)
textarea.dispatchEvent(new CustomEvent('form-field:external-update', { bubbles: true }))
```

### Event contract

| Property | Value |
|----------|-------|
| Event name | `form-field:external-update` |
| Dispatched on | The hidden `<textarea>` element |
| Bubbles | Yes |
| Prerequisite | `.value` must be set to valid BlockNote JSON before dispatch |
| Result | Editor replaces all blocks with the parsed content |

### Common use cases

- **Form autosave / draft restoration** — restoring saved form state from
  localStorage or a server endpoint
- **Form pre-fill** — populating editor content from a different data source
- **Testing** — setting editor content programmatically in integration tests

### Two-way event summary

| Direction | What happens | Event |
|-----------|-------------|-------|
| Editor → external | User edits content, textarea updated | `change` and `input` (standard DOM) |
| External → editor | System sets textarea value | `form-field:external-update` (custom) |

### Important notes

- The event name is intentionally generic and not BlockNote-specific. Other
  widget libraries can adopt the same convention.
- After the editor processes the update, it will fire its normal `onChange`
  cycle, which writes back to the textarea and dispatches `change`. This is
  expected and ensures form-level listeners stay in sync.
- The textarea value must be valid BlockNote JSON (an array of block objects).
  Invalid JSON is silently ignored with a console warning.
- If you are using a form autosave system that saves to localStorage, you may
  want to suppress the save cycle that occurs immediately after restoration to
  avoid writing identical data. A short cooldown flag in your autosave's change
  handler is the simplest approach.

### Integration with form autosave systems

```{mermaid}
sequenceDiagram
    participant AS as Form Autosave
    participant TA as Hidden Textarea
    participant BN as BlockNote Editor

    Note over AS,BN: Save direction (editor → autosave)
    BN->>TA: User edits → textarea.value = JSON
    BN->>TA: Dispatches 'change' event
    TA->>AS: Delegated listener detects change
    AS->>AS: Debounced save to localStorage

    Note over AS,BN: Restore direction (autosave → editor)
    AS->>TA: textarea.value = saved JSON
    AS->>TA: Dispatches 'input' event (for Alpine/frameworks)
    AS->>TA: Dispatches 'form-field:external-update'
    TA->>BN: Listener parses JSON
    BN->>BN: editor.replaceBlocks() — visual update
    BN->>TA: onChange fires → textarea write-back
    Note over AS: Cooldown suppresses redundant save
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
   - Ensure you're using `BlockNoteViewMixin` in your views
   - Verify that `BlockNoteModelFormMixin` is used in your forms
   - Check that `{{ form.media }}` is included in your template's `<head>`

2. **Image uploads failing**
   - Check `MEDIA_URL` and `MEDIA_ROOT` settings
   - Verify image upload permissions
   - Ensure the upload URL is properly configured
   - Confirm `django_blocknote.urls` is included in your URL configuration

3. **User context not available**
   - Make sure to pass `user=request.user` to form initialization
   - Use the provided mixins for automatic user context handling

4. **Menu type not working as expected**
   - Verify the `menu_type` key exists in `DJ_BN_SLASH_MENU_CONFIGS` in your settings
   - Check the server logs for warnings about missing menu type configurations
   - If no configuration is found, the `_default` fallback is used

5. **Programmatically setting editor content doesn't update the editor**
   - Setting the hidden textarea's `.value` directly won't update the visual editor
   - You must dispatch `form-field:external-update` on the textarea after setting the value
   - See the [External Content Updates](#external-content-updates) section for details

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
6. Integrate with form autosave or draft systems using the `form-field:external-update` event contract

## Related Configuration

For advanced customization, you'll need to configure the global Django BlockNote
settings in your `settings.py`. This includes slash menu configurations, image
handling settings, and theme customization options.
