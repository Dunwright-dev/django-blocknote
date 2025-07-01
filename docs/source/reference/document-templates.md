# Document Template

This reference documentation covers the core models, admin interfaces, and form handling for Django BlockNote templates and caching systems.

```{caution}
This system is working but "held together by toothpicks" its a solid foundation for further development.
```

```{admonition} Unfold Admin Support
:class: info

Django BlockNote provides basic compatibility with [django-unfold](https://github.com/unfoldadmin/django-unfold) admin theme. The admin interface will work with Unfold's styling, though some BlockNote-specific customizations may not be fully optimized for the Unfold design system.
```

## DocumentTemplate Model

The `DocumentTemplate` model manages user-specific BlockNote templates with intelligent caching and ownership controls.

### Model Fields

#### Core Template Fields

```python
title = models.CharField(max_length=200)
```
The display title shown in the slash menu.

```python
subtext = models.CharField(max_length=20, blank=True)
```
Brief description displayed under the title in the slash menu (maximum 20 characters).

```python
aliases = models.JSONField(default=list, blank=True)
```
Search aliases stored as a JSON list. Accepts CSV input through forms, automatically converted to list format.

```python
group = models.CharField(max_length=100, blank=True)
```
Organizational group name for categorizing templates in the slash menu.

```python
icon = models.CharField(max_length=50, choices=ICON_CHOICES, default="template")
```
Icon identifier displayed in the slash menu. See `ICON_CHOICES` for available options.

```python
content = BlockNoteField(menu_type="template", ...)
```
The actual template content as BlockNote blocks (JSON structure).

#### Metadata Fields

```python
user = models.ForeignKey(User, on_delete=models.CASCADE)
```
Template owner. Controls access permissions and cache organization.

```python
show_in_menu = models.BooleanField(default=True)
```
Whether this template appears in the BlockNote slash menu.

```python
created_at = models.DateTimeField(auto_now_add=True)
```
Timestamp when the template was created.

### Cache Management Methods

#### get_cache_key(user_id)

```python
@staticmethod
def get_cache_key(user_id):
    """Generate cache key for user templates"""
    return f"djbn_templates_user_{user_id}"
```

**Parameters:**
- `user_id` (int): User ID for cache key generation

**Returns:**
- `str`: Cache key in format `djbn_templates_user_{user_id}`

#### get_cache_timeout()

```python
@classmethod
def get_cache_timeout(cls):
    """Get cache timeout from settings with sensible default"""
    return getattr(settings, 'DJANGO_BLOCKNOTE_CACHE_TIMEOUT', 3600)
```

**Returns:**
- `int`: Cache timeout in seconds (default: 3600 = 1 hour)

**Configuration:**
```python
# settings.py
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 1800  # 30 minutes
```

#### get_cached_templates(user)

```python
@classmethod
def get_cached_templates(cls, user):
    """Get user templates from cache, fallback to DB"""
```

**Parameters:**
- `user` (User): Django user instance

**Returns:**
- `list`: List of template dictionaries ready for frontend consumption

**Behavior:**
- Attempts cache retrieval first
- Falls back to database query and cache refresh on cache miss
- Logs cache hit/miss events for monitoring

```python
# Usage example
templates = DocumentTemplate.get_cached_templates(request.user)
```

#### refresh_user_cache(user)

```python
@classmethod
def refresh_user_cache(cls, user):
    """Refresh cache for a specific user's templates"""
```

**Parameters:**
- `user` (User): Django user instance

**Returns:**
- `list`: Refreshed template data

**Template Data Structure:**
```python
{
    "id": "123",
    "title": "Meeting Notes",
    "subtext": "Agenda & actions",
    "aliases": ["meeting", "notes", "agenda"],
    "group": "Business",
    "icon": "meeting",
    "content": [
        {
            "id": "block-1",
            "type": "heading",
            "props": {"level": 1},
            "content": [{"type": "text", "text": "Meeting Title"}]
        }
        # ... more blocks
    ]
}
```

#### invalidate_user_cache(user)

```python
@classmethod
def invalidate_user_cache(cls, user):
    """Invalidate cache for a specific user"""
```

**Parameters:**
- `user` (User): Django user instance

