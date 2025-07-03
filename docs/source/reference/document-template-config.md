# Django BlockNote Template Configuration Reference

## Overview

This reference guide covers the template configuration system for Django BlockNote, which provides safety limits, performance optimization, and flexible configuration for document templates. The system prevents oversized templates from breaking the editor while maintaining excellent user experience.

## Template Configuration System

### What is Template Configuration?

Template configuration controls how document templates are inserted into the BlockNote editor. It provides:

- **Safety limits**: Prevents templates that are too large from breaking the editor
- **Performance optimization**: Chunks large templates for smooth insertion
- **Model field configuration**: Set limits directly in the model field definition
- **Professional error handling**: Clear feedback when limits are exceeded

> **Note**: For information on creating and managing document templates themselves, see [Document Templates](./document-templates.md).

### Architecture Overview

```{mermaid}
flowchart TD
    A[Model Field] --> B[Widget Creation]
    B --> C[DOM Script Tags]
    C --> D[DOM Scanner]
    D --> E[Widget Manager]
    E --> F[BlockNote Editor]
    F --> G[Slash Menu]
    G --> H[Template Insertion]
    
    I[Django Settings] --> A
    
    H --> J{Template Size Check}
    J -->|Small| K[Direct Insertion]
    J -->|Large| L[Chunked Insertion]
    J -->|Too Large| M[Error Message]
```

## Configuration Options

### Template Configuration Object

```typescript
interface TemplateConfig {
    maxBlocks: number;   // Maximum blocks allowed in a template
    chunkSize: number;   // Blocks to insert per chunk (performance)
}
```

### Default Values

```typescript
const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = {
    maxBlocks: 1000,   // Reasonable limit for most use cases
    chunkSize: 200,    // Optimized for browser performance
};
```

## Django Configuration

### Method 1: Model Field Configuration (Recommended)

Configure limits directly in your model field definitions:

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
            'img_model': 'blog:BlogPost',
            'maxFileSize': 10 * 1024 * 1024,  # 10MB
            'allowedTypes': ['image/*']
        },
        menu_type='admin',
        template_max_blocks=500,  # Configure template limit here
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### Different Use Cases with Model Fields

```python
class LegalDocument(models.Model):
    title = models.CharField(max_length=200)
    contract_content = BlockNoteField(
        help_text="Legal contract content",
        # Large templates for complex legal documents
        template_max_blocks=5000,
        editor_config={'placeholder': 'Select a contract template...'},
        menu_type='template',
    )

class QuickNote(models.Model):
    content = BlockNoteField(
        help_text="Quick note content",
        # Small templates for simple notes
        template_max_blocks=100,
        editor_config={'placeholder': 'Quick note...'},
        menu_type='minimal',
    )

class Article(models.Model):
    title = models.CharField(max_length=200)
    summary = BlockNoteField(
        help_text="Article summary",
        # Very small templates for summaries
        template_max_blocks=50,
        editor_config={'placeholder': 'Brief summary...'},
    )
    main_content = BlockNoteField(
        help_text="Main article content",
        # Medium templates for articles
        template_max_blocks=1000,
        editor_config={'placeholder': 'Write your article...'},
    )
    appendix = BlockNoteField(
        help_text="Additional information",
        # Large templates for appendices
        template_max_blocks=2000,
        editor_config={'placeholder': 'Additional content...'},
    )
```

### Clean Forms with Model Configuration

With model field configuration, your forms become very simple:

```python
from django import forms
from django_blocknote.forms.mixins import BlockNoteModelFormMixin
from .models import BlogPost, LegalDocument, QuickNote, Article

class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        # No widget configuration needed!
        # template_max_blocks=500 automatically applied from model

class LegalDocumentForm(BlockNoteModelFormMixin):
    class Meta:
        model = LegalDocument
        fields = ['title', 'contract_content']
        # template_max_blocks=5000 automatically applied from model

class QuickNoteForm(BlockNoteModelFormMixin):
    class Meta:
        model = QuickNote
        fields = ['content']
        # template_max_blocks=100 automatically applied from model

class ArticleForm(BlockNoteModelFormMixin):
    class Meta:
        model = Article
        fields = ['title', 'summary', 'main_content', 'appendix']
        # Each field gets its own template limit from the model:
        # summary: 50, main_content: 1000, appendix: 2000
```

