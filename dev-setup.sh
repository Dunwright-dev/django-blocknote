#!/bin/bash
# Development setup script for django-blocknote
set -e  # Exit on any error

echo "🚀 Setting up django-blocknote development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in a virtual environment
if [[ "$VIRTUAL_ENV" == "" ]]; then
    print_warning "Not in a virtual environment. Use the command below to Create and Activate or\n\tjust Activate an existing venv, then run setup again:"
    echo "python3.13 -m venv venv && pip install --upgrade pip && source venv/bin/activate"
    exit 1
fi

# Install Python dependencies in development mode
print_status "Installing Python dependencies..."
pip install -e . || {
    print_error "Failed to install Python dependencies"
    exit 1
}

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
cd frontend
npm install || {
    print_error "Failed to install Node.js dependencies"
    exit 1
}
cd ..

# Create demo project
print_status "Creating demo Django project..."

# Remove existing demo project if it exists
if [ -d "examples/demo_project" ]; then
    print_warning "Removing existing demo project..."
    rm -rf examples/demo_project
fi

# Create directory structure
mkdir -p examples/demo_project
cd examples/demo_project

# Create manage.py
cat > manage.py << 'MANAGE_EOF'
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'demo.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)
MANAGE_EOF
chmod +x manage.py

# Create demo project settings
mkdir -p demo

cat > demo/__init__.py << 'DEMO_INIT_EOF'
DEMO_INIT_EOF

cat > demo/settings.py << 'SETTINGS_EOF'
"""
Django settings for demo project.
This is for development of django-blocknote library.
"""
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-demo-key-for-development-only'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Our library (installed in development mode)
    'django_blocknote',
    # Demo app
    'blog',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'demo.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'demo.wsgi.application'

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

# Static files configuration for development
# Include package static to get the new frontend builds
STATICFILES_DIRS = [
    BASE_DIR / 'static',  # Local demo static files
    BASE_DIR.parent.parent / 'django_blocknote' / 'static',  # Package static files
]

# Media files (for uploads)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django BlockNote Configuration
DJ_BN_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
DJ_BN_UPLOAD_PATH = 'blocknote_uploads'  # Directory within MEDIA_ROOT

# Allowed image types for upload
DJ_BN_ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'image/webp'
]

# Allowed document types (for file uploads)
DJ_BN_ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
]

# Widget configuration
DJANGO_BLOCKNOTE = {
    'DEFAULT_CONFIG': {
        'placeholder': 'Start writing your amazing content...',
        'theme': 'light',
        'animations': True,
    },
    'WIDGET_CONFIG': {
        'css_class': 'demo-blocknote-widget',
        'include_css': True,
        'include_js': True,
    },
}

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django_blocknote': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
SETTINGS_EOF

cat > demo/urls.py << 'URLS_EOF'
"""demo URL Configuration"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('blog.urls')),
    # BlockNote upload URLs
    path('django-blocknote/', include('django_blocknote.urls')),
]

# Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
URLS_EOF

cat > demo/wsgi.py << 'WSGI_EOF'
"""
WSGI config for demo project.
"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'demo.settings')

application = get_wsgi_application()
WSGI_EOF

# Create blog app
mkdir -p blog
mkdir -p blog/migrations

cat > blog/__init__.py << 'BLOG_INIT_EOF'
BLOG_INIT_EOF

cat > blog/migrations/__init__.py << 'MIGRATIONS_INIT_EOF'
MIGRATIONS_INIT_EOF

cat > blog/apps.py << 'APPS_EOF'
from django.apps import AppConfig

class BlogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'blog'
APPS_EOF

cat > blog/models.py << 'MODELS_EOF'
from django.db import models
from django_blocknote.fields import BlockNoteField