**Purpose:**
- Removes user's template cache
- Called automatically on user logout
- Useful for manual cache management

### Model Lifecycle Methods

#### save()

```python
def save(self, *args, **kwargs):
    """Override save to refresh cache"""
```

**Behavior:**
- Saves the model instance
- Automatically refreshes the user's template cache
- Logs save events with structured logging
- Handles errors gracefully with exception logging

**Note:** Aliases conversion from CSV to JSON list is handled by form layer, not in save method.

#### delete()

```python
def delete(self, *args, **kwargs):
    """Override delete to refresh cache after template removal"""
```

**Behavior:**
- Captures user and title before deletion
- Performs deletion
- Refreshes user's template cache
- Logs deletion events with context

### Cache Flow Diagram

```{mermaid}
graph TD
    A[Widget Render] --> B{Cache Hit?}
    B -->|Yes| C[Return Cached Templates]
    B -->|No| D[Query Database]
    D --> E[Build Template List]
    E --> F[Store in Cache]
    F --> G[Return Templates]
    
    H[Template Save] --> I[Refresh Cache]
    J[Template Delete] --> I
    K[User Logout] --> L[Invalidate Cache]
    
    style A fill:#e1f5fe
    style C fill:#c8e6c9
    style G fill:#c8e6c9
    style I fill:#fff3e0
    style L fill:#ffebee
```

## DocumentTemplateAdmin

Django admin interface for managing DocumentTemplate instances with ownership-based permissions and support-friendly access.

### Permission Model

#### Access Levels

1. **Superusers**: Full access to all templates
2. **Template Owners**: Full access to their own templates
3. **Admin Staff**: Read-only access to all templates (for support)

#### Permission Methods

##### has_change_permission(request, obj=None)

```python
def has_change_permission(self, request, obj=None):
    """Users can edit their own templates, all admin can view"""
```

**Logic:**
- `obj is None`: Returns `True` (changelist access)
- Superuser: Returns `True` (can edit anything)
- Others: Returns `True` (view access, editing controlled by readonly fields)

##### has_delete_permission(request, obj=None)

```python
def has_delete_permission(self, request, obj=None):
    """Only superusers and template owners can delete"""
```

**Logic:**
- `obj is None`: Returns `True` (changelist access)
- Superuser: Returns `True`
- Owner: Returns `True`
- Others: Returns `False`

##### get_readonly_fields(request, obj=None)

```python
def get_readonly_fields(self, request, obj=None):
    """Make everything readonly for non-superusers viewing others' templates"""
```

**Readonly Fields for Non-Superusers Viewing Others' Templates:**
- `title`
- `subtext`
- `aliases`
- `group`
- `icon`
- `content`
- `user`
- `show_in_menu`

### Admin Configuration

#### List Display

```python
list_display = ["title", "user", "group", "show_in_menu", "created_at"]
list_filter = ["group", "show_in_menu", "created_at"]
search_fields = ["title", "user__username", "subtext"]
readonly_fields = ["created_at"]
```

#### Query Optimization

```python
def get_queryset(self, request):
    """All admin users can see all templates (for support)"""
    return super().get_queryset(request).select_related("user")
```

### Security Features

#### Ownership Validation

```python
def save_model(self, request, obj, form, change):
    """Handle template saves with ownership validation"""
```

**New Template Creation:**
- Non-superusers automatically become the owner
- Superusers can set any owner

**Template Updates:**
- Non-superusers can only edit their own templates
- Ownership transfers require superuser privileges
- Raises `PermissionDenied` for unauthorized attempts

#### Bulk Delete Protection

```python
def delete_queryset(self, request, queryset):
    """Handle bulk delete with permission checks and cache refresh"""
```

**Security Checks:**
- Non-superusers can only bulk delete their own templates
- Permission validation before deletion
- Automatic cache refresh for affected users

**Error Handling:**
- Logs cache refresh failures
- Graceful handling of missing users
- Structured error logging

### Admin Permission Flow

