# Document Template System

```{caution}
This system is working but "held together by toothpicks" its a solid foundation for further development.
```

## Overview

The django-blocknote document template system provides users with personal, reusable content templates accessible through the BlockNote editor's slash menu. Templates are cached for performance and automatically synchronized with user actions.

## Architecture

The system consists of several interconnected components that work together to deliver templates from the database to the editor interface:

```{mermaid}
graph TD
    A[DocumentTemplate Model] --> B[Cache Layer]
    B --> C[Widget Context]
    C --> D[DOM Script Tags]
    D --> E[BlockNote Editor]
    E --> F[Slash Menu /t]
    
    G[Form Mixins] --> C
    H[View Mixins] --> G
    I[Django Views] --> H
    
    J[Admin Interface] --> A
    K[User Actions] --> A
    A --> L[Cache Refresh]
    L --> B
    
    style A fill:#e1f5fe
    style F fill:#c8e6c9
    style B fill:#fff3e0
```

## Core Components

### DocumentTemplate Model

The `DocumentTemplate` model stores user-specific templates with automatic cache management:

```python
class DocumentTemplate(models.Model):
    title = models.CharField(max_length=200)
    content = models.JSONField()  # BlockNote blocks
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    show_in_menu = models.BooleanField(default=True)
    # ... other fields
    
    @classmethod
    def get_cached_templates(cls, user):
        """Get templates from cache with DB fallback"""
        
    def save(self, *args, **kwargs):
        """Auto-refresh cache on save"""
```

### Cache System

Templates are cached per-user to avoid database queries on every page load:

- **Cache Key Pattern**: `djbn_templates_user_{user_id}`
- **Cache Duration**: 1 hour
- **Auto-Refresh**: On save, delete, and bulk operations
- **Fallback**: Database query if cache miss

### Form and View Mixins

Two mixins handle the flow of user context to BlockNote widgets:

#### BlockNoteUserViewMixin
```python
class MyCreateView(BlockNoteUserViewMixin, CreateView):
    model = BlogPost
    form_class = BlogPostForm
    # User automatically passed to form
```

#### BlockNoteUserFormMixin
```python
class BlogPostForm(BlockNoteUserFormMixin):
    class Meta:
        model = BlogPost
        fields = ['content']
        widgets = {'content': BlockNoteWidget()}
    # User automatically configured in widget.attrs
```

## Data Flow

The template data follows this path from model to editor:

### 1. Model → Cache
- User creates/edits template
- `save()` method triggers cache refresh
- Templates stored as JSON array in cache

### 2. Cache → Widget
- View mixin passes user to form
- Form mixin sets user in widget.attrs
- Widget retrieves cached templates

### 3. Widget → DOM
- Widget renders templates as JSON in script tag:
```html
<script id="editor_123_doc_templates">
[{"id": "1", "title": "Meeting Notes", "content": [...]}]
</script>
```

### 4. DOM → Editor
- DOM scanner extracts templates from script tag
- Templates passed to BlockNote editor initialization
- Available in slash menu via `/t` trigger

## Simple Usage

### Basic Form Setup
```python
# forms.py
from django_blocknote.mixins import BlockNoteModelFormMixin

class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']

# views.py  
from django_blocknote.mixins import BlockNoteUserViewMixin

class BlogPostCreateView(BlockNoteUserViewMixin, CreateView):
    model = BlogPost
    form_class = BlogPostForm
```

### Template Creation
Templates can be created through:
- Django admin interface
- Custom management commands
- API endpoints (future enhancement)

### Editor Integration
Templates automatically appear in the BlockNote editor:
- Type `/` for standard blocks
- Type `/t` for user templates
- Type `/t meeting` to filter templates

## Admin Interface

The admin interface provides template management with optional Unfold integration:

```python
# Check for Django Unfold and use enhanced UI if available
try:
    from unfold.admin import ModelAdmin as UnfoldModelAdmin
    BaseModelAdmin = UnfoldModelAdmin
except ImportError:
    BaseModelAdmin = admin.ModelAdmin

class BlockNoteModelAdmin(BlockNoteAdminMixin, BaseModelAdmin):
    """Uses Unfold styling if available, falls back to standard Django admin"""
```

### Admin Features
- **Read-only access** for regular staff
- **Full editing** for superusers only
- **Template preview** showing content structure
- **User filtering** and search capabilities
- **Automatic Unfold styling** when django-unfold is installed

## Performance Considerations

### Cache Strategy
- Templates cached on first access
- Cache invalidated on any template modification
- Low-frequency writes, high-frequency reads
- Scales well with user growth

### Query Optimization
- Database indexes on frequently queried fields
- Single query to load all user templates
- Minimal database hits during normal operation

## Current Limitations

This system is functional but still evolving:

- **Template sharing** between users not yet implemented
- **Template categories** planned for better organization
- **Import/export** functionality in development
- **Template variables** (like `{{DATE}}`) not yet processed

## Future Enhancements

- Template marketplace for sharing
- Variable substitution system
- Template usage analytics
- Bulk template operations
- Advanced template editor interface
