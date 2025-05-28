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
    print_warning "Not in a virtual environment. Use this command to Create and Activate, then run setup again:"
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

# Build initial assets
print_status "Building initial frontend assets..."
cd frontend
npm run dev || {
    print_error "Failed to build frontend assets"
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
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Only include STATICFILES_DIRS if the directory exists
STATICFILES_DIRS = []
static_dir = BASE_DIR / 'static'
if static_dir.exists():
    STATICFILES_DIRS.append(static_dir)

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django BlockNote Configuration (for testing different settings)
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
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
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
cat > blog/__init__.py << 'BLOG_INIT_EOF'
BLOG_INIT_EOF

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
        blank=True
    )
    content = BlockNoteField(
        help_text="Main content of the blog post"
    )
    notes = BlockNoteField(
        help_text="Internal notes (for testing multiple editors)",
        blank=True
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
            'summary': BlockNoteWidget(config={
                'placeholder': 'Write a brief summary...',
                'theme': 'light',
            }),
            'content': BlockNoteWidget(config={
                'placeholder': 'Write your blog post content here...',
                'theme': 'light',
                'animations': True,
            }),
            'notes': BlockNoteWidget(config={
                'placeholder': 'Internal notes (private)...',
                'theme': 'dark',
            }),
        }

class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ['author', 'content']
        widgets = {
            'content': BlockNoteWidget(config={
                'placeholder': 'Write your comment...',
                'theme': 'light',
            }),
        }
FORMS_EOF

cat > blog/views.py << 'VIEWS_EOF'
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import BlogPost, Comment
from .forms import BlogPostForm, CommentForm

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
VIEWS_EOF

cat > blog/urls.py << 'BLOG_URLS_EOF'
from django.urls import path
from . import views

urlpatterns = [
    path('', views.post_list, name='post_list'),
    path('post/<int:pk>/', views.post_detail, name='post_detail'),
    path('post/new/', views.post_create, name='post_create'),
    path('post/<int:pk>/edit/', views.post_edit, name='post_edit'),
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
    </style>
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container">
            <a class="navbar-brand" href="{% url 'post_list' %}">Django BlockNote Demo</a>
            <div class="navbar-nav ms-auto">
                <a class="nav-link" href="{% url 'post_create' %}">New Post</a>
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
                <p>Start by <a href="{% url 'post_create' %}">creating your first blog post</a> to test the BlockNote editor.</p>
            </div>
        </div>
    {% endfor %}
</div>
{% endblock %}
POST_LIST_EOF

cat > templates/blog/post_detail.html << 'POST_DETAIL_EOF'
{% extends 'base.html' %}

{% block title %}{{ post.title }} - Django BlockNote Demo{% endblock %}

{% block content %}
<div class="row">
    <div class="col-lg-8">
        <article>
            <h1>{{ post.title }}</h1>
            <p class="text-muted">{{ post.created_at|date:"F d, Y" }}</p>
            
            {% if post.summary %}
                <div class="alert alert-light">
                    <strong>Summary:</strong> {{ post.summary|safe }}
                </div>
            {% endif %}
            
            <div class="mt-4">
                {{ post.content|safe }}
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
                            <div>{{ comment.content|safe }}</div>
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
                <h5>Development Info</h5>
            </div>
            <div class="card-body">
                <p><strong>This demo shows:</strong></p>
                <ul class="small">
                    <li>Multiple BlockNote editors on one page</li>
                    <li>Different themes (light/dark)</li>
                    <li>Custom configurations</li>
                    <li>Form integration</li>
                    <li>Admin integration</li>
                </ul>
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
                {{ form.summary }}
                {% if form.summary.errors %}
                    <div class="text-danger small">{{ form.summary.errors }}</div>
                {% endif %}
            </div>
            
            <div class="mb-3">
                <label for="{{ form.content.id_for_label }}" class="form-label">Content</label>
                <div class="form-text">{{ form.content.help_text }}</div>
                {{ form.content }}
                {% if form.content.errors %}
                    <div class="text-danger small">{{ form.content.errors }}</div>
                {% endif %}
            </div>
            
            <div class="mb-3">
                <label for="{{ form.notes.id_for_label }}" class="form-label">Notes</label>
                <div class="form-text">{{ form.notes.help_text }}</div>
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
                <h5>Editor Features</h5>
            </div>
            <div class="card-body">
                <p><strong>This form demonstrates:</strong></p>
                <ul class="small">
                    <li><strong>Summary:</strong> Light theme</li>
                    <li><strong>Content:</strong> Light theme with animations</li>
                    <li><strong>Notes:</strong> Dark theme</li>
                </ul>
                <p class="small text-muted mt-3">
                    Each editor has different configurations to show the flexibility of the BlockNote widget.
                </p>
            </div>
        </div>
    </div>
</div>
{% endblock %}
POST_FORM_EOF

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

# Create superuser
print_status "Creating superuser (admin/admin)..."
echo "from django.contrib.auth.models import User; User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin')" | python manage.py shell

cd ../..

print_success "Development environment ready!"
echo ""
echo "🚀 To start development:"
echo "  1. Terminal 1: cd frontend && npm run watch"  
echo "  2. Terminal 2: cd examples/demo_project && python manage.py runserver"
echo "  3. Visit: http://127.0.0.1:8000"
echo "  4. Admin: http://127.0.0.1:8000/admin (admin/admin)"
echo ""
echo "Or use the convenience script:"
echo "  ./dev-start.sh"
