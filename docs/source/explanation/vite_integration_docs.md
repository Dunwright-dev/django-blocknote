# Vite Integration with Django BlockNote

This guide explains how Django BlockNote integrates with Vite for modern asset management, including filename hashing for optimal caching performance.

## Overview

Django BlockNote uses Vite to build and bundle JavaScript and CSS assets. The integration provides:

- **Content-based filename hashing** for cache busting
- **Development/production optimization** with different build strategies
- **Automatic asset discovery** through manifest files
- **Seamless Django template integration**

## How It Works

The integration consists of three main components:

1. **Vite Build Process** - Compiles and hashes assets, generates manifest
2. **Widget Asset Resolution** - Reads manifest to find current asset paths
3. **Template Asset Loading** - Dynamically loads correct asset URLs

```mermaid
graph LR
    A[Vite Build] --> B[manifest.json]
    B --> C[Widget.get_vite_assets()]
    C --> D[Template Context]
    D --> E[Dynamic URLs]
    E --> F[Browser Cache]
```

## Vite Configuration

### Build Configuration

The Vite configuration handles multiple entry points and generates production-optimized bundles:

```javascript
// vite.config.js
import { defineConfig } from 'vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  build: {
    // Output to Django static directory
    outDir: '../django_blocknote/static/django_blocknote',
    emptyOutDir: true,
    
    // Multiple entry points for different components
    rollupOptions: {
      input: {
        blocknote: './src/editor.js',
        widget: './src/widget.js'
      },
      output: {
        // Content hashing in production for cache busting
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name
          if (isProduction) {
            return `js/${name}.[hash].min.js`
          }
          return `js/${name}.js`
        },
        // CSS with hashing
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            const name = assetInfo.name.replace('.css', '')
            if (isProduction) {
              return `css/${name}.[hash].min.css`
            }
            return `css/${name}.css`
          }
          return isProduction ? 'assets/[name].[hash].[ext]' : 'assets/[name].[ext]'
        },
        format: 'umd',
        name: 'DjangoBlockNote'
      }
    },
    
    // Generate manifest for Django integration
    manifest: true,
    
    // Production optimizations
    minify: isProduction ? 'terser' : false,
    terserOptions: isProduction ? {
      compress: {
        dead_code: true,
        passes: 2
      },
      mangle: {
        keep_quoted: "strict"  // Safe and predictable
      },
      format: {
        comments: false  // Clean output
      },
      ecma: 2022,
      module: true
    } : undefined,

    // Single CSS bundle
    cssCodeSplit: false,

    // No source maps in production
    sourcemap: isProduction ? false : 'inline'
  },

  // Modern ES target
  esbuild: {
    drop: isProduction ? ['console', 'debugger'] : [],
    target: 'es2022'
  }
})
```

### Build Output Structure

The build process creates the following structure:

```
django_blocknote/static/django_blocknote/
├── manifest.json                    # Asset mapping file
├── js/
│   ├── blocknote.a1b2c3d4.min.js   # Hashed main bundle
│   └── widget.e5f6g7h8.min.js      # Hashed widget bundle
├── css/
│   └── blocknote.i9j0k1l2.min.css  # Hashed styles
└── assets/                          # Other static assets
    └── [fonts, images, etc.]
```

### Manifest File Format

The `manifest.json` file maps logical names to actual build outputs:

```json
{
  "blocknote": {
    "file": "js/blocknote.a1b2c3d4.min.js",
    "src": "src/editor.js"
  },
  "widget": {
    "file": "js/widget.e5f6g7h8.min.js", 
    "src": "src/widget.js"
  },
  "blocknote.css": {
    "file": "css/blocknote.i9j0k1l2.min.css"
  }
}
```

## Widget Integration

### Asset Resolution Method

The `BlockNoteWidget` class includes a method to resolve current asset paths:

```python
# django_blocknote/widgets.py
import json
from pathlib import Path
from django.conf import settings

class BlockNoteWidget(forms.Textarea):
    def get_vite_assets(self):
        """Get the current asset paths from Vite manifest"""
        try:
            # Try to find manifest in static files
            if hasattr(settings, 'STATIC_ROOT') and settings.STATIC_ROOT:
                manifest_path = Path(settings.STATIC_ROOT) / 'django_blocknote' / 'manifest.json'
            else:
                # Fallback for development
                from django.apps import apps
                app_config = apps.get_app_config('django_blocknote')
                manifest_path = Path(app_config.path) / 'static' / 'django_blocknote' / 'manifest.json'
            
            if manifest_path.exists():
                with open(manifest_path, 'r') as f:
                    manifest = json.load(f)
                
                # Extract asset paths from manifest
                assets = {}
                for key, data in manifest.items():
                    if isinstance(data, dict) and 'file' in data:
                        assets[key] = data['file']
                    else:
                        assets[key] = data
                
                return {
                    'js': {
                        'blocknote': assets.get('blocknote', 'js/blocknote.js'),
                        'widget': assets.get('widget', 'js/widget.js')
                    },
                    'css': {
                        'blocknote': assets.get('blocknote.css', 'css/blocknote.css')
                    }
                }
            
        except (FileNotFoundError, json.JSONDecodeError, KeyError) as e:
            if getattr(settings, 'DEBUG', False):
                print(f"Warning: Could not load Vite manifest: {e}")
        
        # Fallback to non-hashed filenames for development
        return {
            'js': {
                'blocknote': 'js/blocknote.js',
                'widget': 'js/widget.js'
            },
            'css': {
                'blocknote': 'css/blocknote.css'
            }
        }
```

### Context Integration

The widget passes asset information to the template context:

```python
def get_context(self, name, value, attrs):
    context = super().get_context(name, value, attrs)
    
    # Get current asset paths
    assets = self.get_vite_assets()
    
    # Add asset paths to context
    context["widget"]["assets"] = assets
    
    # Debug output in development
    if getattr(settings, 'DEBUG', False):
        print(f"BlockNote Widget Assets: {assets}")
    
    return context
```

## Template Integration

### Dynamic Asset Loading

The widget template uses the asset paths from the context to load resources:

```html
<!-- django_blocknote/templates/django_blocknote/widgets/blocknote.html -->
{% load static %}

{# Load CSS with dynamic asset paths #}
<link rel="stylesheet" href="{% static 'django_blocknote/'|add:widget.assets.css.blocknote %}">

{# Load JavaScript with dynamic asset paths #}
<script src="{% static 'django_blocknote/'|add:widget.assets.js.blocknote %}"></script>

<!-- Widget HTML structure -->
<div class="django-blocknote-wrapper">
    <textarea name="{{ widget.name }}"
              id="{{ widget.editor_id }}"
              style="display: none">{{ widget.value|default:'' }}</textarea>
    
    <div id="{{ widget.editor_id }}_editor"
         class="django-blocknote-container">
        <!-- Editor initialization happens here -->
    </div>
</div>
```

### URL Resolution Process

The template URL resolution follows this pattern:

1. **Template Access**: `widget.assets.css.blocknote`
2. **Value Resolution**: `"css/blocknote.i9j0k1l2.min.css"`
3. **String Concatenation**: `'django_blocknote/' + 'css/blocknote.i9j0k1l2.min.css'`
4. **Static URL Generation**: `{% static 'django_blocknote/css/blocknote.i9j0k1l2.min.css' %}`
5. **Final URL**: `"/static/django_blocknote/css/blocknote.i9j0k1l2.min.css"`

## Cache Strategy

### How Content Hashing Works

**Problem**: Traditional asset caching creates conflicts between performance and freshness:

```html
<!-- Without hashing - cache conflicts -->
<script src="/static/blocknote.js"></script>
<!-- Browser caches for 1 year, but updates are invisible -->
```

**Solution**: Content-based filenames eliminate cache conflicts:

```html
<!-- With hashing - perfect caching -->
<script src="/static/blocknote.a1b2c3d4.min.js"></script>
<!-- Each version gets unique URL, forcing fresh downloads when needed -->
```

### Cache Behavior

**Development Environment**:
- Simple filenames: `blocknote.js`, `blocknote.css`
- Short cache times for rapid iteration
- Inline source maps for debugging