### Method 2: Global Settings (Fallback)

Set default limits for fields that don't specify `template_max_blocks`:

```python
# settings.py
DJ_BN_TEMPLATE_CONFIG = {
    'maxBlocks': 1000,  # Default for fields without explicit limits
}
```

### Configuration Precedence

The system uses this order of precedence:

1. **Model field parameter** (highest priority)
2. **Django settings**
3. **Hard-coded defaults** (fallback)

```python
# settings.py
DJ_BN_TEMPLATE_CONFIG = {'maxBlocks': 1500}  # Global default

class MyModel(models.Model):
    # This field uses global setting (1500 blocks)
    content1 = BlockNoteField()
    
    # This field overrides global setting (500 blocks)
    content2 = BlockNoteField(template_max_blocks=500)
    
    # This field uses a different limit (2000 blocks)
    content3 = BlockNoteField(template_max_blocks=2000)
```

## Template Insertion Behavior

The following describes how templates are inserted into the editor. For details on template structure and creation, see [Document Templates](./document-templates.md).

### Small Templates (≤ chunkSize)

Templates smaller than the chunk size are inserted immediately:

```{mermaid}
sequenceDiagram
    participant User
    participant SlashMenu
    participant Editor
    
    User->>SlashMenu: Select template
    SlashMenu->>Editor: insertBlocks(allBlocks)
    Editor->>Editor: Position cursor at first editable block
    Editor->>User: Template ready for editing
```

### Large Templates (> chunkSize, ≤ maxBlocks)

Large templates are inserted in chunks to prevent UI freezing:

```{mermaid}
sequenceDiagram
    participant User
    participant SlashMenu
    participant Editor
    
    User->>SlashMenu: Select large template
    SlashMenu->>Editor: insertBlocks(chunk1)
    Note over Editor: Wait 10ms
    SlashMenu->>Editor: insertBlocks(chunk2)
    Note over Editor: Wait 10ms
    SlashMenu->>Editor: insertBlocks(chunkN)
    Editor->>Editor: Position cursor at first editable block
    Editor->>User: Template ready for editing
```

### Oversized Templates (> maxBlocks)

Templates exceeding the limit show an error message instead:

```{mermaid}
sequenceDiagram
    participant User
    participant SlashMenu
    participant Editor
    
    User->>SlashMenu: Select oversized template
    SlashMenu->>SlashMenu: Check template size
    SlashMenu->>Editor: insertBlocks(errorMessage)
    Editor->>User: Error with solutions displayed
```

## Error Handling

### Error Message Structure

When a template exceeds the block limit, users see a professional error message:

```
⚠️ Template Too Large

This template contains 1500 blocks, which exceeds the maximum limit of 1000 blocks.

Suggested Solutions:
• Break this template into smaller, more focused templates
• Remove unnecessary formatting or empty blocks  
• Contact your administrator to increase the template size limit
```

### Error Message Implementation

The error is inserted as structured blocks:

```javascript
const errorBlocks = [
    {
        id: 'error-header-123',
        type: 'heading',
        props: { level: 2, textColor: 'red' },
        content: [{ type: 'text', text: '⚠️ Template Too Large' }]
    },
    {
        id: 'error-desc-123', 
        type: 'paragraph',
        content: [{ 
            type: 'text', 
            text: `This template contains ${count} blocks, exceeds limit of ${max}.`
        }]
    },
    // ... solution bullets
];
```

## Performance Considerations

### Why Chunked Insertion?

BlockNote can handle large documents (thousands of blocks) but struggles with inserting many blocks simultaneously. Chunked insertion solves this by:

1. **Preventing UI freezing**: Small delays between chunks keep the interface responsive
2. **Reducing memory spikes**: Smaller batches use less memory during insertion
3. **Maintaining user experience**: Progress is visible as chunks appear

### Chunk Size Selection

The default chunk size (200 blocks) balances performance and user experience:

- **Too small** (e.g., 10): Many delays, slow overall insertion
- **Too large** (e.g., 1000): Potential UI freezing
- **Optimal** (200): Good performance without noticeable delays

### Browser Compatibility

Chunked insertion works across all modern browsers and provides graceful degradation for older ones.

## Common Use Cases

### Scenario 1: Blog Platform

```python
class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    content = BlockNoteField(
        help_text="Main blog content",
        template_max_blocks=300,  # Medium-sized templates
        editor_config={'placeholder': 'Write your blog post...'},
        menu_type='blog',
    )

class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        # template_max_blocks=300 automatically applied
```

### Scenario 2: Legal Document System

```python
class Contract(models.Model):
    title = models.CharField(max_length=200)
    content = BlockNoteField(
        help_text="Contract content",
        template_max_blocks=5000,  # Large templates for complex contracts
        editor_config={'placeholder': 'Select a contract template...'},
        menu_type='template',
    )

class ContractForm(BlockNoteModelFormMixin):
    class Meta:
        model = Contract
        fields = ['title', 'content']
        # template_max_blocks=5000 automatically applied
```

### Scenario 3: Note-Taking App

```python
class Note(models.Model):
    title = models.CharField(max_length=100)
    content = BlockNoteField(
        help_text="Note content",
        template_max_blocks=100,  # Small templates for quick notes
        editor_config={'placeholder': 'Quick note...'},
        menu_type='minimal',
    )

class NoteForm(BlockNoteModelFormMixin):
    class Meta:
        model = Note
        fields = ['title', 'content']
        # template_max_blocks=100 automatically applied
```

### Scenario 4: Multi-Field Document

```python
class Report(models.Model):
    title = models.CharField(max_length=200)
    
    executive_summary = BlockNoteField(
        help_text="Executive summary",
        template_max_blocks=100,  # Small templates
        editor_config={'placeholder': 'Executive summary...'},
    )
    
    main_content = BlockNoteField(
        help_text="Main report content",
        template_max_blocks=1500,  # Large templates
        editor_config={'placeholder': 'Main content...'},
    )
    
    appendices = BlockNoteField(
        help_text="Additional materials",
        template_max_blocks=2000,  # Very large templates
        editor_config={'placeholder': 'Appendices...'},
    )

class ReportForm(BlockNoteModelFormMixin):
    class Meta:
        model = Report
        fields = ['title', 'executive_summary', 'main_content', 'appendices']
        # Each field automatically gets its own template limit:
        # executive_summary: 100, main_content: 1500, appendices: 2000
```

## Troubleshooting

### Template Not Inserting

**Problem**: Template selection does nothing

**Solutions**:
1. Check browser console for errors
2. Verify template content is valid JSON (see [Document Templates](./document-templates.md) for structure)
3. Ensure template doesn't exceed block limit
4. Check if slash menu is enabled

### Performance Issues

**Problem**: Editor freezes during template insertion

**Solutions**:
1. Reduce `template_max_blocks` in model field
2. Check for browser memory issues
3. Verify chunk size is reasonable
4. Test with smaller templates first

### Configuration Not Working

**Problem**: Custom limits not being applied

**Solutions**:
1. Verify model field parameter syntax
2. Check Django settings syntax
3. Ensure migrations are applied if field was added
4. Check browser console for configuration errors

### Error Messages Not Appearing

**Problem**: Oversized templates cause crashes instead of errors

**Solutions**:
1. Verify error handling is enabled
2. Check JavaScript console for exceptions
3. Ensure BlockNote version compatibility
4. Test with smaller templates first

## Best Practices

### Setting Appropriate Limits in Models

```python
# Good: Context-appropriate limits based on use case
class BlogPost(models.Model):
    content = BlockNoteField(template_max_blocks=300)  # Blog posts

class LegalContract(models.Model):
    content = BlockNoteField(template_max_blocks=5000)  # Legal documents

class QuickNote(models.Model):
    content = BlockNoteField(template_max_blocks=50)   # Note-taking

# Avoid: One-size-fits-all approach
class Document(models.Model):
    content = BlockNoteField(template_max_blocks=10000)  # Too permissive
```

### Model Field Organization