class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    summary = BlockNoteField(
        help_text="Brief summary of the post",
        blank=True,
    )
    content = BlockNoteField(
        help_text="Main content of the blog post",
        blank=True,
    )
    notes = BlockNoteField(
        help_text="Internal notes (for testing multiple editors)",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Comment(models.Model):
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    author = models.CharField(max_length=100)
    content = BlockNoteField(help_text="Comment content")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Comment by {self.author} on {self.post.title}'
MODELS_EOF

cat > blog/forms.py << 'FORMS_EOF'
from django import forms
from django_blocknote.widgets import BlockNoteWidget
from .models import BlogPost, Comment

class BlogPostForm(forms.ModelForm):
    class Meta:
        model = BlogPost
        fields = ['title', 'summary', 'content', 'notes']
        widgets = {
            'summary': BlockNoteWidget(
                config={
                    'placeholder': 'Write a brief summary...',
                    'theme': 'light',
                },
                upload_config={
                    'uploadUrl': '/django-blocknote/upload-image/',
                    'maxFileSize': 5 * 1024 * 1024,  # 5MB for summary
                    'allowedTypes': ['image/jpeg', 'image/png']
                }
            ),
            'content': BlockNoteWidget(
                config={
                    'placeholder': 'Write your blog post content here...',
                    'theme': 'light',
                    'animations': True,
                },
                upload_config={
                    'uploadUrl': '/django-blocknote/upload-image/',
                    'maxFileSize': 10 * 1024 * 1024,  # 10MB for main content
                    'allowedTypes': ['image/*']  # All image types
                }
            ),
            'notes': BlockNoteWidget(
                config={
                    'placeholder': 'Internal notes (private)...',
                    'theme': 'dark',
                },
                upload_config={
                    'allowedTypes': []  # No uploads for notes
                }
            ),
        }

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['author', 'content']
        widgets = {
            'content': BlockNoteWidget(
                config={
                    'placeholder': 'Write your comment...',
                    'theme': 'light',
                },
                upload_config={
                    'uploadUrl': '/django-blocknote/upload-image/',
                    'maxFileSize': 2 * 1024 * 1024,  # 2MB for comments
                    'allowedTypes': ['image/jpeg', 'image/png', 'image/gif']
                }
            ),
        }

# Demo form to test different upload configurations
class UploadTestForm(forms.Form):
    default_upload = forms.CharField(
        widget=BlockNoteWidget(),  # Uses default settings
        label="Default Upload Configuration",
        required=False
    )
    
    custom_upload = forms.CharField(
        widget=BlockNoteWidget(
            upload_config={
                'uploadUrl': '/django-blocknote/upload-image/',
                'maxFileSize': 1 * 1024 * 1024,  # 1MB limit
                'allowedTypes': ['image/jpeg', 'image/png'],
                'showProgress': True
            }
        ),
        label="Custom Upload Configuration (1MB, JPEG/PNG only)",
        required=False
    )
    
    no_upload = forms.CharField(
        widget=BlockNoteWidget(
            upload_config={
                'allowedTypes': []  # Disable uploads
            }
        ),
        label="No Upload Allowed",
        required=False
    )
FORMS_EOF

cat > blog/views.py << 'VIEWS_EOF'
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import BlogPost, Comment
from .forms import BlogPostForm, CommentForm, UploadTestForm

def post_list(request):
    posts = BlogPost.objects.all()
    return render(request, 'blog/post_list.html', {'posts': posts})

def post_detail(request, pk):
    post = get_object_or_404(BlogPost, pk=pk)
    comments = post.comments.all()
    
    if request.method == 'POST':
        comment_form = CommentForm(request.POST)
        if comment_form.is_valid():
            comment = comment_form.save(commit=False)
            comment.post = post
            comment.save()
            messages.success(request, 'Comment added successfully!')
            return redirect('post_detail', pk=pk)
    else:
        comment_form = CommentForm()
    
    return render(request, 'blog/post_detail.html', {
        'post': post,
        'comments': comments,
        'comment_form': comment_form,
    })

def post_create(request):
    if request.method == 'POST':
        form = BlogPostForm(request.POST)
        if form.is_valid():
            post = form.save()
            messages.success(request, 'Blog post created successfully!')
            return redirect('post_detail', pk=post.pk)
    else:
        form = BlogPostForm()
    
    return render(request, 'blog/post_form.html', {
        'form': form,
        'title': 'Create New Post'
    })

def post_edit(request, pk):
    post = get_object_or_404(BlogPost, pk=pk)
    if request.method == 'POST':
        form = BlogPostForm(request.POST, instance=post)
        if form.is_valid():
            form.save()
            messages.success(request, 'Blog post updated successfully!')
            return redirect('post_detail', pk=pk)
    else:
        form = BlogPostForm(instance=post)
    
    return render(request, 'blog/post_form.html', {
        'form': form,
        'post': post,
        'title': 'Edit Post'
    })

def upload_test(request):
    """Test page for different upload configurations"""
    if request.method == 'POST':
        form = UploadTestForm(request.POST)
        if form.is_valid():
            messages.success(request, 'Upload test form submitted successfully!')
            # In a real app, you'd process the form data here
    else:
        form = UploadTestForm()
    
    return render(request, 'blog/upload_test.html', {
        'form': form,
        'title': 'Upload Configuration Test'
    })
VIEWS_EOF

cat > blog/urls.py << 'BLOG_URLS_EOF'
from django.urls import path
from . import views

urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('post/<int:pk>/', views.post_detail, name='post_detail'),
    path('post/new/', views.post_create, name='post_create'),
    path('post/<int:pk>/edit/', views.post_edit, name='post_edit'),
    path('upload-test/', views.upload_test, name='upload_test'),
]
BLOG_URLS_EOF