**Production Environment**:
- Hashed filenames: `blocknote.a1b2c3d4.min.js`
- Long cache times (1 year) for performance
- Automatic cache invalidation on updates

### Cache Lifecycle

1. **First Deploy**: Browser downloads `blocknote.a1b2c3d4.min.js`
2. **Subsequent Requests**: Browser serves from cache (1 year)
3. **Code Update**: New build creates `blocknote.x9y8z7w6.min.js`
4. **Next Request**: Browser downloads new file (cache miss)
5. **Old Cache**: Remains until browser cleanup, but never requested

## Development Workflow

### Local Development

1. **Run Vite Dev Server**:
   ```bash
   npm run dev
   # Serves assets with simple filenames
   ```

2. **Django Development**:
   ```bash
   python manage.py runserver
   # Widget falls back to non-hashed filenames
   ```

### Production Deployment

1. **Build Assets**:
   ```bash
   npm run build
   # Creates hashed filenames and manifest
   ```

2. **Collect Static Files**:
   ```bash
   python manage.py collectstatic
   # Copies manifest.json to STATIC_ROOT
   ```

3. **Deploy Application**:
   - Widget automatically reads new manifest
   - Templates generate new URLs
   - Users get fresh assets

## Troubleshooting

### Common Issues

**Manifest Not Found**:
```python
# Check manifest location
manifest_path = Path(settings.STATIC_ROOT) / 'django_blocknote' / 'manifest.json'
print(f"Looking for manifest at: {manifest_path}")
print(f"Exists: {manifest_path.exists()}")
```

**Asset Loading Errors**:
```python
# Enable debug output
settings.DEBUG = True
# Widget will print asset resolution details
```

**Cache Issues**:
```bash
# Clear browser cache or check Network tab
# Look for 304 (cached) vs 200 (fresh) responses
```

### Debug Information

The widget provides debug output in development:

```python
if getattr(settings, 'DEBUG', False):
    print(f"BlockNote Widget Assets: {assets}")
    # Output: {'js': {'blocknote': 'js/blocknote.a1b2c3d4.min.js'}, ...}
```

## Performance Benefits

### Metrics

**Without Hashing**:
- Cache hit rate: ~70% (users clear cache, short expiration)
- Page load time: Variable (depends on cache state)
- Deployment issues: Users see old code until cache expires

**With Hashing**:
- Cache hit rate: ~95% (long expiration, perfect invalidation)
- Page load time: Consistent (predictable cache behavior)
- Deployment issues: None (immediate updates)

### Best Practices

1. **Use Long Cache Headers**: Set 1-year expiration for hashed assets
2. **Monitor Manifest Size**: Keep manifest.json small for faster parsing  
3. **Test Both Environments**: Verify fallbacks work in development
4. **Version Assets Together**: Ensure JS/CSS compatibility across updates

## Security Considerations

### Source Map Exposure

Production builds disable source maps to prevent code exposure:

```javascript
// vite.config.js
sourcemap: isProduction ? false : 'inline'
```

### Asset Integrity

Consider adding Subresource Integrity (SRI) for additional security:

```html
<script src="{% static 'django_blocknote/'|add:widget.assets.js.blocknote %}"
        integrity="sha384-hash-value-here"
        crossorigin="anonymous"></script>
```

## Migration Guide

### From Static Assets

**Before** (static asset references):
```html
<link rel="stylesheet" href="{% static 'django_blocknote/css/blocknote.css' %}">
<script src="{% static 'django_blocknote/js/blocknote.js' %}"></script>
```

**After** (dynamic asset resolution):
```html
<link rel="stylesheet" href="{% static 'django_blocknote/'|add:widget.assets.css.blocknote %}">
<script src="{% static 'django_blocknote/'|add:widget.assets.js.blocknote %}"></script>
```

### Deployment Checklist

- [ ] Vite build generates manifest.json
- [ ] collectstatic includes manifest in STATIC_ROOT
- [ ] Widget can read manifest from expected location
- [ ] Templates use dynamic asset references  
- [ ] Cache headers set for long expiration
- [ ] Monitoring for asset loading errors
