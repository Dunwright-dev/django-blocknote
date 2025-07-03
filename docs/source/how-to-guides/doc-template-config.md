# How to Configure Template Limits

This guide shows you how to set up template size limits for your Django BlockNote fields to prevent performance issues and provide a better user experience.

## Quick Setup

### Step 1: Configure Your Model Field

Add `template_max_blocks` to your BlockNoteField:

```python
from django.db import models
from django_blocknote.models.fields import BlockNoteField

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = BlockNoteField(
        help_text="Main blog content",
        template_max_blocks=500,  # Limit templates to 500 blocks
        editor_config={'placeholder': 'Write your blog post...'},
    )
```

### Step 2: Use the Model Form Mixin

Create a clean form using the mixin:

```python
from django import forms
from django_blocknote.forms.mixins import BlockNoteModelFormMixin
from .models import BlogPost

class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        # template_max_blocks=500 automatically applied from model
```

That's it! Your template limits are now active.

## Choosing the Right Limits

Set limits based on your content type:

```python
class Document(models.Model):
    # Quick notes - small templates
    notes = BlockNoteField(template_max_blocks=100)
    
    # Blog posts - medium templates  
    content = BlockNoteField(template_max_blocks=500)
    
    # Legal documents - large templates
    contract = BlockNoteField(template_max_blocks=5000)
```

## Setting Global Defaults

Configure fallback limits in your Django settings:

```python
# settings.py
DJ_BN_TEMPLATE_CONFIG = {
    'maxBlocks': 1000,  # Default for fields without explicit limits
}
```

## What Happens When Limits Are Exceeded

When a user tries to insert a template that's too large, they see a helpful error message:

```
⚠️ Template Too Large

This template contains 1500 blocks, which exceeds the maximum limit of 500 blocks.

Suggested Solutions:
• Break this template into smaller, more focused templates
• Remove unnecessary formatting or empty blocks
• Contact your administrator to increase the template size limit
```

## Performance Benefits

Template limits provide:

- **Prevents UI freezing**: Large templates are chunked into smaller pieces
- **Better user experience**: Clear feedback when templates are too large
- **Configurable per field**: Different limits for different content types

## Common Patterns

### Multi-field documents with different limits:

```python
class Report(models.Model):
    title = models.CharField(max_length=200)
    
    summary = BlockNoteField(
        help_text="Executive summary",
        template_max_blocks=100,  # Small templates
    )
    
    content = BlockNoteField(
        help_text="Main content", 
        template_max_blocks=1500,  # Large templates
    )
    
    appendix = BlockNoteField(
        help_text="Additional materials",
        template_max_blocks=2000,  # Very large templates
    )
```

### Different apps with different needs:

```python
# Blog app - moderate limits
class BlogPost(models.Model):
    content = BlockNoteField(template_max_blocks=500)

# Legal app - high limits  
class Contract(models.Model):
    content = BlockNoteField(template_max_blocks=5000)

# Notes app - low limits
class Note(models.Model):
    content = BlockNoteField(template_max_blocks=100)
```

## Troubleshooting

**Templates not inserting?**
- Check the browser console for errors
- Verify your template limit isn't too restrictive

**Performance issues?**
- Lower the `template_max_blocks` value
- Check if templates are unnecessarily large

**Configuration not working?**
- Ensure you're using `BlockNoteModelFormMixin`
- Verify the model field parameter is spelled correctly

## Next Steps

- **For complete configuration options**: See [Template Configuration Reference](../reference/document-template-config.md)
- **For creating templates**: See [Document Templates](./document-templates.md)
- **For advanced customization**: Check the API reference section

---

*Template limits help maintain performance while providing clear feedback to users. Configure them based on your specific content needs.*