```{mermaid}
graph TD
    A[Admin User Access] --> B{Is Superuser?}
    B -->|Yes| C[Full Access to All Templates]
    B -->|No| D{Owns Template?}
    D -->|Yes| E[Full Edit/Delete Access]
    D -->|No| F[Read-Only Access]
    
    G[Template Save] --> H{Ownership Change?}
    H -->|Yes| I{Is Superuser?}
    H -->|No| J[Normal Save + Cache Refresh]
    I -->|Yes| J
    I -->|No| K[PermissionDenied]
    
    L[Bulk Delete] --> M{Superuser or Own Templates?}
    M -->|Yes| N[Execute + Cache Refresh]
    M -->|No| O[PermissionDenied]
    
    style C fill:#c8e6c9
    style E fill:#c8e6c9
    style F fill:#fff3e0
    style J fill:#c8e6c9
    style K fill:#ffebee
    style N fill:#c8e6c9
    style O fill:#ffebee
```

## Form Mixins

### BlockNoteFormMixin

Core form mixin that provides automatic BlockNote widget configuration and aliases field processing.

#### Features

1. **Automatic Widget Configuration**: Detects and configures BlockNote widgets
2. **User Context Injection**: Passes user information to widgets
3. **Aliases Processing**: Converts CSV input to JSON list format

#### Usage

```python
from django_blocknote.forms.mixins import BlockNoteFormMixin

class MyTemplateForm(BlockNoteFormMixin, forms.ModelForm):
    class Meta:
        model = DocumentTemplate
        fields = ['title', 'aliases', 'content']
        widgets = {
            'content': BlockNoteWidget()
        }

# In view
form = MyTemplateForm(user=request.user)
```

#### Widget Configuration Method

```python
def _configure_blocknote_widgets(self):
    """Find and configure all BlockNote widgets with user context via attrs"""
```

**Behavior:**
- Automatically detects BlockNote widgets in form fields
- Injects user context through widget attributes
- Provides debug logging when enabled

**Debug Mode:**
```python
class MyForm(BlockNoteFormMixin, forms.ModelForm):
    _debug_widget_config = True  # Enable debug output
```

#### Aliases Processing: clean_aliases()

```python
def clean_aliases(self):
    """Convert CSV string input to JSON list for aliases field"""
```

**Input Handling:**

| Input Type | Example | Output |
|------------|---------|--------|
| Empty | `""` or `None` | `[]` |
| CSV String | `"meeting, notes, agenda"` | `["meeting", "notes", "agenda"]` |
| JSON String | `'["meeting", "notes"]'` | `["meeting", "notes"]` |
| List | `["meeting", "notes"]` | `["meeting", "notes"]` |

**Implementation Details:**
- Strips whitespace from individual aliases
- Removes empty aliases
- Handles both form input (CSV) and programmatic input (JSON/list)
- Graceful fallback for unexpected input types

#### Error Handling

```python
try:
    # Try parsing as JSON first (for API/programmatic input)
    import json
    return json.loads(aliases)
except (json.JSONDecodeError, ValueError):
    # Treat as CSV string (normal form input)
    return [alias.strip() for alias in aliases.split(',') if alias.strip()]
```

### Form Mixin Hierarchy

```python
# Base mixin with core functionality
class BlockNoteFormMixin:
    # Core widget configuration and aliases processing

# Convenience mixins
class BlockNoteFormMixin(BlockNoteFormMixin, forms.Form):
    # Ready-to-use form base class

class BlockNoteModelFormMixin(BlockNoteFormMixin, forms.ModelForm):
    # Ready-to-use model form base class

# Formset support
class BlockNoteUserFormsetMixin:
    # Handles user context for formsets
```

### Form Processing Flow

```{mermaid}
graph TD
    A[Form Initialization] --> B[Extract User from kwargs]
    B --> C[Call super init]
    C --> D[Configure BlockNote Widgets]
    D --> E[Form Ready for Use]
    
    F[Form Validation] --> G[Field Validation]
    G --> H[clean_aliases Called]
    H --> I{Input Type?}
    I -->|CSV String| J[Split and Clean]
    I -->|JSON String| K[Parse JSON]
    I -->|List| L[Return As-Is]
    I -->|Empty| M[Return Empty List]
    
    J --> N[Return Cleaned List]
    K --> N
    L --> N
    M --> N
    
    style E fill:#c8e6c9
    style N fill:#c8e6c9
```

## Integration Examples

### Basic Template Management