```python
class Article(models.Model):
    title = models.CharField(max_length=200)
    
    # Organize fields by expected template complexity
    summary = BlockNoteField(
        help_text="Brief article summary",
        template_max_blocks=50,      # Small
        editor_config={'placeholder': 'Brief summary...'},
    )
    
    content = BlockNoteField(
        help_text="Main article content", 
        template_max_blocks=1000,    # Medium
        editor_config={'placeholder': 'Main content...'},
    )
    
    references = BlockNoteField(
        help_text="References and citations",
        template_max_blocks=500,     # Small-medium
        editor_config={'placeholder': 'References...'},
    )
```

### Template Design

1. **Keep templates focused**: Single-purpose templates are easier to manage
2. **Remove empty blocks**: Reduce block count by cleaning up unnecessary spacing
3. **Test with limits**: Ensure your templates fit within intended field limits
4. **Provide alternatives**: Offer multiple smaller templates instead of one large one

> **Tip**: For guidance on designing effective templates, see [Document Templates](./document-templates.md).

### Error Communication

1. **Clear messaging**: Users should understand what went wrong
2. **Actionable solutions**: Provide specific steps to resolve issues
3. **Contact information**: Include support contact for limit increases
4. **Progress indication**: For large templates, show insertion progress

## Migration Guide

### Adding Template Configuration to Existing Models

If you're adding template configuration to existing Django BlockNote fields:

1. **Add the parameter to existing fields**:
```python
# Before
class BlogPost(models.Model):
    content = BlockNoteField(
        editor_config={'placeholder': 'Write your post...'}
    )

# After  
class BlogPost(models.Model):
    content = BlockNoteField(
        editor_config={'placeholder': 'Write your post...'},
        template_max_blocks=500,  # Add this parameter
    )
```

2. **No migration needed**: Adding `template_max_blocks` doesn't change the database schema

3. **Test thoroughly**:
   - Verify existing templates still work
   - Test oversized template handling
   - Check performance with large templates

### Upgrading Forms to Use Mixins

```python
# Before: Manual widget configuration
class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        widgets = {
            'content': BlockNoteWidget(
                template_max_blocks=500,  # Manual configuration
            )
        }

# After: Clean mixin approach
class BlogPostForm(BlockNoteModelFormMixin):
    class Meta:
        model = BlogPost
        fields = ['title', 'content']
        # Configuration comes from model field automatically
```

### Breaking Changes

This feature adds no breaking changes to existing installations:
- Existing fields continue to work without `template_max_blocks`
- Default limits are generous (1000 blocks)
- Error handling only activates for oversized templates
- Forms without mixins continue to work

## API Reference

### Model Field Parameters

```python
BlockNoteField(
    template_max_blocks=None,  # int: Maximum blocks in template (default: 1000)
    editor_config=None,        # dict: Editor configuration
    image_upload_config=None,  # dict: Image upload settings
    image_removal_config=None, # dict: Image removal settings
    menu_type='default',       # str: Slash menu type
    **kwargs                   # Standard Django field arguments
)
```

### Django Settings

```python
DJ_BN_TEMPLATE_CONFIG = {
    'maxBlocks': int,    # Global maximum blocks (default: 1000)
}
```

### Form Mixins

```python
from django_blocknote.forms.mixins import (
    BlockNoteFormMixin,      # For regular forms
    BlockNoteModelFormMixin, # For model forms (recommended)
)

class MyForm(BlockNoteModelFormMixin):
    class Meta:
        model = MyModel
        fields = ['content']
        # template_max_blocks automatically applied from model field
```

### TypeScript Interfaces

```typescript
interface TemplateConfig {
    maxBlocks: number;   // Maximum blocks allowed
    chunkSize: number;   // Blocks per insertion chunk
}

interface CustomSlashMenuProps {
    editor: BlockNoteEditor;
    config?: SlashMenuConfig;
    templates?: DocumentTemplate[];
    templateConfig: TemplateConfig;  // Required template config
}
```

---

*This reference guide covers the template configuration system for Django BlockNote with model field configuration. For information on creating and managing the templates themselves, see [Document Templates](./document-templates.md). The recommended approach is to configure template limits directly in your model fields for clean, maintainable code.*