cat > blog/admin.py << 'ADMIN_EOF'
from django.contrib import admin
from .models import BlogPost, Comment

@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'created_at', 'updated_at']
    search_fields = ['title']
    list_filter = ['created_at', 'updated_at']

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['author', 'content']
ADMIN_EOF

# Create templates
mkdir -p templates/blog

cat > templates/base.html << 'BASE_TEMPLATE_EOF'
{% load blocknote_tags %}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Django BlockNote Demo{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .demo-blocknote-widget {
            border: 2px dashed #007cba !important;
        }
        .navbar-brand {
            font-weight: bold;
        }
        .upload-info {
            font-size: 0.875rem;
            color: #6c757d;
            margin-top: 0.25rem;
        }
    </style>
    {% blocknote_full %}
    {% blocknote_asset_debug %}
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="{% url 'post_list' %}">Django BlockNote Demo</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="{% url 'post_create' %}">New Post</a>
                <a class="nav-link" href="{% url 'upload_test' %}">Upload Test</a>
                <a class="nav-link" href="/admin/">Admin</a>
            </div>
        </div>
    </nav>
    
    <div class="container mt-4">
        {% if messages %}
            {% for message in messages %}
                <div class="alert alert-{{ message.tags }} alert-dismissible fade show" role="alert">
                    {{ message }}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            {% endfor %}
        {% endif %}
        
        {% block content %}
        {% endblock %}
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
BASE_TEMPLATE_EOF

cat > templates/blog/post_list.html << 'POST_LIST_EOF'
{% extends 'base.html' %}
{% load blocknote_tags %}

{% block title %}Blog Posts - Django BlockNote Demo{% endblock %}

{% block content %}
<div class="d-flex justify-content-between align-items-center mb-4">
    <h1>Blog Posts</h1>
    <a href="{% url 'post_create' %}" class="btn btn-primary">New Post</a>
</div>

<div class="row">
    {% for post in posts %}
        <div class="col-md-6 mb-4">
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">{{ post.title }}</h5>
                    {% if post.summary %}
                      <div class="card-text">
                        {% blocknote_viewer post.summary %}
                      </div>
                    {% endif %}
                    <p class="text-muted small">{{ post.created_at|date:"F d, Y" }}</p>
                    <div class="d-flex gap-2">
                        <a href="{% url 'post_detail' post.pk %}" class="btn btn-outline-primary btn-sm">View</a>
                        <a href="{% url 'post_edit' post.pk %}" class="btn btn-outline-secondary btn-sm">Edit</a>
                    </div>
                </div>
            </div>
        </div>
    {% empty %}
        <div class="col-12">
            <div class="alert alert-info">
                <h4>No posts yet!</h4>
                <p>Start by <a href="{% url 'post_create' %}">creating your first blog post</a> to test the BlockNote editor with image uploads.</p>
                <p>Or try the <a href="{% url 'upload_test' %}">upload test page</a> to see different upload configurations.</p>
            </div>
        </div>
    {% endfor %}
</div>
{% endblock %}
POST_LIST_EOF

cat > templates/blog/post_detail.html << 'POST_DETAIL_EOF'
{% extends 'base.html' %}
{% load blocknote_tags %}

{% block title %}{{ post.title }} - Django BlockNote Demo{% endblock %}

{% block content %}
<div class="row">
    <div class="col-lg-8">
        <article>
            <h1>{{ post.title }}</h1>
            <p class="text-muted">{{ post.created_at|date:"F d, Y" }}</p>
            
           {% if post.summary %}
                <div class="alert alert-light">
                    <strong>Summary:</strong> 
                    {% blocknote_viewer post.summary %}
                </div>
            {% endif %}
            
            <div class="mt-4">
                {% blocknote_viewer post.content %}
            </div> 
            
            <div class="mt-4">
                <a href="{% url 'post_edit' post.pk %}" class="btn btn-outline-primary">Edit Post</a>
                <a href="{% url 'post_list' %}" class="btn btn-outline-secondary">Back to List</a>
            </div>
        </article>
        
        <hr class="my-5">
        
        <section>
            <h3>Comments</h3>
            <form method="post" class="mb-4">
                {% csrf_token %}
                <div class="mb-3">
                    <label for="{{ comment_form.author.id_for_label }}" class="form-label">Name</label>
                    {{ comment_form.author }}
                </div>
                <div class="mb-3">
                    <label for="{{ comment_form.content.id_for_label }}" class="form-label">Comment</label>
                    <div class="upload-info">💡 You can upload images (max 2MB, JPEG/PNG/GIF)</div>
                    {{ comment_form.content }}
                </div>
                <button type="submit" class="btn btn-primary">Add Comment</button>
            </form>
            
            <div class="comments">
                {% for comment in comments %}
                    <div class="card mb-3">
                        <div class="card-body">
                            <h6 class="card-title">{{ comment.author }}</h6>
                            <p class="text-muted small">{{ comment.created_at|date:"F d, Y g:i A" }}</p>
                            <div>{% blocknote_viewer comment.content %}</div>
                        </div>
                    </div>
                {% empty %}
                    <p class="text-muted">No comments yet. Be the first to comment!</p>
                {% endfor %}
            </div>
        </section>
    </div>
    
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h5>Upload Features</h5>
            </div>
            <div class="card-body">
                <p><strong>This demo shows:</strong></p>
                <ul class="small">
                    <li>📸 Image uploads in editors</li>
                    <li>⚙️ Different upload configurations</li>
                    <li>🎨 Multiple editor themes</li>
                    <li>📝 Form integration</li>
                    <li>🔒 Upload restrictions</li>
                </ul>
                <div class="mt-3">
                    <a href="{% url 'upload_test' %}" class="btn btn-sm btn-outline-primary">
                        Test Upload Configs
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
POST_DETAIL_EOF

cat > templates/blog/post_form.html << 'POST_FORM_EOF'
{% extends 'base.html' %}

{% block title %}{{ title }} - Django BlockNote Demo{% endblock %}

{% block content %}
<div class="row">
    <div class="col-lg-8">
        <h1>{{ title }}</h1>
        <form method="post">
            {% csrf_token %}
            <div class="mb-3">
                <label for="{{ form.title.id_for_label }}" class="form-label">Title</label>
                {{ form.title }}
                {% if form.title.errors %}
                    <div class="text-danger small">{{ form.title.errors }}</div>
                {% endif %}
            </div>
            
            <div class="mb-3">
                <label for="{{ form.summary.id_for_label }}" class="form-label">Summary</label>
                <div class="form-text">{{ form.summary.help_text }}</div>
                <div class="upload-info">💡 Upload: max 5MB, JPEG/PNG only</div>
                {{ form.summary }}
                {% if form.summary.errors %}
                    <div class="text-danger small">{{ form.summary.errors }}</div>
                {% endif %}
            </div>
            
            <div class="mb-3">
                <label for="{{ form.content.id_for_label }}" class="form-label">Content</label>
                <div class="form-text">{{ form.content.help_text }}</div>
                <div class="upload-info">💡 Upload: max 10MB, all image types</div>
                {{ form.content }}
                {% if form.content.errors %}
                    <div class="text-danger small">{{ form.content.errors }}</div>
                {% endif %}
            </div>
            
            <div class="mb-3">
                <label for="{{ form.notes.id_for_label }}" class="form-label">Notes</label>
                <div class="form-text">{{ form.notes.help_text }}</div>
                <div class="upload-info">💡 No uploads allowed (for security)</div>
                {{ form.notes }}
                {% if form.notes.errors %}
                    <div class="text-danger small">{{ form.notes.errors }}</div>
                {% endif %}
            </div>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">Save Post</button>
                <a href="{% url 'post_list' %}" class="btn btn-outline-secondary">Cancel</a>
            </div>
        </form>
    </div>
    
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h5>Upload Configuration</h5>
            </div>
            <div class="card-body">
                <p><strong>Each editor demonstrates different upload settings:</strong></p>
                <ul class="small">
                    <li><strong>Summary:</strong> 5MB limit, JPEG/PNG only</li>
                    <li><strong>Content:</strong> 10MB limit, all image types</li>
                    <li><strong>Notes:</strong> No uploads (disabled)</li>
                </ul>
                <p class="small text-muted mt-3">
                    This shows how you can customize upload behavior per field in your forms.
                </p>
            </div>
        </div>
    </div>
</div>
{% endblock %}
POST_FORM_EOF

cat > templates/blog/upload_test.html << 'UPLOAD_TEST_EOF'
{% extends 'base.html' %}

{% block title %}{{ title }} - Django BlockNote Demo{% endblock %}

{% block content %}
<div class="row">
    <div class="col-lg-8">
        <h1>{{ title }}</h1>
        <p class="lead">Test different upload configurations to see how they work.</p>
        
        <form method="post">
            {% csrf_token %}
            
            <div class="mb-4">
                <label for="{{ form.default_upload.id_for_label }}" class="form-label">
                    {{ form.default_upload.label }}
                </label>
                <div class="upload-info">💡 Uses default settings: 10MB max, all image types</div>
                {{ form.default_upload }}
            </div>
            
            <div class="mb-4">
                <label for="{{ form.custom_upload.id_for_label }}" class="form-label">
                    {{ form.custom_upload.label }}
                </label>
                <div class="upload-info">💡 Custom: 1MB max, JPEG/PNG only, with progress</div>
                {{ form.custom_upload }}
            </div>
            
            <div class="mb-4">
                <label for="{{ form.no_upload.id_for_label }}" class="form-label">
                    {{ form.no_upload.label }}
                </label>
                <div class="upload-info">💡 Uploads completely disabled</div>
                {{ form.no_upload }}
            </div>
            
            <div class="d-flex gap-2">
                <button type="submit" class="btn btn-primary">Submit Test</button>
                <a href="{% url 'post_list' %}" class="btn btn-outline-secondary">Back to Posts</a>
            </div>
        </form>
    </div>
    
    <div class="col-lg-4">
        <div class="card">
            <div class="card-header">
                <h5>Testing Instructions</h5>
            </div>
            <div class="card-body">
                <ol class="small">
                    <li>Try uploading images to each editor</li>
                    <li>Test different file sizes and types</li>
                    <li>Check browser console for upload logs</li>
                   <li>Notice the different behaviors</li>
               </ol>
               
               <h6 class="mt-3">Expected Behavior:</h6>
               <ul class="small">
                   <li><strong>Default:</strong> Large images work</li>
                   <li><strong>Custom:</strong> Only small JPEG/PNG</li>
                   <li><strong>No Upload:</strong> No upload button/drag</li>
               </ul>
               
               <div class="alert alert-info mt-3">
                   <small>
                       <strong>💡 Tip:</strong> Open browser dev tools to see upload progress and any errors.
                   </small>
               </div>
           </div>
       </div>
   </div>
</div>
{% endblock %}
UPLOAD_TEST_EOF

# Create static directory to prevent Django warnings
mkdir -p static

# Go back to project root
cd ../..

print_success "Demo project created successfully!"

# Set up database
print_status "Setting up database..."
cd examples/demo_project

python manage.py makemigrations || {
   print_error "Failed to run makemigrations"
   exit 1
}

python manage.py migrate || {
   print_error "Failed to run migrations"
   exit 1
}

python manage.py collectstatic --noinput || {
   print_error "Failed to collectstatic"
   exit 1
}

# Create superuser
print_status "Creating superuser (admin/admin)..."
echo "from django.contrib.auth.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | python manage.py shell

# Create media directory
print_status "Creating media directory for uploads..."
mkdir -p media/blocknote_uploads

cd ../..

print_success "Development environment ready!"

echo ""
echo "🚀 To start development:"
echo "  1. Terminal 1: cd frontend && npm run watch"  
echo "  2. Terminal 2: cd examples/demo_project && python manage.py runserver"
echo "  3. Visit: http://127.0.0.1:8000"
echo "  4. Admin: http://127.0.0.1:8000/admin (admin/admin)"
echo "  5. Upload Test: http://127.0.0.1:8000/upload-test/"
echo ""
echo "🔧 Key Features to Test:"
echo "  • Create new blog posts with image uploads"
echo "  • Try different file sizes and types"
echo "  • Check upload restrictions per editor"
echo "  • View uploaded images in posts"
echo "  • Test comment uploads (2MB limit)"
echo ""
echo "📁 Uploaded files go to: examples/demo_project/media/blocknote_uploads/"
echo ""
echo "Or use the convenience script:"
echo "  ./dev-start.sh"