```python
# views.py
from django.views.generic import CreateView, UpdateView
from django_blocknote.views.mixins import BlockNoteViewMixin 
from django_blocknote.forms.mixins BlockNoteModelFormMixin

class DocumentTemplateForm(BlockNoteModelFormMixin):
    class Meta:
        model = DocumentTemplate
        fields = ['title', 'subtext', 'aliases', 'group', 'icon', 'content']
        widgets = {
            'content': BlockNoteWidget()
        }

class TemplateCreateView(BlockNoteUserViewMixin, CreateView):
    model = DocumentTemplate
    form_class = DocumentTemplateForm
    
class TemplateUpdateView(BlockNoteUserViewMixin, UpdateView):
    model = DocumentTemplate
    form_class = DocumentTemplateForm
    
    def get_queryset(self):
        # Users can only edit their own templates
        return DocumentTemplate.objects.filter(user=self.request.user)
```

### Advanced Usage with Custom Validation

```python
class AdvancedTemplateForm(BlockNoteModelFormMixin):
    class Meta:
        model = DocumentTemplate
        fields = ['title', 'aliases', 'content', 'group']
    
    def clean_title(self):
        title = self.cleaned_data['title']
        # Check for duplicate titles for this user
        if DocumentTemplate.objects.filter(
            user=self.user, 
            title=title
        ).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise forms.ValidationError("You already have a template with this title.")
        return title
    
    def clean(self):
        cleaned_data = super().clean()
        # Custom cross-field validation
        if not cleaned_data.get('aliases') and not cleaned_data.get('group'):
            raise forms.ValidationError(
                "Templates must have either aliases or be assigned to a group."
            )
        return cleaned_data
```

### Performance Monitoring

```python
# Custom cache monitoring
class MonitoredDocumentTemplate(DocumentTemplate):
    class Meta:
        proxy = True
    
    @classmethod
    def get_cache_stats(cls):
        """Get cache statistics for monitoring"""
        from django.core.cache import cache
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        stats = {
            'total_users': User.objects.count(),
            'cached_users': 0,
            'total_cache_size': 0
        }
        
        for user in User.objects.all():
            cache_key = cls.get_cache_key(user.id)
            cached_data = cache.get(cache_key)
            if cached_data:
                stats['cached_users'] += 1
                stats['total_cache_size'] += len(str(cached_data))
        
        return stats
```

## Configuration Reference

### Settings

```python
# settings.py

# Cache timeout for template data (seconds)
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 3600  # Default: 1 hour

# Example configurations for different use cases:

# High-frequency changes
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 300  # 5 minutes

# Stable production environment
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 86400  # 24 hours

# Development/testing
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 60  # 1 minute

# Disable caching (always fetch from DB)
DJANGO_BLOCKNOTE_CACHE_TIMEOUT = 0
```

### Logging Configuration

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'django_blocknote.log',
        },
    },
    'loggers': {
        'django_blocknote.models': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
        'django_blocknote.signals': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

## Troubleshooting

### Common Issues

#### Cache Not Refreshing

**Symptoms:** Templates don't appear in slash menu after saving

**Solutions:**
1. Check cache backend configuration
2. Verify `DJANGO_BLOCKNOTE_CACHE_TIMEOUT` setting
3. Check logs for cache refresh errors
4. Manually invalidate cache: `DocumentTemplate.invalidate_user_cache(user)`

#### Permission Denied in Admin

**Symptoms:** Admin users can't edit templates

**Cause:** Non-superuser trying to edit another user's template

**Solution:** Either:
- Make user a superuser
- Transfer template ownership
- User should create their own template

#### Aliases Not Converting

**Symptoms:** Form validation errors with aliases field

**Solutions:**
1. Ensure form inherits from `BlockNoteFormMixin`
2. Verify aliases field is `JSONField` in model
3. Check for custom `clean_aliases()` method conflicts

### Debug Mode

Enable debug logging for detailed troubleshooting:

```python
# In your form
class MyForm(BlockNoteModelFormMixin):
    _debug_widget_config = True
    
    def clean_aliases(self):
        print(f"Processing aliases: {self.data.get('aliases')}")
        return super().clean_aliases()
```

This will provide detailed output about widget configuration and aliases processing.
